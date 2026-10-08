# TENDERHUB CLOUDFLARE ANTI-BOT & SCRAPING DEFENSE PLAN
Edge Security Architecture, WAF Rulesets, Bot Fight Mode, and Turnstile Integration

Document ID: SEC-CF-2026-05  
Status: Implementation Specification & Architectural Plan  
Target: DevOps Engineer / Full-Stack Security Engineer  
Scope: Cloudflare Edge (DNS, WAF, Bot Management, Turnstile) & Backend (`botShield.middleware.js`)  

---

## 1. EXECUTIVE SUMMARY & THREAT MODEL

### 1.1 The Threat Landscape
As a procurement aggregation platform, TenderHub curates high-value, structured government tender metadata, pricing benchmarks, and Bill of Quantities (BOQ) files. This makes the platform a target for:
1. **Competitor Scrapers**: Automated scripts harvesting daily tender catalogs to build rival databases without doing the difficult web scraping of government portals.
2. **Aggressive Crawlers & Resource Exhaustion**: Scrapers repeatedly querying `/api/v1/tenders?page=X` with high concurrency, saturating Render CPU limits and exhausting MongoDB connection pools.
3. **Credential Stuffing & Account Takeover**: Distributed botnets attempting credential stuffing on `/api/v1/auth/login`.
4. **Document Bandwidth Leeching**: Direct linking of Cloudflare R2 presigned URLs, bypassing subscription gates to obtain proprietary BOQ Excel files and compressed NIT specifications.

### 1.2 Edge Defense vs. Application Defense
While TenderHub already features local Express middleware (`botShield.middleware.js`) and Redis rate limiting, application-level defense alone is insufficient:
- Every bot request reaching Express consumes Render compute cycles, memory, and database connections.
- **Cloudflare Edge Defense** intercepts, challenges, and drops malicious requests at Cloudflare's global anycast points of presence before packets ever touch the Render origin server.

---

## 2. SYSTEM TOPOLOGY: END-TO-END DEFENSE ARCHITECTURE

```
[ INCOMING TRAFFIC: Users, Browsers, Scrapers, Botnets ]
                          |
                          v
+-----------------------------------------------------------------------------------+
|                           CLOUDFLARE GLOBAL EDGE (WAF)                            |
|                                                                                   |
|  1. TLS / SSL Inspection & JA3/JA4 Fingerprinting                                 |
|  2. Super Bot Fight Mode (Managed Challenges for Definite / Likely Bots)         |
|  3. Cloudflare Turnstile Token Validation (Invisible CAPTCHA)                    |
|  4. Edge Rate Limiting Rules (/api/v1/tenders*, /api/v1/auth/*)                  |
|  5. Datacenter ASN & Proxy IP Filtering (AWS, DigitalOcean, Hetzner)              |
|  6. Cloudflare Authenticated Origin Pull (Mutual TLS Client Certificate)         |
+-----------------------------------------------------------------------------------+
                          |
                          | Clean, Authenticated HTTPS Traffic Only
                          | Header: CF-Connecting-IP, CF-Ray, CF-IPCountry
                          v
+-----------------------------------------------------------------------------------+
|                        RENDER ORIGIN SERVER (Node.js API)                         |
|                                                                                   |
|  1. Origin Hardening: Reject requests missing valid Cloudflare headers            |
|  2. botShield.middleware.js: Redis IP blacklisting, honeypot traps                |
|  3. Auth & Session Guards: JWT token validation, verified user roles              |
+-----------------------------------------------------------------------------------+
```

---

## 3. IMPLEMENTATION PLAN: SIX PHASES TO PRODUCTION

### Phase 1: Cloudflare Proxy & Origin Hardening

#### Objective:
Ensure all public traffic routes through Cloudflare and enforce that the Render backend rejects direct-to-origin bypass attempts.

#### Steps:
1. **DNS Orange-Cloud Proxying**:
   - In Cloudflare DNS, configure CNAME records:
     - `tenderhub.in` &rarr; points to frontend CDN (Proxied / Orange Cloud).
     - `api.tenderhub.in` &rarr; points to `tenderhub-backend-jofq.onrender.com` (Proxied / Orange Cloud).
