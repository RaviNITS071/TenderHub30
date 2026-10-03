/**
 * @file backend/src/modules/notifications/adapters/IWhatsAppProvider.js
 * @description Abstract WhatsApp provider interface for dependency inversion.
 */
export class IWhatsAppProvider {
  /**
   * Send personalized tender alert to contractor
   * @param {Object} params - { phone, tender, user }
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendTenderAlert(params) {
    throw new Error('sendTenderAlert() must be implemented by WhatsApp adapter');
  }

  /**
   * Send daily morning consolidated digest
   * @param {Object} params - { phone, tenders, user }
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendDailyDigest(params) {
    throw new Error('sendDailyDigest() must be implemented by WhatsApp adapter');
  }

  /**
   * Send simple text or verification message
   * @param {Object} params - { phone, message }
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendTextMessage(params) {
    throw new Error('sendTextMessage() must be implemented by WhatsApp adapter');
  }
}
