# TENDERHUB INFRASTRUCTURE, CLOUD SERVICES, AND OPERATING COSTS
Detailed Financial and Capacity Plan for Server Infrastructure and Third-Party Subscriptions

Document ID: FIN-OPS-2026-01  
Audience: Engineering Management, Devops, Incoming Technical Lead  
Currency Base: USD ($) and INR (₹) at standard conversion rate (1 USD = 83.50 INR)  

---

## 1. MONTHLY INFRASTRUCTURE EXPENSE SUMMARY

The platform is designed to operate on a hybrid serverless and containerized architecture, allowing low baseline operating costs during initial growth while scaling predictably under heavy crawling loads.

### 1.1 Baseline Production Tier (0 to 1,000 Active Contractors)

| Service Provider | Service / Resource | Pricing Model | Monthly Cost (USD) | Monthly Cost (INR) | Mandatory / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Render** | Backend Web Service (Node.js API + Crons) | Starter ($7) or Standard ($25) Instance | $7.00 - $25.00 | ₹585 - ₹2,090 | Mandatory |
| **Render / Vercel** | Frontend Web Hosting (Vite React SPA) | Static Site / Hobby Tier | $0.00 (Free) | ₹0 | Mandatory |
| **MongoDB Atlas** | Managed MongoDB Cluster (M0 / M2 Tier) | 512 MB Free or Shared M2 ($9/mo) | $0.00 - $9.00 | ₹0 - ₹750 | Mandatory |
| **Upstash Redis** | Serverless Redis (Cache + BullMQ + BotShield) | 10,000 commands/day free, then pay-per-req | $0.00 - $5.00 | ₹0 - ₹420 | Mandatory |
| **Cloudflare R2** | Object Storage (NIT & BOQ PDF Files) | 10 GB free, $0.015/GB-mo, $0 egress | $0.00 - $1.00 | ₹0 - ₹85 | Mandatory |
| **AiSensy / Meta** | WhatsApp Business API (Automated Alerts) | Base Plan (~₹999) + per-convo fees | $15.00 - $25.00 | ₹1,250 - ₹2,100 | Mandatory |
| **Brevo** | Transactional Email Service | Free Tier (300 emails/day) | $0.00 (Free) | ₹0 | Mandatory |
| **CapSolver** | CAPTCHA Solving API for Portal Crawler | Pay-as-you-go ($0.80 per 1,000 solves) | $2.00 - $4.00 | ₹165 - ₹335 | Mandatory |
| **Google Cloud** | Google AI Studio (Gemini 1.5 Flash API) | Pay-as-you-go per token | $5.00 - $12.00 | ₹420 - ₹1,000 | Mandatory |
| **Telegram Bot** | Off-Site Database Snapshot Storage | Free Bot API (unlimited 50 MB files) | $0.00 (Free) | ₹0 | Optional |
| **Razorpay** | Payment Gateway Commission | 2% per successful transaction | Transactional | 2% of GMV | Mandatory |
| **TOTAL BASELINE** | — | — | **$29.00 - $81.00** | **₹2,420 - ₹6,780** | — |

---

## 2. SCALING TIERS & RESOURCE FORECASTS

### 2.1 Growth Tier (1,000 to 10,000 Contractors)

As data volume and crawler frequency expand, the infrastructure migrates to dedicated instances:

| Component | Target Architecture | Reason for Upgrade | Projected Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render Pro (2 CPU, 4 GB RAM) | Handling 250+ concurrent contractor requests | $50.00 / mo (~₹4,175) |
| **Background Workers** | Dedicated Render Worker Instance | Isolating Playwright browser scraping from API | $25.00 / mo (~₹2,090) |
| **Database** | MongoDB Atlas M10 (Dedicated Cluster) | High IOPs, automated continuous snapshots, PITR | $57.00 / mo (~₹4,760) |
| **Redis** | Upstash Pro / Redis Cloud Dedicated | Zero latency for 100k daily rate-limit queries | $20.00 / mo (~₹1,670) |
| **Storage** | Cloudflare R2 (~150 GB PDFs) | Storing 20,000+ historical tender documents | $2.25 / mo (~₹190) |
| **WhatsApp Alerts** | AiSensy Pro + Meta Utility Conversations | Disagreeing 10,000+ daily contractor alerts | ~$60.00 / mo (~₹5,000) |
| **AI LLM API** | Gemini 1.5 Flash (Context Cached) | Processing 2,000+ dossiers/month | ~$35.00 / mo (~₹2,920) |
| **TOTAL (GROWTH)** | — | — | **~$249.25 / mo (~₹20,800 INR)** |

---

## 3. UNIT ECONOMICS AND SUBSCRIPTION MARGIN ANALYSIS

The platform operates on high gross margins due to zero-egress Cloudflare storage and efficient Gemini 1.5 Flash token rates.

### Monthly Per-User Cost & Margin Breakdown

| Subscription Tier | Customer Price | Infrastructure & Service Cost Per Active User | Net Contribution Margin |
| :--- | :--- | :--- | :--- |
| **TenderHub Pro Monthly** | ₹999.00 | • Database & API: ~₹2.50<br>• WhatsApp Alerts: ~₹15.00<br>• Razorpay (2%): ~₹20.00 | **₹961.50 (96.2%)** |
| **TenderHub Pro Annual** | ₹2,999.00 | • Database & API: ~₹30.00<br>• WhatsApp Alerts: ~₹180.00<br>• Razorpay (2%): ~₹60.00 | **₹2,729.00 (91.0%)** |
| **Contractor AI Suite (Monthly)** | ₹2,499.00 | • Gemini LLM Compute (35 Dossiers): ~₹12.00<br>• Copilot Chat Queries (350): ~₹7.00<br>• Razorpay (2%): ~₹50.00 | **₹2,430.00 (97.2%)** |

---

## 4. OPTIMIZATION STRATEGIES TO KEEP COSTS LOW

1. Ghostscript PDF Compression:
   - Built into `backend/src/services/PDFCompressor.js`.
   - Shrinks downloaded tender documents by 45% to 65% before transmitting to Cloudflare R2.
   - Reduces both storage volume and PDF-parsing token extraction overhead.

2. Global Dossier Caching:
   - When a contractor requests an AI Dossier for a popular tender, the full analysis is saved in `TenderAiDossier`.
   - When a second or third contractor requests that same tender, the system does not re-invoke Google Gemini. It immediately loads the cached engineering analysis and executes the personalized fit check locally via CPU calculations in < 5 ms.

3. Cloudflare R2 vs AWS S3:
   - Traditional AWS S3 charges $0.09 per GB of egress data. If 500 contractors download a 30 MB drawing file, AWS charges $1.35 in egress alone.
   - Cloudflare R2 has zero data egress fees, keeping document distribution costs effectively flat.

4. Telegram Disaster Recovery:
   - The backup script (`backend/src/scripts/backupDb.js`) sends encrypted database snapshots to a private Telegram channel via the Telegram Bot API at zero cost.

---

End of Infrastructure Costs and Pricing Document.
