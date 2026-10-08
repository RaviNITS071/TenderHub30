# TENDERHUB SYSTEM ARCHITECTURE & DATA FLOW SPECIFICATION
Detailed Data Pipeline, Communication Protocols, and Component Interactions

Document ID: ARCH-FLOW-2026-03  
Scope: Entire Backend and Frontend Monorepo  
Format: Classical Monospaced Text and Structured Schemas  

---

## 1. COMPONENT RELATIONSHIPS AND ARCHITECTURAL TOPOLOGY

The application is structured as a decoupled client-server architecture with an asynchronous worker pipeline.

```
[ BROWSER CLIENT: React 19 SPA ]
          |
          | HTTPS (JSON REST API + HttpOnly Cookies)
          v
[ REVERSE PROXY / HOST: Render Cloud ]
          |
          v
[ BACKEND API: Express 5 Application (src/app.js) ]
   |
   +---> [ BotShield Middleware (src/middleware/botShield.middleware.js) ]
   |
   +---> [ JWT / Auth Guard (src/middleware/auth.middleware.js) ]
   |
   +---> [ Business Controllers & Modules ]
          |
          +---> [ Billing Module (src/modules/billing) ] <=== Razorpay Webhooks
          |
          +---> [ Notification Engine (src/modules/notifications) ] ===> AiSensy WhatsApp
          |
          +---> [ AI Agent Service (src/services/contractorAgent.service.js) ] ===> Gemini Flash
          |
          +---> [ Tender Engine (src/services/tender.service.js) ]
                 |
                 +---> [ Redis Cache Layer (src/config/redis.js) ]
                 |
                 +---> [ MongoDB Primary / Fallback (src/config/db.js) ]
                 |
                 +---> [ Cloudflare R2 Client (src/config/r2.js) ]
```

---

## 2. DETAILED DATA FLOW SEQUENCES

### 2.1 Sequence A: Tender Ingestion and Document Storage Pipeline

```
[Scheduler / Cron] ---> [JKTenderAdapter.js]
                             |
                             | 1. Launch Playwright (Chromium)
                             v
                 [NIC-GEP Portal (jktenders.gov.in)]
                             |
                             | 2. Intercept ViewState & Solve CAPTCHA via CapSolver
                             v
                 [Parse HTML Tender Tables]
                             |
                             | 3. Extract Metadata (Title, Value, Dates, Dept)
                             v
                 [Check Document Links (NIT / BOQ)]
                 /                                \
        (Has Attachments)                  (No Attachments)
               /                                    \
  4a. Stream PDF to Disk                             \
       |                                              \
  4b. Ghostscript Compress                             \
       |                                                \
  4c. Upload to Cloudflare R2                            \
       |                                                  \
  4d. Attach R2 Keys                                       \
               \                                          /
                v                                        v
                 [Upsert Tender Record in MongoDB (Tender.js)]
                             |
                             | 5. Invalidate Redis Stats Cache ('tenders:stats:*')
                             v
                 [Trigger Notification Matcher for Subscribed Contractors]
```

#### Key Implementation Details:
- Deduplication Key: `sourceTenderId` (e.g. `2026_PWD_321045_1`).
- Date Standardization: All portal timestamps are parsed from `DD-MMM-YYYY hh:mm AM/PM` to native JavaScript ISO `Date` objects in UTC.
- Storage Optimization: Files larger than 2 MB are compressed via Ghostscript with `/ebook` preset before transmitting to Cloudflare R2.

---

### 2.2 Sequence B: Payment, Webhook, and Activation Reconciliation

```
[Contractor] ---> [Frontend Checkout UI]
                         |
                         | 1. POST /api/v1/billing/create-order (planId)
                         v
              [BillingController.js]
                         |
                         | 2. Call Razorpay API: orders.create({ amount, notes: { userId, planId } })
                         v
              [Razorpay Gateway]
                         |
                         | 3. Return order_id
                         v
[Contractor Completes Payment on Razorpay Modal]
          /                                \
  (Path 1: Client Callback)          (Path 2: Asynchronous Webhook)
        /                                    \
4a. POST /api/v1/billing/verify-payment      4b. POST /api/v1/billing/webhook
    - orderId, paymentId, signature              - Header: X-Razorpay-Signature
       |                                         - Body: payment.captured event
       v                                             |
5a. HMAC-SHA256 Signature Check                      v
    against RAZORPAY_KEY_SECRET              5b. HMAC-SHA256 Signature Check
       |                                         against RAZORPAY_WEBHOOK_SECRET
       \                                             /
        \                                           /
         v                                         v
   6. Replay Check: Verify paymentId not already redeemed in Subscription model
         |
   7. Upsert Subscription (Set status = 'active', calculate currentPeriodEnd)
         |
   8. Upgrade User.role to 'contractor' & set dailyTenderViews.viewsLimit = 'Unlimited'
         |
   9. Credit AI Dossiers & Copilot Queries in ContractorAgentProfile
         |
  10. Asynchronously dispatch WhatsApp receipt via AiSensy
```

