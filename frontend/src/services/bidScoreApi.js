import { api } from './api';

export const bidScoreApi = {
  /**
   * Calculate tender bid allocation probability score
   */
  evaluateScore: async (evaluationPayload) => {
    const res = await api.post('/bid-score/evaluate', evaluationPayload);
    return res.data;
  },

  /**
   * Fetch saved contractor baseline financial metrics
   */
  getMetrics: async () => {
    const res = await api.get('/bid-score/metrics');
    return res.data?.data;
  },

  /**
   * Fetch past evaluation history for this contractor
   */
  getHistory: async () => {
    const res = await api.get('/bid-score/history');
    return res.data?.data || [];
  },

  /**
   * Delete single evaluation from history
   */
  deleteHistoryItem: async (id) => {
    const res = await api.delete(`/bid-score/history/${id}`);
    return res.data;
  },
};
