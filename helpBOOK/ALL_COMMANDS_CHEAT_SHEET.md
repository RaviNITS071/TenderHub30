# TENDERHUB CLI & COMMANDS CHEAT SHEET
Complete Operations, Crawlers, Database, and Build Commands Reference

Document ID: REF-CMD-2026-02  
Audience: Developers, DevOps Engineers, System Administrators  
Format: Classical Monospaced Reference  

---

## 1. BACKEND OPERATIONS (`cd backend`)

### 1.1 Local Server Execution

```bash
# Start development server with live reload on port 8000
npm run dev

# Start production server (direct node execution)
npm start

# Start standalone background BullMQ worker
npm run worker
```

---

### 1.2 Web Scraping & Ingestion Routines

```bash
# Fetch tenders published in the last 24 to 48 hours (Daily Routine)
npm run scrape:latest

# Crawl all active tenders across all departments (Full Ingestion)
npm run scrape:all

# Prompt for a specific historical date to scrape tenders
npm run scrape:date

# Download missing NIT and BOQ PDF documents for existing tenders
npm run fetch:pending-docs

# Full comprehensive scrape (metadata + document downloads)
npm run scrape:complete
```

---

### 1.3 Database Maintenance & Data Migrations

```bash
# Export MongoDB database collections to local archive
npm run backup:db

# Restore MongoDB database collections from local archive
npm run restore:db

# Export full system state (MongoDB collections + R2 metadata)
npm run backup:full

# Restore full system state
npm run restore:full

# Synchronize primary Cloudflare R2 bucket to secondary backup R2 bucket
npm run sync:mirror

# Flag all tenders whose closing date has passed as EXPIRED
npm run purge:expired

# Audit and normalize inconsistent date formats across tender records
npm run reconcile:dates

# Migrate and standardize department naming taxonomy
npm run migrate:dept

# Enrich metadata for existing scraped records
npm run enrich:metadata
```

---

### 1.4 PDF Architecture & Documentation Compilers

```bash
# Compile Disaster Recovery Manual into PDF in docs/
npm run manual:disaster

# Compile Production Deployment Manual into PDF in docs/
npm run manual:deployment

# Compile Future Configurations and Failover Guide into PDF in docs/
npm run manual:future

# Compile Executive Crawl Audit Report into PDF in docs/
npm run report:pdf

# Compile Portal Adapters Architecture Guide into PDF in docs/
npm run manual:adapters

# Compile all PDF manuals and guides in one execution
npm run manuals:all
```

---

## 2. FRONTEND OPERATIONS (`cd frontend`)

```bash
# Start local Vite development server (http://localhost:5173)
npm run dev

# Start local test server on alternate port (http://localhost:5175)
npm run dev:test

# Compile production bundle into frontend/dist/
npm run build

# Preview local production build (http://localhost:4173)
npm run preview

# Run ESLint across all JSX and JS source files
npm run lint
```

---

## 3. ADMIN PANEL OPERATIONS (`cd admin-panel`)

```bash
# Start Admin Panel development server on port 5174
npm run dev

# Compile Admin Panel production bundle
npm run build

# Preview Admin Panel production build
npm run preview
```

---

## 4. USEFUL CURL TESTING COMMANDS

```bash
# Check backend server health
curl -s http://localhost:8000/health

# Fetch public subscription plans
curl -s http://localhost:8000/api/v1/billing/plans

# Test tender search API
curl -s "http://localhost:8000/api/v1/tenders?page=1&limit=5&status=ACTIVE"

# Test tender summary aggregation statistics
curl -s http://localhost:8000/api/v1/tenders/stats
```

---

End of CLI and Commands Cheat Sheet.
