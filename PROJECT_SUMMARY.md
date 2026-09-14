# TenderHub — Project Summary & Architecture Reference

## 1. Executive Overview

**TenderHub** (Tender Intelligence Platform) is an enterprise-grade AI-powered web platform designed to automate the discovery, ingestion, analysis, and management of government and commercial procurement tenders.

The platform targets the complex, fragmented tender bidding landscape (initially focused on the Jammu & Kashmir e-procurement portal `jktenders.gov.in`, with an extensible adapter architecture). It addresses manual search friction and document complexity by combining:
1. **Automated Web Crawling & Ingestion**: Headless browser automation (Playwright) capable of navigating complex ASP.NET / NIC-GEP portals, handling multi-department directories, and downloading documents.
2. **Storage & Compression Pipeline**: Native Ghostscript PDF compression and Cloudflare R2 / S3 object storage for NIT (Notice Inviting Tender) and BOQ (Bill of Quantities) documents.
3. **Queue-Based Asynchronous Processing**: BullMQ backed by Redis for decoupled portal syncing and AI analysis jobs.
4. **AI Summarization & Eligibility Extraction**: OpenAI and OCR (pdf-parse / Tesseract.js) to summarize complex multi-page tender specifications and highlight qualification criteria.
5. **Modern Contractor Workspace**: A high-performance MERN + Vite + Tailwind CSS frontend featuring rich search/filtering, real-time metrics, bookmarking, and company profile management.

---

## 2. Technology Stack

### Backend Stack
| Layer | Technology | Description |
|---|---|---|
| **Runtime & Framework** | Node.js (ES Modules), Express.js 5 | REST API server with routing, controllers, and middleware. |
| **Database & ODM** | MongoDB, Mongoose 9 | Document database storing tenders, users, organizations, bids, and AI analyses. |
| **Caching & Job Queue** | Redis, BullMQ 6, ioredis 6 | Distributed queue handling `TenderQueue` (sync jobs) and `AIQueue` (analysis jobs). |
| **Browser Automation** | Playwright (Chromium) | Headless browser crawler for NIC-GEP tender portals (`JKTenderAdapter.js`). |
| **PDF Processing & Compression** | Ghostscript (`gswin64c` / `gs`), pdf-parse | Compresses downloaded PDFs by ~50% prior to Cloudflare R2 storage; extracts text. |
| **Cloud Storage** | Cloudflare R2 / AWS S3 (`@aws-sdk/client-s3`) | S3-compatible bucket storing compressed NIT documents and work item files. |
| **AI & OCR** | OpenAI API (`openai`), Tesseract.js | Extracts summaries, key eligibility criteria, and handles scanned PDF fallbacks. |
| **Security & Logging** | Helmet, bcryptjs, jsonwebtoken, Pino, pino-http | Security headers, password hashing, JWT auth, and structured JSON logging. |

### Frontend Stack
| Layer | Technology | Description |
|---|---|---|
| **Core Framework** | React 19, Vite 8 | Ultra-fast client-side single page application. |
| **Styling & Design System** | Tailwind CSS 3.4, PostCSS, Framer Motion | Curated color palette ("Dal Blue", "Chinar Red", "Paper"), glassmorphic UI, animations. |
| **State Management** | Zustand 5 | Client-side stores: `useBookmarkStore`, `usePreferenceStore`, `useAuthStore`. |
| **Data Fetching & Caching**| TanStack React Query 5, Axios | Server state management, auto-refetching, and API request interceptors. |
| **Icons & UI Utilities** | Lucide React, clsx, tailwind-merge | Modern icon set and conditional className utilities. |
| **Routing** | React Router v7 | Client-side routing (`/`, `/tenders`, `/tenders/:id`, `/profile`, `/pricing`, `/about`, `/contact`). |

---

## 3. Repository Directory Structure

