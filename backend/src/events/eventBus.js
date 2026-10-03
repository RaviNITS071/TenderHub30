/**
 * @file backend/src/events/eventBus.js
 * @description Central event bus decoupling domains via pub-sub.
 * Allows core tender ingestion to trigger notifications, webhooks, and analytics asynchronously.
 */
import EventEmitter from 'events';
import pino from 'pino';
import { whatsappNotificationService } from '../modules/notifications/services/whatsapp.service.js';

const logger = pino();

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
    this.registerSubscribers();
  }

  registerSubscribers() {
    // Subscriber: When a tender is saved or published, evaluate contractor notification matches
    this.on('tender.saved', async (tender) => {
      try {
        if (!tender) return;
        await whatsappNotificationService.processNewTender(tender);
      } catch (err) {
        logger.error(`[EventBus] Error handling 'tender.saved': ${err.message}`);
      }
    });

    // Subscriber: Batch tenders saved
    this.on('tenders.batch_saved', async (tenders) => {
      try {
        if (!Array.isArray(tenders)) return;
        for (const tender of tenders) {
          await whatsappNotificationService.processNewTender(tender);
        }
      } catch (err) {
        logger.error(`[EventBus] Error handling 'tenders.batch_saved': ${err.message}`);
      }
    });
  }
}

export const eventBus = new AppEventBus();
