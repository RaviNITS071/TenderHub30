# TENDERHUB — PROJECT SUMMARY & ARCHITECTURE REFERENCE

Enterprise Procurement Intelligence and Contractor AI Platform

---

## 1. EXECUTIVE OVERVIEW

TenderHub is a web platform designed to automate the discovery, ingestion, analysis, and management of government procurement tenders in India (with primary production ingestion tailored for the NIC-GEP / `jktenders.gov.in` portal infrastructure).

The platform addresses manual bidding friction through four integrated technical pillars:
1. Automated Web Crawling & Ingestion: Headless browser automation (Playwright) capable of navigating complex ASP.NET / NIC-GEP portals, handling multi-department directories, solving CAPTCHAs, and downloading documents.
2. Storage & Compression Pipeline: Native Ghostscript PDF compression and Cloudflare R2 object storage for NIT (Notice Inviting Tender) and BOQ (Bill of Quantities) documents.
3. Billing & Pro Subscriptions: Razorpay gateway integration with asynchronous webhooks and dual-path signature verification.
4. AI Contractor Intelligence: Multi-tiered LLM engine (Google Gemini Flash + OpenAI + Deterministic civil engineering fallback) extracting structured pre-bid dossiers, BOQ material breakdowns, and post-award milestones.

---

## 2. TECHNOLOGY STACK

### Backend Stack
| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (ES Modules), Express.js 5 | REST API server with routing, controllers, and middleware. |
| **Database & ODM** | MongoDB, Mongoose 9 | Document database storing tenders, users, subscriptions, AI dossiers, and preferences. |
| **Caching & Job Queue** | Redis (Upstash / Local), BullMQ 6, ioredis 6 | Distributed queue handling crawl jobs, stats caching, and rate limiting. |
| **Browser Automation** | Playwright (Chromium) | Headless browser crawler for NIC-GEP tender portals (`JKTenderAdapter.js`). |
| **PDF Processing** | Ghostscript (`gswin64c` / `gs`), pdf-parse | Compresses downloaded PDFs prior to Cloudflare R2 storage; extracts text. |
| **Cloud Storage** | Cloudflare R2 (`@aws-sdk/client-s3`) | S3-compatible zero-egress bucket storing NIT documents and work items. |
| **AI LLM Engine** | Google Gemini (`@google/generative-ai`), OpenAI | Analyzes tender documents, builds BOQ schedules, and powers Copilot chat. |
| **Payment Gateway** | Razorpay SDK (`razorpay`) | Order generation, subscription management, and webhook verification. |
| **Notifications** | AiSensy (WhatsApp Business API) | Real-time tender alert dispatches and payment confirmation receipts. |
| **Security & Logging** | Helmet, bcryptjs, jsonwebtoken, Pino | Security headers, password hashing, JWT auth, and structured JSON logging. |

### Frontend Stack
| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Core Framework** | React 19, Vite 8 | High-performance client-side single page application. |
| **Styling & Design System** | Tailwind CSS 3.4, PostCSS, Framer Motion | Curated color palette, dark mode support, glassmorphism, responsive grids. |
| **State Management** | Zustand 5 | Client-side stores: `useBookmarkStore`, `usePreferenceStore`. |
| **Data Fetching & Caching**| TanStack React Query 5, Axios | Server state management, auto-refetching, and API request interceptors. |
| **Routing** | React Router v7 | Client routing (`/`, `/tenders`, `/services`, `/profile`, `/pricing`, etc.). |

---

## 3. MASTER ROUTE INVENTORY

### Backend API Endpoints (`/api/v1`)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh-token`, `GET /auth/google`
- Tenders: `GET /tenders`, `GET /tenders/:id`, `GET /tenders/stats`, `GET /tenders/departments`
- Contractor: `GET /contractor/saved-tenders`, `POST /contractor/saved-tenders/:id`, `GET /contractor/profile`
- Billing: `GET /billing/plans`, `GET /billing/status`, `POST /billing/create-order`, `POST /billing/verify-payment`, `POST /billing/webhook`
- Services & AI: `GET /services/plans`, `POST /services/analyze/:tenderId`, `POST /services/chat/:tenderId`, `GET /services/contractor-profile`, `PUT /services/contractor-profile`
- Notifications: `GET /notifications/preferences`, `PUT /notifications/preferences`
- Admin: `GET /admin/stats`, `POST /admin/trigger-crawl`

### Frontend Application Routes
- `/` — Landing page with live metrics, search bar, and platform features.
- `/tenders` — Public tender catalog with multi-dimensional filtering and instant document downloads.
- `/tenders/:id` — In-depth inspection page with official covers, tender fees, and submission schedules.
- `/services` — Contractor AI Intelligence Hub (Pre-Bid Dossier, BOQ Breakdowns, Milestones, Copilot Chat).
- `/check-score` — Empirical bid eligibility and gap calculation calculator.
- `/pricing` — Subscription plans, feature comparison, and Razorpay checkout modal.
- `/profile` — Contractor workspace, company details, financial thresholds, and saved tenders.
- `/about` & `/contact` — Platform information and contact inquiry forms.

---

## 4. CURRENT STATUS & NEXT STEPS FOR INCOMING DEVELOPER

### Completed
- [x] Portal Ingestion & Ghostscript PDF compression pipeline.
- [x] Dual-database failover (Primary MongoDB -> Secondary MongoDB).
- [x] Cloudflare R2 multi-region document storage.
- [x] Razorpay Order Creation, Verification, and Webhook processing.
- [x] AiSensy WhatsApp alert dispatcher.
- [x] Full Contractor AI Dossier schema and multi-tier analysis engine with rule-based fallback.
- [x] Standardized symmetrical layout across all frontend pages.
- [x] Removal of all legacy `TODO.md` placeholder files.

### Next Steps (Detailed in `docs/AI_AGENT_ROADMAP_AND_MODIFICATIONS.md`)
- [ ] Add production Google Gemini API key to `backend/.env` and Render environment settings.
- [ ] Implement direct streaming of NIT PDF text from Cloudflare R2 to Gemini Flash context.
- [ ] Implement client-side interactive BOQ rate editing and Excel export in `Services.jsx`.

---

End of Project Summary.
