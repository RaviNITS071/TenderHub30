/**
 * @file frontend/src/services/notificationApi.js
 * @description Frontend API client for contractor WhatsApp notification preferences.
 */
import { api } from './api';

export const notificationApi = {
  getPreferences: async () => {
    const res = await api.get('/notifications/preferences');
    return res.data?.preferences;
  },

  updatePreferences: async (preferences) => {
    const res = await api.put('/notifications/preferences', preferences);
    return res.data;
  },

  sendTestAlert: async (phone) => {
    const res = await api.post('/notifications/test', { phone });
    return res.data;
  },
};
