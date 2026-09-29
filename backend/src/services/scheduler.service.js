/**
 * @file backend/src/services/scheduler.service.js
 * @description Automated ingestion scheduler & retention engine using node-cron.
 * Executes automated data scraping at:
 * - 09:00 AM
 * - 10:00 AM
 * - 01:00 PM (13:00)
 * - 03:00 PM (15:00)
 * - 06:30 PM (18:30)
 * And performs automated 30-day archive deletion at 02:00 AM daily.
 */
import cron from 'node-cron';
import pino from 'pino';
import CronConfig from '../models/CronConfig.js';
import Tender from '../models/Tender.js';
import SystemLog from '../models/SystemLog.js';
import { tenderQueue } from '../workers/queue.js';
import { retentionService } from './retention.service.js';
import { backupService } from './backup.service.js';
import { reconciliationService } from './reconciliation.service.js';

const logger = pino();

export class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initializes all cron schedules. Called on server startup.
   */
  async init() {
    logger.info('[Scheduler] Initializing automated ingestion and maintenance schedules...');

    // 1. Ensure global cron configuration document exists in MongoDB
    await this.ensureCronConfig();

    // 2. Schedule Office-Hours Real-Time Polling (Every 30 mins: 09:05 AM to 06:35 PM IST, Mon-Sat)
    // Triggers at minute :05 and :35 of every hour between 9 AM and 6 PM IST
    this.scheduleSyncSlot('5,35 9-18 * * 1-6', '30-Min Real-Time Ingestion (Office Hours)');

    // 3. Evening Wrap-Up Catch-Up Run (19:15 / 07:15 PM IST, Mon-Sat)
    // Ensures all tenders from 9:00 AM to 7:10 PM are captured before offices shut
    this.scheduleSyncSlot('15 19 * * 1-6', 'Master Evening Sweep (07:15 PM)');

    // 4. Automated Daily Document Recovery Sweep (20:00 / 08:00 PM IST, Mon-Sat)
    // Sweeps tenders whose document download window opened during today's office hours
    cron.schedule('0 20 * * 1-6', async () => {
      logger.info('[Scheduler] ⏰ Running daily 08:00 PM Document Recovery Sweep...');
      await this.triggerDocumentRecovery();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // 5. Automated Expired Tenders Purge, Portal Reconciliation & Daily DB Backup (Runs daily at 03:00 AM IST)
    cron.schedule('0 3 * * *', async () => {
      logger.info('[Scheduler] ⏰ Running scheduled 03:00 AM expired tenders purge from MongoDB & Cloudflare R2...');
      await retentionService.purgeExpiredTenders('CRON_SCHEDULE_03AM').catch(err => {
        logger.error(`[Scheduler] Purge failed: ${err.message}`);
      });
      await this.purgeExpiredArchivedTenders('CRON_SCHEDULE_03AM');

      logger.info('[Scheduler] ⏰ Running scheduled 03:00 AM Portal Parity Reconciliation...');
      await reconciliationService.reconcileActiveTenders('CRON_SCHEDULE_03AM').catch(err => {
        logger.error(`[Scheduler] 03:00 AM reconciliation failed: ${err.message}`);
      });
      
      logger.info('[Scheduler] Running scheduled nightly database backup & secondary Cloudflare mirror...');
      await backupService.createDatabaseBackup().catch(err => {
        logger.error(`[Scheduler] Nightly database backup failed: ${err.message}`);
      });

      // Prune local backups older than 14 days to keep storage optimal
      const pruneResult = backupService.pruneOldBackups(14);
      if (pruneResult.prunedCount > 0) {
        logger.info(`[Scheduler] Pruned ${pruneResult.prunedCount} expired local backup(s).`);
      }
    }, {
      timezone: 'Asia/Kolkata'
    });

    // 6. Real-time Status Sync: Mark tenders whose closing date + time has passed as EXPIRED (Every 15 mins)
    cron.schedule('*/15 * * * *', async () => {
      await retentionService.markExpiredTenders().catch(err => {
        logger.error(`[Scheduler] Real-time expiry check failed: ${err.message}`);
      });
    }, {
      timezone: 'Asia/Kolkata'
    });

    // 7. Evening Portal Parity Reconciliation (19:45 / 07:45 PM IST, Mon-Sat)
    // Synchronizes cancellations & retender replacements that occurred during the business day
    cron.schedule('45 19 * * 1-6', async () => {
      logger.info('[Scheduler] ⏰ Running evening 07:45 PM Portal Parity Reconciliation...');
      await reconciliationService.reconcileActiveTenders('CRON_SCHEDULE_0745PM').catch(err => {
        logger.error(`[Scheduler] 07:45 PM reconciliation failed: ${err.message}`);
      });
    }, {
      timezone: 'Asia/Kolkata'
    });

    logger.info('✅ [Scheduler] Office-hours polling, evening sweep, doc recovery, parity reconciliation & 03:00 AM purge crons registered successfully.');
  }

  /**
   * Registers a sync cron slot with timezone and admin permission check
   */
  scheduleSyncSlot(cronExpression, label) {
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`[Scheduler] ⏰ Cron Trigger activated for slot: ${label}`);
      await this.triggerScheduledSync(label);
    }, {
      timezone: 'Asia/Kolkata'
    });

    this.jobs.push({ label, job, cronExpression });
  }

  /**
   * Evaluates admin permission toggle before adding ingestion job to BullMQ
   */
  async triggerScheduledSync(slotLabel) {
    try {
      const config = await CronConfig.findOne({ configKey: 'GLOBAL_CRON_SETTINGS' });
      
      if (config && !config.isAutomatedSyncEnabled) {
        logger.warn(`[Scheduler] Automated sync for ${slotLabel} was SKIPPED because Admin has disabled automated ingestion.`);
        await SystemLog.create({
          level: 'INFO',
          source: 'CRON',
          message: `Scheduled ingestion at ${slotLabel} skipped (Automated scraping is paused in Admin Settings).`,
        }).catch(() => {});
        return;
      }

      const nowIST = new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const activeLabel = `${slotLabel} @ ${nowIST} IST`;

      logger.info(`[Scheduler] Admin permission verified. Dispatching sync job to TenderQueue for ${activeLabel}...`);
      
      await tenderQueue.add('sync-latest-tenders', {
        triggeredBy: 'CRON_SCHEDULE',
        slotLabel: activeLabel,
        limit: Infinity,
        initiatedAt: new Date().toISOString(),
      });

      if (config) {
        config.lastRunAt = new Date();
        config.lastRunStatus = 'RUNNING';
        await config.save();
      }

      await SystemLog.create({
        level: 'INFO',
        source: 'CRON',
        message: `Automated data ingestion triggered successfully for ${activeLabel}.`,
      }).catch(() => {});

    } catch (err) {
      logger.error(`[Scheduler] Failed to trigger scheduled sync: ${err.message}`);
      await SystemLog.create({
        level: 'ERROR',
        source: 'CRON',
        message: `Failed to dispatch scheduled sync for ${slotLabel}: ${err.message}`,
        stack: err.stack,
      }).catch(() => {});
    }
  }

  /**
   * Triggers scheduled 8:00 PM recovery of tenders whose download window opened today
   */
  async triggerDocumentRecovery() {
    try {
      const config = await CronConfig.findOne({ configKey: 'GLOBAL_CRON_SETTINGS' });
      if (config && !config.isAutomatedSyncEnabled) {
        logger.warn('[Scheduler] Document recovery skipped (Automated scraping is disabled in Admin Settings).');
        return;
      }

      logger.info('[Scheduler] Dispatching scheduled retry-missing-pdfs job to TenderQueue...');
      await tenderQueue.add('retry-missing-pdfs', {
        triggeredBy: 'CRON_SCHEDULE_08PM',
        slotLabel: '08:00 PM Document Recovery Sweep',
        initiatedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(`[Scheduler] Failed to trigger document recovery: ${err.message}`);
    }
  }

  /**
   * Manual trigger action directly from the Admin Dashboard button
   */
  async triggerManualSync(adminUser = 'Admin') {
    logger.info(`[Scheduler] Manual sync triggered by ${adminUser}...`);
    
    const job = await tenderQueue.add('sync-latest-tenders', {
      triggeredBy: 'ADMIN_MANUAL',
      adminUser,
      initiatedAt: new Date().toISOString(),
    });

    await SystemLog.create({
      level: 'INFO',
      source: 'CRON',
      message: `Manual data ingestion triggered by ${adminUser} (Job ID: ${job.id}).`,
    }).catch(() => {});

    return job;
  }

  /**
   * Trigger manual backfill of missing tender PDFs
   */
  async triggerMissingPdfSync(adminUser = 'Admin') {
    logger.info(`[Scheduler] Missing PDF backfill triggered by ${adminUser}...`);
    
    const job = await tenderQueue.add('retry-missing-pdfs', {
      triggeredBy: 'ADMIN_MANUAL',
      adminUser,
      initiatedAt: new Date().toISOString(),
    });

    await SystemLog.create({
      level: 'INFO',
      source: 'CRON',
      message: `Missing PDF retry cycle initiated by ${adminUser}.`,
    }).catch(() => {});

    return job;
  }

  /**
   * Automatically deletes tenders in ARCHIVE status where closingDate was > 30 days ago
   */
  async purgeExpiredArchivedTenders(invokedBy = 'ADMIN_MANUAL') {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    logger.info(`[Scheduler] Purging archived tenders expired prior to ${cutoffDate.toISOString()}...`);

    try {
      // Find tenders that are ARCHIVED and have closingDate older than 30 days
      // Or tenders marked ARCHIVED whose archivedAt date is older than 30 days
      const filter = {
        status: 'ARCHIVED',
        $or: [
          { closingDate: { $lt: cutoffDate } },
          { archivedAt: { $lt: cutoffDate } },
        ]
      };

      const countBefore = await Tender.countDocuments(filter);
      const deleteResult = await Tender.deleteMany(filter);
      const deletedCount = deleteResult.deletedCount || 0;

      logger.info(`✅ [Scheduler] Purge complete. Deleted ${deletedCount} expired archived tender(s).`);

      // Update CronConfig audit fields
      await CronConfig.findOneAndUpdate(
        { configKey: 'GLOBAL_CRON_SETTINGS' },
        {
          $set: {
            lastPurgedAt: new Date(),
            lastPurgedCount: deletedCount,
          }
        },
        { upsert: true }
      );

      await SystemLog.create({
        level: 'INFO',
        source: 'DATABASE',
        message: `Archived tender retention cleanup (${invokedBy}): purged ${deletedCount} record(s) older than 30 days.`,
        metadata: { cutoffDate, deletedCount, countBefore }
      }).catch(() => {});

      return {
        success: true,
        deletedCount,
        cutoffDate,
      };
    } catch (err) {
      logger.error(`[Scheduler] Error during archive purge: ${err.message}`);
      await SystemLog.create({
        level: 'ERROR',
        source: 'DATABASE',
        message: `Failed to purge expired archived tenders: ${err.message}`,
        stack: err.stack
      }).catch(() => {});
      throw err;
    }
  }

  /**
   * Ensures default global cron settings are initialized
   */
  async ensureCronConfig() {
    const existing = await CronConfig.findOne({ configKey: 'GLOBAL_CRON_SETTINGS' });
    if (!existing) {
      await CronConfig.create({
        configKey: 'GLOBAL_CRON_SETTINGS',
        isAutomatedSyncEnabled: true,
        scheduleMode: 'POLLING_30_MIN',
        scheduledSlots: ['Every 30m (09:05-19:05 IST Mon-Sat)', '19:15 Evening Catchup', '20:00 Doc Recovery'],
        isArchivePurgeEnabled: true,
        archiveRetentionDays: 30,
      });
      logger.info('[Scheduler] Created default CronConfig settings document.');
    } else if (!existing.scheduleMode || (Array.isArray(existing.scheduledSlots) && existing.scheduledSlots.includes('09:00'))) {
      existing.scheduleMode = 'POLLING_30_MIN';
      existing.scheduledSlots = ['Every 30m (09:05-19:05 IST Mon-Sat)', '19:15 Evening Catchup', '20:00 Doc Recovery'];
      await existing.save();
      logger.info('[Scheduler] Updated existing CronConfig settings document to 30-min office-hours configuration.');
    }
  }
}

export const schedulerService = new SchedulerService();
