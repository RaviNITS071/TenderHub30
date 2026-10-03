/**
 * @file frontend/src/services/billingApi.js
 * @description Frontend API client for subscription plans and Razorpay checkout.
 */
import { api } from './api';

export const billingApi = {
  getPlans: async () => {
    const res = await api.get('/billing/plans');
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get('/billing/status');
    return res.data?.subscription;
  },

  createOrder: async (planId) => {
    const res = await api.post('/billing/create-order', { planId });
    return res.data;
  },

  verifyPayment: async (paymentData) => {
    const res = await api.post('/billing/verify-payment', paymentData);
    return res.data;
  },
};