```
tenderHub/
├── .gitignore
├── README.md
├── TODO.md                           # Master project roadmap & infrastructure checklist
├── docs/
│   └── TODO.md                       # Documentation goals (Architecture, Env vars, API spec)
├── backend/
│   ├── .env                          # Backend environment variables
│   ├── package.json                  # Backend dependencies and scripts
│   ├── trigger.js                    # CLI script to trigger manual queue sync jobs
│   ├── src/
│   │   ├── app.js                    # Express application setup, security, and route mounts
│   │   ├── server.js                 # Server entry point, DB/Redis connection bootstrap
│   │   ├── config/
│   │   │   ├── db.js                 # Mongoose connection logic
│   │   │   ├── env.js                # Environment variable validation & central config
│   │   │   └── redis.js              # ioredis client initialization
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Register, login, refresh, logout
│   │   │   ├── bid.controller.js     # Bid management CRUD
│   │   │   ├── document.controller.js# Presigned URLs and upload confirmations
│   │   │   ├── organization.controller.js # Multi-tenant organization profile management
│   │   │   └── tender.controller.js  # Search, filter, pagination, stats, and AI trigger
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── errorHandler.middleware.js # Centralized HTTP error handler
│   │   │   ├── rateLimiter.middleware.js  # IP and token rate limiting via Redis
│   │   │   ├── rbac.middleware.js    # Role-based access control (owner, admin, member)
│   │   │   ├── tenantScope.middleware.js  # Tenant isolation enforcement
│   │   │   └── validate.middleware.js     # Request payload validation
│   │   ├── models/
│   │   │   ├── AiAnalysis.js         # Stored AI summary and eligibility criteria
│   │   │   ├── Bid.js                # Tenant bid proposal records
│   │   │   ├── CompanyDocument.js    # Contractor uploaded compliance documents
│   │   │   ├── Organization.js       # Tenant organization schema
│   │   │   ├── OrganizationMember.js # User-Organization role mapping
│   │   │   ├── SyncJob.js            # Ingestion crawler history and statistics
│   │   │   ├── Task.js               # Bidding task workflow tracker
│   │   │   ├── Tender.js             # Comprehensive tender schema (~110 fields)
│   │   │   ├── TenderDocument.js     # Tender file metadata & storage URLs
│   │   │   ├── TenderRequirement.js  # Explicit extracted tender requirements
│   │   │   └── User.js               # User authentication & credentials
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # /api/v1/auth
│   │   │   ├── bid.routes.js         # /api/v1/bids
│   │   │   ├── document.routes.js    # /api/v1/documents
│   │   │   ├── organization.routes.js# /api/v1/organizations
│   │   │   └── tender.routes.js      # /api/v1/tenders
│   │   ├── services/
│   │   │   ├── ai.service.js         # OpenAI integration for document comprehension
│   │   │   ├── ocr.service.js        # pdf-parse + Tesseract.js fallback OCR
│   │   │   └── adapters/
│   │   │       ├── TenderSourceAdapter.js # Abstract base class for portal crawlers
│   │   │       ├── JKTenderAdapter.js     # Playwright scraper for jktenders.gov.in
│   │   │       ├── DummyTenderAdapter.js  # Local test fixtures adapter
│   │   │       ├── cache.service.js       # Redis caching helpers
│   │   │       ├── matching.service.js    # Tender-contractor qualification scoring
│   │   │       └── notification.service.js# In-app and email alert dispatch
│   │   ├── utils/
│   │   │   ├── auth.utils.js         # JWT signing & cookie helpers
│   │   │   └── r2Storage.js          # Cloudflare R2 / S3 file upload utilities
│   │   ├── validators/               # Input validation schemas (auth, bid, tender, doc)
│   │   └── workers/
│   │       ├── index.js              # Dedicated worker process entry point (`npm run worker`)
│   │       ├── queue.js              # BullMQ queue instances (`TenderQueue`, `AIQueue`)
│   │       ├── tenderSync.worker.js  # Scraper execution & MongoDB upsert worker
│   │       └── aiSummary.worker.js   # Background AI summarization worker
│   └── tests/                        # Backend test files
│
└── frontend/
    ├── index.html
    ├── package.json                  # Frontend dependencies and Vite config
    ├── tailwind.config.js            # Custom color schemes, typography, and animations
    ├── vite.config.js
    └── src/
        ├── App.jsx                   # Route provider and layout shell
        ├── main.jsx                  # React DOM mount, React Query provider
        ├── index.css                 # Base Tailwind styles & custom variables
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx        # Navigation bar with search, links, and bookmark count
        │   │   └── Footer.jsx        # Platform footer with portal links and info
        │   ├── shared/
        │   │   ├── TenderCard.jsx    # Standard tender listing card with status badges & tags
        │   │   ├── PreferenceModal.jsx # First-time user preference questionnaire
        │   │   └── Pagination.jsx    # Dynamic page navigation controls
        │   └── ui/                   # Reusable components: Badge, Button, Input, Modal, Select
        ├── hooks/
        │   ├── useDebounce.js        # Debounce hook for real-time search inputs
        │   └── useTenders.js         # React Query hooks for fetching tenders & tender details
        ├── pages/
        │   ├── Home.jsx              # Landing page with hero search & infinite category carousel
        │   ├── Tenders.jsx           # Filterable tender catalog (Search, Org, Dept, Location, Date)
        │   ├── TenderDetails.jsx     # Detailed tender view with NIT docs, covers, fees, and dates
        │   ├── Profile.jsx           # Contractor workspace (Saved tenders, company info, preferences)
        │   ├── Pricing.jsx           # Subscription tiers
        │   ├── About.jsx             # Platform mission & technology overview
        │   └── Contact.jsx           # Support & inquiry form
        ├── services/
        │   └── api.js                # Axios client with base URL & JWT interceptors
        ├── store/
        │   ├── useBookmarkStore.js   # Persisted bookmark state
        │   ├── usePreferenceStore.js # User preferences & category filters
        │   └── useAuthStore.js       # Auth token & user state
        └── utils/
            └── formatters.js         # Currency (INR), date formatting, and text truncators
```