#### Dual-Path Reconciliation Guarantee:
Even if a contractor's mobile device loses internet connectivity or closes the browser tab immediately after UPI authorization, Path 2 (Server-to-Server Webhook) ensures their subscription and AI tokens are activated within seconds.

---

### 2.3 Sequence C: Contractor AI Analysis and Gap Evaluation

```
[Contractor clicks "Generate AI Dossier"]
                 |
                 | POST /api/v1/services/analyze/:tenderId
                 v
   [ContractorAgentService.js]
                 |
                 | 1. Query MongoDB for Tender record
                 v
   [Check Existing Global TenderAiDossier]
          /                            \
   (Found & COMPLETED)            (Not Found / First Request)
         /                               \
2a. Re-use cached Dossier          2b. Verify Contractor has > 0 AI Credits
        |                                 |
        |                          3. Execute Analysis Engine:
        |                             - Primary: Google Gemini Flash
        |                             - Secondary: OpenAI gpt-4o-mini
        |                             - Tertiary: Deterministic Civil Engine
        |                                 |
        |                          4. Save extracted Dossier to MongoDB
        |                          5. Deduct 1 credit from Contractor Profile
        \                                /
         \                              /
          v                            v
   [calculateContractorPersonalizedFit(tender, contractorProfile, dossier)]
                 |
                 | - Turnover check (Target: 120% of tender value)
                 | - Solvency check (Target: 40% of tender value)
                 | - Equipment check (Tender scope vs. registered machinery)
                 v
   [Return Unified JSON to Client: { dossier, personalizedFit }]
```

---

## 3. MONGOOSE DATA SCHEMAS & KEY RELATIONSHIPS

### 3.1 Primary Collections

1. `Tender` (`backend/src/models/Tender.js`):
   - `sourceTenderId`: String, Unique, Indexed.
   - `title`: String, Text Indexed.
   - `departmentName`: String, Indexed.
   - `estimatedValue`: Number, Indexed.
   - `closingDate`: Date, Indexed.
   - `status`: Enum (`'ACTIVE'`, `'CLOSING_SOON'`, `'EXPIRED'`).
   - `documents`: Array of `{ name, s3Key, url, sizeBytes, docType }`.

2. `User` (`backend/src/models/User.js`):
   - `email`: String, Unique.
   - `role`: Enum (`'user'`, `'contractor'`, `'admin'`, `'owner'`).
   - `dailyTenderViews`: `{ count, lastResetDate, viewsLimit }`.
   - `refreshToken`: String (Hashed).

3. `Subscription` (`backend/src/modules/billing/models/Subscription.js`):
   - `userId`: ObjectId -> User.
   - `planId`: String (`'pro_monthly'`, `'pro_annual'`, etc.).
   - `status`: Enum (`'active'`, `'cancelled'`, `'expired'`).
   - `gatewayPaymentId`: String, Unique (Replay prevention).
   - `currentPeriodEnd`: Date.

4. `ContractorAgentProfile` (`backend/src/models/ContractorAgentProfile.js`):
   - `userId`: ObjectId -> User, Unique.
   - `companyName`: String.
   - `registrationClass`: String.
   - `avgAnnualTurnoverInr`: Number.
   - `solvencyLimitInr`: Number.
   - `machineryInventory`: Array of `{ name, category, quantity, isOwned }`.
   - `credits`: `{ planTier, availableDossiers, usedDossiers, copilotQueriesLimit }`.

5. `TenderAiDossier` (`backend/src/models/TenderAiDossier.js`):
   - `tenderId`: ObjectId -> Tender.
   - `sourceTenderId`: String, Indexed.
   - `summary`: String.
   - `preBidAnalysis`: `{ eligibilityCriteria, mandatoryDocumentChecklist, boqMaterialBreakdown, riskAndRedFlags }`.
   - `postAwardAnalysis`: `{ procurementSchedule, milestones, qualityAndSafetyCompliance, penaltyClauses }`.
   - `aiEngine`: `{ model, promptTokens, completionTokens, cachedTokens, latencyMs }`.

---

End of System Architecture & Data Flow Specification.
