/**
 * @file backend/src/services/reconciliation.service.js
 * @description Automated Portal Reconciliation Service.
 * Periodically verifies active tender counts against jktenders.gov.in (FrontEndTendersByOrganisation).
 * Automatically detects notices that departments cancelled, superseded, or retracted early,
 * marking them as CANCELLED (isDelisted: true) to maintain 100% parity with the live portal.
 */
import { chromium } from 'playwright';
import Tender from '../models/Tender.js';
import SystemLog from '../models/SystemLog.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino();

export class ReconciliationService {
  constructor() {
    this.portalUrl = 'https://jktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page';
    this.isReconciling = false;
  }

  /**
   * Primary entry point for reconciliation.
   * Compares department counts, pinpoints delisted tenders, and updates status in MongoDB.
   * @param {string} triggeredBy - e.g. 'CRON_SCHEDULE_03AM', 'POST_SWEEP', 'ADMIN_MANUAL'
   */
  async reconcileActiveTenders(triggeredBy = 'MANUAL') {
    if (this.isReconciling) {
      logger.warn('[Reconciliation] Another reconciliation run is already active. Skipping.');
      return { skipped: true, reason: 'ALREADY_RUNNING' };
    }

    this.isReconciling = true;
    const startTime = Date.now();

    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }

      const now = new Date();
      logger.info(`[Reconciliation] 🔍 Starting active tender reconciliation (Triggered by: ${triggeredBy})...`);

      // 1. Fetch portal summary table from FrontEndTendersByOrganisation
      const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();
      
      try {
        await page.goto(this.portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch (err) {
        logger.error(`[Reconciliation] Failed to load portal page: ${err.message}`);
        await browser.close();
        this.isReconciling = false;
        return { error: `Failed to load portal: ${err.message}` };
      }

      const portalDepts = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.list_table tr, table#table tr'));
        const results = [];
        rows.forEach(r => {
          const tds = r.querySelectorAll('td');
          if (tds.length >= 3) {
            const orgName = tds[1].innerText.trim();
            const a = tds[2].querySelector('a');
            const count = parseInt(tds[2].innerText.trim(), 10);
            if (orgName && !isNaN(count)) {
              results.push({ orgName, count, href: a ? a.href : null });
            }
          }
        });
        return results;
      });

      if (!portalDepts || portalDepts.length === 0) {
        logger.error('[Reconciliation] Could not extract organisation counts from portal.');
        await browser.close();
        this.isReconciling = false;
        return { error: 'Empty portal organisation table' };
      }

      const portalTotal = portalDepts.reduce((sum, d) => sum + d.count, 0);
      logger.info(`[Reconciliation] 🏛️ Portal reports ${portalDepts.length} organisations with ${portalTotal} total active tenders.`);

      // 2. Query MongoDB active tenders grouped by top-level organisation
      const dbActiveTenders = await Tender.find({
        status: 'ACTIVE',
        isDelisted: { $ne: true },
        closingDate: { $gte: now }
      }).select('sourceTenderId organisationChain closingDate tenderReferenceNumber title');

      const dbOrgMap = new Map();
      dbActiveTenders.forEach(t => {
        const topOrg = t.organisationChain ? t.organisationChain.split('||')[0].trim() : 'UNKNOWN';
        if (!dbOrgMap.has(topOrg)) dbOrgMap.set(topOrg, []);
        dbOrgMap.get(topOrg).push(t);
      });

      logger.info(`[Reconciliation] 💾 TenderHub DB reports ${dbActiveTenders.length} active tenders across ${dbOrgMap.size} organisations.`);

      // 3. Find departments where DB has more tenders than Portal
      const mismatchedDepts = [];
      for (const pDept of portalDepts) {
        // Match department in DB (exact or substring)
        let dbOrgName = null;
        let dbList = [];
        for (const [k, list] of dbOrgMap.entries()) {
          if (k.toLowerCase() === pDept.orgName.toLowerCase() || k.includes(pDept.orgName) || pDept.orgName.includes(k)) {
            dbOrgName = k;
            dbList = list;
            break;
          }
        }

        const dbCount = dbList.length;
        const diff = dbCount - pDept.count;
        if (diff > 0) {
          mismatchedDepts.push({
            portalName: pDept.orgName,
            dbName: dbOrgName || pDept.orgName,
            portalCount: pDept.count,
            dbCount,
            surplus: diff,
            href: pDept.href,
            dbTenders: dbList
          });
        }
      }

      if (mismatchedDepts.length === 0) {
        logger.info('✅ [Reconciliation] All department counts match or DB has no surplus active tenders. Parity confirmed.');
        await browser.close();
        this.isReconciling = false;
        return {
          success: true,
          portalTotal,
          dbActiveTotal: dbActiveTenders.length,
          delistedCount: 0,
          durationMs: Date.now() - startTime
        };
      }

