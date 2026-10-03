/**
 * @file backend/src/modules/billing/adapters/IPaymentGateway.js
 * @description Abstract payment gateway interface for dependency inversion.
 * Allows effortless swapping between Razorpay, Cashfree, or mock gateways.
 */
export class IPaymentGateway {
  /**
   * Create a checkout order
   * @param {Object} params - { amount, currency, receipt, notes }
   * @returns {Promise<{ orderId: string, amount: number, currency: string }>}
   */
  async createOrder(params) {
    throw new Error('createOrder() must be implemented by payment gateway adapter');
  }

  /**
   * Verify signature from payment gateway callback / webhook
   * @param {Object} params - { orderId, paymentId, signature }
   * @returns {boolean}
   */
  verifyPaymentSignature(params) {
    throw new Error('verifyPaymentSignature() must be implemented by payment gateway adapter');
  }

  /**
   * Fetch payment details by ID
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async fetchPayment(paymentId) {
    throw new Error('fetchPayment() must be implemented by payment gateway adapter');
  }
}