2. **SSL/TLS Encryption Mode**:
   - Set Cloudflare SSL/TLS to **Full (Strict)**.
   - Enforce **Minimum TLS Version 1.2** and enable **HTTP/3 (with QUIC)**.
3. **Authenticated Origin Pulls (AOP)**:
   - Enable Authenticated Origin Pulls in Cloudflare SSL/TLS settings.
   - In Render Web Service settings, enable client certificate validation or configure a custom shared secret header (`X-Origin-Verify-Secret`).
4. **Origin Validation in Express Middleware**:
   Update `backend/src/middleware/botShield.middleware.js` to ensure incoming requests in production genuinely originate from Cloudflare:
   ```javascript
   export const verifyCloudflareOrigin = (req, res, next) => {
     if (process.env.NODE_ENV === 'production') {
       const cfRay = req.headers['cf-ray'];
       const cfConnectingIp = req.headers['cf-connecting-ip'];
       if (!cfRay || !cfConnectingIp) {
         // Request bypassed Cloudflare and attempted direct origin connection
         logger.warn(`[BotShield] Direct-to-origin bypass attempt blocked from ${req.ip}`);
         return res.status(403).json({ error: 'Direct access to origin server prohibited.' });
       }
     }
     next();
   };
   ```

---

### Phase 2: Cloudflare Super Bot Fight Mode Configuration

#### Objective:
Automatically challenge automated headless browsers (Playwright, Puppeteer, Selenium) using behavioral and machine learning analysis.

#### Dashboard Configuration (`Cloudflare Dashboard -> Security -> Bots`):
1. **Bot Fight Mode**: Enable.
2. **Definitely Automated Traffic**: Set action to **Block**.
   - Targets known automated scraping libraries, Python scripts (`urllib`, `requests`), and automated exploit scanners.
3. **Likely Automated Traffic**: Set action to **Managed Challenge**.
   - Cloudflare presents an invisible Turnstile challenge. Legitimate human users with valid browser environments pass in < 100 ms without manual interaction. Headless scrapers lacking full browser DOM APIs fail and are stopped at the edge.
4. **Verified Bots**: Set action to **Allow**.
   - Whitelists verified search engine crawlers (Googlebot, Bingbot) ensuring public tender landing pages remain indexed for SEO.

---

### Phase 3: Cloudflare WAF Custom Rules & Scraper Defense

#### Objective:
Granular firewall rules targeting specific API endpoints vulnerable to scraping.

#### Rule Set 1: Sensitive Catalog Rate Limiting
- **Target URL**: `(http.request.uri.path eq "/api/v1/tenders" and http.request.method eq "GET")`
- **Condition**: Greater than 25 requests per 10 seconds per IP address.
- **Action**: Managed Challenge (Cloudflare Turnstile) for 5 minutes.
- **Rationale**: Prevents scrapers from paginating through 500 pages of tenders in a few seconds.

#### Rule Set 2: Authentication Brute Force Protection
- **Target URL**: `(http.request.uri.path contains "/api/v1/auth/login" or http.request.uri.path contains "/api/v1/auth/register")`
- **Condition**: Greater than 5 requests per 60 seconds per IP address.
- **Action**: Block for 1 hour.
- **Rationale**: Completely shuts down automated credential stuffing and dictionary attacks.

#### Rule Set 3: Datacenter ASN & Cloud Proxy Blocking
- **Target Expression**:
  ```
  (ip.geoip.asnum in {16509 14618 14061 24940 16276 51167 63949} and 
   not http.request.uri.path contains "/health" and 
   not cf.client.bot)
  ```
- **Description**: ASNs belonging to Amazon AWS, DigitalOcean, Hetzner, OVH, and Linode where 98% of residential scraping proxies operate.
- **Action**: Managed Challenge.
- **Rationale**: Real contractors browse from mobile networks (Jio, Airtel) or broadband ISPs (BSNL, ACT), not from Amazon AWS data centers.

---

### Phase 4: Cloudflare Turnstile Integration (Invisible CAPTCHA)

