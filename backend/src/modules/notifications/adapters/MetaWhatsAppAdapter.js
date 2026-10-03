/**
 * @file backend/src/modules/notifications/adapters/MetaWhatsAppAdapter.js
 * @description Official Meta WhatsApp Cloud API implementation with development mock mode.
 */
import pino from 'pino';
import { IWhatsAppProvider } from './IWhatsAppProvider.js';
import { env } from '../../../config/env.js';

const logger = pino();

export class MetaWhatsAppAdapter extends IWhatsAppProvider {
  constructor() {
    super();
    this.apiToken = env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    this.isMockMode = !this.apiToken || !this.phoneNumberId;

    if (!this.isMockMode) {
      logger.info('Meta WhatsApp Cloud Adapter initialized in LIVE mode.');
    } else {
      logger.warn('WhatsApp API credentials not detected in .env. Running in MOCK logging mode.');
    }
  }

  // Format phone to international E.164 without '+' or leading '0'
  formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `91${cleaned}`; // Default India +91
    return cleaned;
  }

  async sendTenderAlert({ phone, tender, user }) {
    const formattedPhone = this.formatPhone(phone);
    if (!formattedPhone) {
      throw new Error('Valid WhatsApp phone number required.');
    }

    const tenderTitle = tender.title || tender.workDescription || 'New Tender Notice';
    const dept = tender.department || tender.organisationChain || 'Government of J&K';
    const valueStr = tender.tenderValueFormatted || (tender.tenderValue ? `₹${tender.tenderValue.toLocaleString('en-IN')}` : 'Refer Document');
    const closingDate = tender.closingDateFormatted || tender.bidSubmissionEndDate || 'Refer Document';
    const portalUrl = `${env.FRONTEND_URL}/tenders/${tender._id || tender.tenderId}`;

    const textBody = 
      `🚨 *NEW TENDER ALERT — TenderHub J&K*\n\n` +
      `📋 *Title:* ${tenderTitle.slice(0, 140)}...\n` +
      `🏛️ *Department:* ${dept}\n` +
      `💰 *Estimated Value:* ${valueStr}\n` +
      `📅 *Bid Submission Deadline:* ${closingDate}\n\n` +
      `👉 *View Full Tender & BOQ:* ${portalUrl}\n\n` +
      `_You are receiving this because it matches your preferred departments/districts. Update preferences anytime on tenderhub.in_`;

    if (this.isMockMode) {
      logger.info(`\n[WHATSAPP MOCK DISPATCH to ${formattedPhone}]:\n${textBody}\n`);
      return { success: true, messageId: `mock_wa_${Date.now()}`, isMock: true };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: textBody,
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Meta Cloud API Error');
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        isMock: false,
      };
    } catch (err) {
      logger.error(`Failed to send WhatsApp message to ${formattedPhone}: ${err.message}`);
      throw err;
    }
  }

  async sendDailyDigest({ phone, tenders, user }) {
    const formattedPhone = this.formatPhone(phone);
    if (!formattedPhone || !tenders || tenders.length === 0) return { success: false };

    let summaryLines = tenders.slice(0, 5).map((t, idx) => {
      const val = t.tenderValueFormatted || (t.tenderValue ? `₹${t.tenderValue.toLocaleString('en-IN')}` : 'Notice');
      return `${idx + 1}. *${t.title?.slice(0, 50)}...* (${val})\n   🔗 ${env.FRONTEND_URL}/tenders/${t._id}`;
    }).join('\n\n');

    const textBody = 
      `🌅 *GOOD MORNING! TenderHub Daily Digest*\n\n` +
      `We found *${tenders.length} new tenders* published today matching your saved criteria:\n\n` +
      `${summaryLines}\n\n` +
      `👉 View all matches: ${env.FRONTEND_URL}/tenders?tab=matched`;

    if (this.isMockMode) {
      logger.info(`\n[WHATSAPP MOCK DAILY DIGEST to ${formattedPhone}]:\n${textBody}\n`);
      return { success: true, messageId: `mock_wa_digest_${Date.now()}`, isMock: true };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { preview_url: true, body: textBody }
        }),
      });

      const data = await response.json();
      return { success: response.ok, messageId: data.messages?.[0]?.id };
    } catch (err) {
      logger.error(`Digest send error: ${err.message}`);
      throw err;
    }
  }

  async sendTextMessage({ phone, message }) {
    const formattedPhone = this.formatPhone(phone);
    if (this.isMockMode) {
      logger.info(`[WHATSAPP MOCK to ${formattedPhone}]: ${message}`);
      return { success: true, messageId: `mock_${Date.now()}`, isMock: true };
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }),
    });
    const data = await response.json();
    return { success: response.ok, messageId: data.messages?.[0]?.id };
  }
}

export const metaWhatsAppAdapter = new MetaWhatsAppAdapter();