---

## 4. Key Workflows & Pipelines

### A. Scraper & Ingestion Pipeline (`JKTenderAdapter` + `tenderSync.worker.js`)
1. **Trigger**: Cron job or manual trigger via `backend/trigger.js` pushes an event to `TenderQueue`.
2. **Crawl**: `JKTenderAdapter` launches Playwright, traverses the department index of `jktenders.gov.in`, and extracts active tender tables.
3. **Download & Compress**: Associated PDF documents are downloaded, run through Ghostscript (`gswin64c` / `gs`) using the `/ebook` preset (150 DPI) to achieve ~50% reduction, and uploaded to Cloudflare R2 storage.
4. **Normalize & Deduplicate**: The raw scraped portal metadata is transformed into the schema format and upserted into MongoDB via `Tender.findOneAndUpdate({ sourcePortal, sourceTenderId })` with index-backed uniqueness.

### B. AI Analysis Pipeline (`aiSummary.worker.js` + `ai.service.js`)
1. **Trigger**: An API request to `POST /api/v1/tenders/:id/analyze` enqueues a job into `AIQueue`.
2. **Text Extraction**: The worker reads the tender document from storage, extracts text via `ocr.service.js` (using `pdf-parse` for digital PDFs and `tesseract.js` for scanned documents).
3. **LLM Analysis**: `ai.service.js` constructs a structured prompt for OpenAI to extract:
   - Plain-English executive summary.
   - Key eligibility criteria (turnover, past experience, licensing).
   - Critical submission deadlines and risk factors.
4. **Persistence**: Saves the output in the `AiAnalysis` collection and caches it against the document's SHA-256 hash.

### C. Search, Filter & Aggregation (`tender.controller.js`)
- **Multi-Field Search**: Case-insensitive regex matching across title, work description, reference number, and portal ID.
- **Hierarchical Department Filtering**: Filter by issuing organization or department through `organisationChain`.
- **Location & Deadline**: Filter by location string and closing date threshold (`closingDays`).
- **Real-Time Aggregated Stats**: Fast MongoDB aggregation pipelines for active tender counts, unique authority counts, and total estimated procurement value (`$sum: "$estimatedValue"`).

---

## 5. Current Implementation Status

### Completed Components
- [x] **Core Express Architecture**: Security middleware (Helmet, CORS), JSON/Cookie parsers, Pino HTTP logging, and centralized error handling.
- [x] **Database & Queue Infrastructure**: Mongoose and Redis initialization with SSL/TLS support.
- [x] **Portal Scraping & Document Storage**: Production-grade Playwright crawler for J&K tenders with Ghostscript compression and Cloudflare R2 integration.
- [x] **Tender Model & Controller**: Full ~110-field tender schema with compound indexes, paginated listing, single retrieval, and aggregation endpoints.
- [x] **BullMQ Background Workers**: Dedicated worker service structure running `tenderSync.worker.js` and `aiSummary.worker.js`.
- [x] **Frontend Design & Navigation**: Dal Blue & Chinar Red design system, dark mode readiness, animated landing page, and responsive navbar/footer.
- [x] **Tender Directory & Detail View**: Interactive directory with 5 search/filter dimensions and deep inspection page mirroring official government tender formats.
- [x] **Contractor Profile Workspace**: Saved tenders store (bookmarks) with persistent local storage.

### In Progress / Upcoming (Per Project Roadmap)
- [ ] **Frontend Authentication Flow**: Building `Login.jsx` and `Register.jsx`, and connecting `useAuthStore.js` to `/api/v1/auth`.
- [ ] **Additional Data Models**: Finalizing `CompanyProfile.js`, `BidDocument.js`, and `BidRequirement.js`.
- [ ] **Matching Engine**: Completing `matching.service.js` to calculate deterministic compatibility scores between contractor profiles and tender criteria.
- [ ] **DevOps & Containerization**: Root `docker-compose.yml` (MongoDB + Redis) and GitHub Actions CI pipeline.

---

## 6. How to Run Locally

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **MongoDB**: Local instance or MongoDB Atlas connection string
- **Redis**: Local instance or Upstash / Cloud Redis connection string
- **Ghostscript**: Installed and in system `PATH` (optional for local mock mode, required for PDF compression)
- **Playwright**: Browsers installed via `npx playwright install`

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env file with MONGODB_URI, REDIS_URL, R2 credentials, and OPENAI_API_KEY
npm run dev        # Starts API server at http://localhost:8000 (or PORT from .env)
npm run worker     # In a separate terminal: starts the BullMQ background workers
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server (typically at http://localhost:5173 or 5174)
```

---
*Summary generated on: 2026-09-14 — Antigravity Agent*