Cloudflare Turnstile replaces annoying image CAPTCHAs with an invisible cryptographic challenge verifying user authenticity.

#### 4.1 Frontend Component (`frontend/src/components/TurnstileWidget.jsx`)
```jsx
import { useEffect, useRef } from 'react';

export const TurnstileWidget = ({ onVerify, onError }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = renderWidget;
    } else {
      renderWidget();
    }

    function renderWidget() {
      if (containerRef.current && window.turnstile) {
        window.turnstile.render(containerRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          callback: (token) => onVerify(token),
          'error-callback': () => onError?.(),
          theme: 'light',
          size: 'invisible', // Invisible execution
        });
      }
    }
  }, []);

  return <div ref={containerRef} className="my-2" />;
};
```

#### 4.2 Backend Verification Middleware (`backend/src/middleware/turnstile.middleware.js`)
```javascript
import axios from 'axios';
import pino from 'pino';

const logger = pino();

export const verifyTurnstileToken = async (req, res, next) => {
  // Bypass in local development
  if (process.env.NODE_ENV !== 'production') return next();

  const token = req.body['cf-turnstile-response'] || req.headers['x-turnstile-token'];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Human verification required. Please complete the security check.',
      code: 'TURNSTILE_TOKEN_MISSING'
    });
  }

  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const clientIp = req.headers['cf-connecting-ip'] || req.ip;

    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: clientIp,
      }),
      { timeout: 5000 }
    );

    if (response.data.success) {
      return next();
    } else {
      logger.warn(`Turnstile verification failed for IP ${clientIp}: ${JSON.stringify(response.data['error-codes'])}`);
      return res.status(403).json({
        success: false,
        message: 'Security verification failed. Please refresh and try again.',
        code: 'BOT_CHALLENGE_FAILED'
      });
    }
  } catch (err) {
    logger.error(`Turnstile verification server error: ${err.message}`);
    // Fail closed on security verification errors
    return res.status(500).json({ success: false, message: 'Security verification service unavailable.' });
  }
};
```

---

### Phase 5: Cloudflare R2 Document Hotlinking & Asset Security

#### Objective:
Prevent competitors or scrapers from mass-downloading NIT documents and BOQ Excel files directly from R2 without an active user session.

#### Policy Specifications:
1. **Signed URLs with Ephemeral Expiration**:
   - In `backend/src/config/r2.js`, all presigned URLs for tender downloads (`GetObjectCommand`) are generated with a strict `expiresIn: 900` (15 minutes).
2. **WAF Referer Header Enforcement**:
   - In Cloudflare WAF, configure a rule on `docs.tenderhub.in/*`:
     ```
     (http.request.uri.path contains "/documents/" and 
      not http.referer contains "tenderhub.in")
     ```
   - Action: Block. Prevents external websites from embedding TenderHub files in iframes or direct hotlinks.

---

### Phase 6: Operational Monitoring & Analytics

#### Metrics to Monitor in Cloudflare Dashboard:
1. **Security &rarr; Analytics &rarr; Threats Blocked**: Monitor daily volume of blocked scraping attempts.
2. **Bots &rarr; Bot Traffic Overview**: Track ratio of Human vs. Verified Bot vs. Automated Bot requests.
3. **WAF Events &rarr; Sampled Logs**: Inspect top attacking IP addresses, ASNs, and countries of origin to fine-tune rate limiting.

---

## 4. ENVIRONMENT VARIABLES CHECKLIST

Add these variables to `backend/.env` and `frontend/.env.production`:

### Backend Environment Variables
```env
# Cloudflare Turnstile Server Verification
TURNSTILE_SECRET_KEY=0x4AAAAAA...your_turnstile_secret_key...

# Cloudflare Origin Pull Hardening (Optional Shared Token)
CLOUDFLARE_ORIGIN_VERIFY_SECRET=cf_origin_sec_8923419028341
```

### Frontend Environment Variables
```env
# Cloudflare Turnstile Public Site Key
VITE_TURNSTILE_SITE_KEY=0x4AAAAAA...your_turnstile_site_key...
```

---

End of Cloudflare Anti-Bot & Scraping Defense Plan.
