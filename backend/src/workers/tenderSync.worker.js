import { Worker } from 'bullmq';
import pino from 'pino';
import { env } from '../config/env.js';
import { JKTenderAdapter } from '../services/adapters/JKTenderAdapter.js';
import SyncJob from '../models/SyncJob.js';
import Tender from '../models/Tender.js';

const logger = pino();
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls: { rejectUnauthorized: false },
  family: 4
};

/**
 * Real-time saving logic for MongoDB with full metadata
 */
async function saveDetailedTendersToDatabase(pageData, adapter) {
  if (!pageData || pageData.length === 0) return 0;

  // Log updated to reflect real-time single saving
  logger.info(`[Worker] Saving ${pageData.length} tender(s) in real-time to DB...`);
  let newCount = 0;

  const savePromises = pageData.map(async (raw) => {
    try {
      const normalized = adapter.normalize(raw);
      const updateFields = { ...normalized };

      // Safeguard: If current scrape has no PDFs, check if existing tender in DB already has them
      if (!normalized.pdfUrls || normalized.pdfUrls.length === 0) {
        const existingTender = await Tender.findOne(
          { sourcePortal: normalized.sourcePortal, sourceTenderId: normalized.sourceTenderId },
          { pdfUrls: 1, nitDocuments: 1 }
        );
        if (existingTender && existingTender.pdfUrls && existingTender.pdfUrls.length > 0) {
          delete updateFields.pdfUrls;
          delete updateFields.nitDocuments;
        }
      }

      const result = await Tender.findOneAndUpdate(
        { 
          sourcePortal: normalized.sourcePortal, 
          sourceTenderId: normalized.sourceTenderId 
        },
        { 
          $set: updateFields 
        },
        { 
          upsert: true, 
          returnDocument: 'after', 
          setDefaultsOnInsert: true, 
          includeResultMetadata: true 
        }
      );

      if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
        newCount++;
        logger.info(`[Worker] Inserted new tender: ${normalized.sourceTenderId} (PDFs: ${normalized.pdfUrls?.length || 0})`);
      } else {
        logger.info(`[Worker] Synchronized existing tender: ${normalized.sourceTenderId} (PDFs: ${normalized.pdfUrls?.length || 0})`);
      }
    } catch (err) {
      logger.error(`Error saving tender ${raw.sourceTenderId}: ${err.message}`);
    }
  });

  await Promise.all(savePromises);
  return newCount;
}

export const tenderSyncWorker = new Worker('TenderQueue', async (job) => {
  logger.info(`Processing Tender Sync Job: ${job.id}`);

  const adapter = new JKTenderAdapter();
  const syncRecord = await SyncJob.create({ sourcePortal: adapter.portalName });
  let newFound = 0;

  // Callback is now triggered per-tender in real-time
  const savePageToDb = async (pageData) => {
    const addedCount = await saveDetailedTendersToDatabase(pageData, adapter);
    newFound += addedCount;
  };

  try {
    await adapter.fetchList(1, { syncMode: 'FULL' }, savePageToDb);

    syncRecord.status = 'completed';
    syncRecord.newTendersFound = newFound;
    await syncRecord.save();

    logger.info(`Sync complete. Total new tenders added: ${newFound}`);

  } catch (error) {
    logger.error(`Sync Job Failed: ${error.message}`);
    syncRecord.status = 'failed';
    syncRecord.errorMessage = error.message;
    await syncRecord.save();
    throw error;
  }
}, { 
  connection, 
  lockDuration: 600000,   // 10 minutes lock duration to prevent job stalling during CAPTCHA
  maxStalledCount: 3 
});