      logger.info(`[Reconciliation] ⚠️ Found ${mismatchedDepts.length} department(s) with DB surplus tenders. Reconciling...`);

      // 4. Targeted scan: scrape portal active IDs for mismatched departments only
      const allDelistedTenders = [];

      for (const dept of mismatchedDepts) {
        if (!dept.href) continue;
        logger.info(`[Reconciliation] Scanning "${dept.portalName}" (Portal: ${dept.portalCount}, DB: ${dept.dbCount}, Surplus: +${dept.surplus})...`);

        try {
          await page.goto(dept.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const portalActiveIds = new Set();
          let pageNum = 1;
          let hasNext = true;

          while (hasNext) {
            const ids = await page.evaluate(() => {
              const text = document.body.innerText;
              return text.match(/202[0-9]_[A-Z0-9]+_[0-9]+_[0-9]+/g) || [];
            });
            ids.forEach(id => portalActiveIds.add(id));

            // Check pagination
            const nextLink = await page.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a'));
              const n = links.find(l => l.innerText.trim() === 'Next' || l.innerText.trim() === 'Next >');
              return n ? n.href : null;
            });

            if (nextLink && !nextLink.includes('javascript:void(0)')) {
              pageNum++;
              await page.goto(nextLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
            } else {
              const nextElem = await page.$('a:text("Next")');
              if (nextElem && pageNum < 100) {
                pageNum++;
                await Promise.all([
                  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
                  nextElem.click()
                ]);
              } else {
                hasNext = false;
              }
            }
          }

          // Compute set difference: DB tenders not found in portal
          const missingInDept = dept.dbTenders.filter(t => !portalActiveIds.has(t.sourceTenderId));
          logger.info(`[Reconciliation] Identified ${missingInDept.length} delisted tender(s) in "${dept.portalName}".`);

          missingInDept.forEach(t => {
            allDelistedTenders.push({
              sourceTenderId: t.sourceTenderId,
              title: t.title,
              tenderReferenceNumber: t.tenderReferenceNumber,
              department: dept.portalName,
              closingDate: t.closingDate
            });
          });
        } catch (err) {
          logger.error(`[Reconciliation] Error scanning department "${dept.portalName}": ${err.message}`);
        }
      }

      await browser.close();

      // 5. Update delisted tenders in MongoDB (Option A: Mark as CANCELLED)
      let markedCount = 0;
      if (allDelistedTenders.length > 0) {
        const delistedIds = allDelistedTenders.map(t => t.sourceTenderId);
        const updateResult = await Tender.updateMany(
          { sourceTenderId: { $in: delistedIds } },
          {
            $set: {
              status: 'CANCELLED',
              isDelisted: true,
              cancelledAt: new Date(),
              delistReason: 'DELISTED_ON_PORTAL_BEFORE_CLOSING_DATE'
            }
          }
        );
        markedCount = updateResult.modifiedCount;

        logger.info(`✅ [Reconciliation] Successfully marked ${markedCount} tender(s) as CANCELLED (isDelisted: true).`);

        // Log audit event to SystemLog
        await SystemLog.create({
          level: 'INFO',
          category: 'RECONCILIATION',
          message: `Reconciliation marked ${markedCount} delisted tender(s) as CANCELLED`,
          details: {
            triggeredBy,
            totalDelisted: markedCount,
            tenders: allDelistedTenders.map(t => ({
              id: t.sourceTenderId,
              ref: t.tenderReferenceNumber,
              dept: t.department,
              title: t.title?.slice(0, 80)
            }))
          },
          timestamp: new Date()
        }).catch(err => logger.error(`[Reconciliation] SystemLog failed: ${err.message}`));
      }

      const finalActiveCount = await Tender.countDocuments({
        status: 'ACTIVE',
        isDelisted: { $ne: true },
        closingDate: { $gte: new Date() }
      });

      const durationMs = Date.now() - startTime;
      logger.info(`🎉 [Reconciliation] Complete in ${(durationMs / 1000).toFixed(1)}s. Active Tenders in DB now: ${finalActiveCount} (Portal: ${portalTotal}).`);

      return {
        success: true,
        portalTotal,
        initialDbActive: dbActiveTenders.length,
        finalDbActive: finalActiveCount,
        delistedCount: markedCount,
        delistedTenders: allDelistedTenders,
        durationMs
      };

    } catch (error) {
      logger.error(`[Reconciliation] Unhandled error: ${error.message}`);
      return { error: error.message };
    } finally {
      this.isReconciling = false;
    }
  }
}

export const reconciliationService = new ReconciliationService();
export default reconciliationService;
