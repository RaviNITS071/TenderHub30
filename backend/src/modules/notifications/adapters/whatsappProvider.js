/**
 * @file backend/src/modules/notifications/adapters/whatsappProvider.js
 * @description Provider factory returning the active WhatsApp adapter (AiSensy, Meta Cloud, or Mock).
 */
import { aiSensyWhatsAppAdapter } from './AiSensyWhatsAppAdapter.js';
import { metaWhatsAppAdapter } from './MetaWhatsAppAdapter.js';
import { env } from '../../../config/env.js';
import pino from 'pino';

const logger = pino();

export function getWhatsAppProvider() {
  if (env.AISENSY_API_KEY) {
    logger.info('Using AiSensy WhatsApp Provider.');
    return aiSensyWhatsAppAdapter;
  }
  if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
    logger.info('Using Meta WhatsApp Cloud Provider.');
    return metaWhatsAppAdapter;
  }
  // Default to AiSensy adapter for clear Indian payment & alert mock output
  return aiSensyWhatsAppAdapter;
}

export const activeWhatsAppProvider = getWhatsAppProvider();
