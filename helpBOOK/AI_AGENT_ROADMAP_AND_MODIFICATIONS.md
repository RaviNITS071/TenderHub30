# TENDERHUB AI AGENT SUBSYSTEM: STATUS, SPECIFICATIONS, AND MODIFICATIONS GUIDE
Developer Implementation Roadmap for Contractor Intelligence and Tender Dossier Engine

Document ID: ENG-AI-2026-04  
Target Engineer: Incoming AI / Full-Stack Developer  
Scope: `backend/src/services/contractorAgent.service.js`, `frontend/src/pages/Services.jsx`, Associated Models  

---

## 1. PURPOSE AND SYSTEM OVERVIEW

The Contractor AI Agent subsystem is designed to convert raw, unstructured government tender documentation (typically 20 to 120 pages of scanned or compiled PDFs) into a structured engineering dossier.

The primary customer for this feature is an active civil, electrical, or mechanical engineering contractor who needs to answer three operational questions within 60 seconds:
1. "Am I strictly eligible to bid on this tender without getting technically disqualified?" (Turnover, Solvency, Machinery, Experience).
2. "What raw materials (Cement, Steel, Bitumen, Sand, Aggregate) are required, and what is the estimated cost breakdown?" (BOQ Quantity Surveying).
3. "If I win this tender, what are the cash flow milestones, testing standards, and liquidated damage penalties?" (Post-award Execution).

---

## 2. CURRENT IMPLEMENTATION STATUS

### 2.1 File Inventory

| File Path | Role and Responsibilities |
| :--- | :--- |
| `backend/src/services/contractorAgent.service.js` | Core business logic, multi-tier LLM execution, deterministic rule engine, contractor match scoring, and Copilot chat handling. |
| `backend/src/models/TenderAiDossier.js` | MongoDB model storing extracted summaries, pre-bid checklists, BOQ material breakdowns, post-award milestones, and token usage metrics. |
| `backend/src/models/ContractorAgentProfile.js` | MongoDB model storing contractor background (company name, registration class, turnover, solvency limit, machinery inventory, credit quota). |
| `backend/src/models/AiAgentChatSession.js` | MongoDB model persisting interactive Copilot conversations per tender and contractor. |
| `backend/src/controllers/services.controller.js` | HTTP controllers for `/api/v1/services/analyze/:tenderId`, `/chat/:tenderId`, `/contractor-profile`, and `/plans`. |
| `backend/src/routes/services.routes.js` | Express route definitions wired to `app.js`. |
| `frontend/src/pages/Services.jsx` | Full client-side interface featuring tabbed navigation (Overview, Eligibility Fit, Materials & BOQ, Milestones & Safety, Copilot Chat). |

### 2.2 What Works Out-of-the-Box

1. Contractor Profile Persistence:
   - Contractors can view and configure their financial limits and equipment inventory via `/api/v1/services/contractor-profile`.
   - Default baseline profiles are auto-provisioned upon first query.

2. Empirical Gap Analysis (`calculateContractorPersonalizedFit`):
   - Compares contractor turnover against tender value using standard CPWD/PWD guidelines (`required = tenderValue * 1.2`).
   - Checks bank solvency requirement (`required = tenderValue * 0.4`).
   - Checks single work completion requirement (`required = tenderValue * 0.5`).
   - Cross-references project scope (e.g. road work) against contractor's registered equipment (e.g. hot mix plant, sensor paver) and generates actionable warnings.

3. Triple-Tier Analysis Strategy:
   - Tier 1: Google Gemini Flash (`executeGeminiTenderAnalysis` via `@google/generative-ai`).
   - Tier 2: OpenAI Fallback (`gpt-4o-mini`).
   - Tier 3: Zero-Failure Deterministic Engine (`generateDeterministicEngineeringDossier`). If both Gemini and OpenAI keys are unavailable or fail, this engine parses the tender scope and generates an engineering-accurate BOQ, material schedule, and milestone roadmap, ensuring the user interface never crashes.

4. Interactive Copilot Chat:
   - Supports natural language questioning with contextual awareness of the active tender.

---

## 3. WHY THE FEATURE IS INCOMPLETE & WHAT MUST BE MODIFIED

The incoming developer must address the following technical gaps before public launch:

### 3.1 Gap A: Absence of Production Gemini API Key
- State: `backend/.env` currently has no valid `GEMINI_API_KEY`.
- Impact: System currently executes the Tier 3 deterministic fallback engine. While the numbers are engineering-accurate for standard civil works, it cannot read bespoke clauses written by specific department engineers.
- Required Modification:
  1. Acquire an API key from Google AI Studio.
  2. Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-1.5-flash` in `backend/.env`.
  3. Set the same variables in the Render Dashboard environment settings.

### 3.2 Gap B: Direct Ingestion of Full NIT PDF Documents from Cloudflare R2
- State: `contractorAgent.service.js` currently feeds metadata fields (`title`, `department`, `estimatedValue`, `workDescription`, `coversInfo`) into the prompt.
- Problem: Critical fine print (e.g. "Bidder must own an automated testing laboratory within 25 km of the site") is contained inside the attached PDF document, not in the portal summary.
- Required Modification:
  1. Connect `backend/src/config/r2.js` to download the tender's NIT document from Cloudflare R2.
  2. Use `pdf-parse` to extract text from the PDF.
  3. Concatenate the extracted text into the prompt context.
  4. Enable Gemini 1.5 Flash's Context Caching (`GoogleAICacheManager`) so the document is parsed once and cached on Google's servers for subsequent queries.

### 3.3 Gap C: BOQ Line-Item Rate Override & Profit Margin Simulator
- State: The BOQ table in `Services.jsx` displays read-only estimated quantities and rates.
- Requirement: Contractors need to enter their own supplier quotation rates (e.g. inputting their actual local cement price) and have the system calculate total projected project cost and recommended bidding margin.

---

## 4. DETAILED IMPLEMENTATION RUNBOOK FOR THE INCOMING DEVELOPER

### Step 1: Connecting Full PDF Parsing from Cloudflare R2

In `backend/src/services/contractorAgent.service.js`, implement document retrieval prior to calling the LLM:

```javascript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/r2.js';
import pdfParse from 'pdf-parse';

async function extractTextFromTenderDocument(tender) {
  // 1. Locate primary document key
  const docKey = tender.nitDocumentKey || tender.documents?.[0]?.s3Key;
  if (!docKey) return '';

  try {
    // 2. Fetch object from Cloudflare R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'tenderhub',
      Key: docKey,
    });
    const response = await s3Client.send(command);
    
    // 3. Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 4. Extract text via pdf-parse
    const pdfData = await pdfParse(buffer);
    // Limit to first 50,000 words to maintain optimal token efficiency
    return pdfData.text.slice(0, 150000);
  } catch (err) {
    logger.warn(`Could not extract PDF text for tender ${tender._id}: ${err.message}`);
    return '';
  }
}
```

### Step 2: Gemini Prompt Enhancement with Context Caching

Update `executeGeminiTenderAnalysis(tender)` to include the extracted document text:

```javascript
const pdfDocumentText = await extractTextFromTenderDocument(tender);

const prompt = `You are TenderHub's Chief AI Quantity Surveyor and Government Contracting Expert.
Analyze the following tender details and extracted official specification text.

TENDER SUMMARY:
Title: ${tender.title}
Department: ${tender.departmentName}
Estimated Value: INR ${tender.estimatedValue}
EMD: INR ${tender.emdAmount}

EXTRACTED NIT SPECIFICATION TEXT:
${pdfDocumentText ? pdfDocumentText : 'Detailed PDF not available; use tender summary and standard CPWD specifications.'}

Extract and generate the complete structured JSON dossier matching the schema strictly.`;
```

### Step 3: Frontend Custom Rate Editing & Calculation

In `frontend/src/pages/Services.jsx`:
1. Add local state: `const [customRates, setCustomRates] = useState({});`
2. In the Materials table, replace static rate text with an editable input field when in edit mode.
3. Compute total recalculated cost dynamically:
   ```javascript
   const totalRecalculatedCost = materials.reduce((acc, item) => {
     const unitRate = customRates[item.name] !== undefined ? customRates[item.name] : item.rawRate;
     return acc + (unitRate * item.rawQuantity);
   }, 0);
   ```

---

## 5. REVENUE AND TOKEN COST ECONOMICS

### Gemini 1.5 Flash Token Costs:
- Input Tokens: $0.075 per 1,000,000 tokens (~₹6.25 per 1M tokens)
- Output Tokens: $0.30 per 1,000,000 tokens (~₹25.00 per 1M tokens)
- Cached Input Tokens: $0.01875 per 1,000,000 tokens (~₹1.56 per 1M tokens)

### Per-Tender Analysis Cost Calculation:
- Average 30-page tender text: ~25,000 tokens
- Prompt engineering overhead: ~2,000 tokens
- Total Input: 27,000 tokens = $0.002 (~₹0.17)
- Dossier Output: 3,500 tokens = $0.001 (~₹0.08)
- **Total Compute Cost per Tender Dossier: ~$0.003 (~₹0.25 to ₹0.35 INR)**

### Pricing & Profit Margin Analysis:
- User Price for Pro AI Tier (10 Dossiers + 100 Copilot Queries): ₹999 / month.
- Platform Compute Cost for 10 Dossiers + 100 Queries: ~₹15.00 INR.
- Gross Margin on AI Subscriptions: **> 98%**.

---

End of AI Subsystem Specifications.
