/**
 * @file frontend/src/store/useAuthStore.js
 * @description Global Zustand authentication store managing session state,
 * Google OAuth redirection, and Email OTP verification.
 */
import { create } from 'zustand';
import { api } from '@/services/api';
import { useBookmarkStore } from './useBookmarkStore';

const isTestMode = import.meta.env.VITE_TEST_MODE === 'true' || (typeof window !== 'undefined' && window.location.port === '5175');

const defaultTestUser = {
  id: '6abe2b7f4ec335668fdc702a',
  name: 'Test Reviewer (No Login)',
  email: 'tester@tenderhub.local',
  role: 'admin',
  dailyViews: {
    viewsUsed: 0,
    viewsLimit: 'Unlimited',
    viewsRemaining: 'Unlimited',
    resetsAt: null,
    resetsInMs: null,
  }
};

export const useAuthStore = create((set, get) => ({
  user: isTestMode ? defaultTestUser : null,
  isAuthenticated: isTestMode ? true : false,
  isLoading: isTestMode ? false : true,
  error: null,

  /**
   * Check session on application boot by calling /auth/me with HttpOnly cookies.
   */
  checkAuth: async () => {
    if (isTestMode) {
      set({
        user: defaultTestUser,
        isAuthenticated: true,
        isLoading: false,
      });
      return defaultTestUser;
    }

    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        set({
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        // Populate contractor-scoped bookmarks from MongoDB
        useBookmarkStore.getState().fetchSavedTenders();
        return res.data.user;
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    } catch (err) {
      // 401 is normal for unauthenticated guests, do not treat as fatal error
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  /**
   * Optimistically / reactively update daily view counter state.
   */
  updateDailyViews: (dailyViews) => {
    if (!dailyViews) return;
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          dailyViews: {
            ...state.user.dailyViews,
            ...dailyViews,
          },
        },
      };
    });
  },

  /**
   * Request a 6-digit OTP code sent to user's email.
   * Supports type: 'login' | 'signup'
   */
  sendOtp: async (email, type = 'login') => {
    try {
      set({ error: null });
      const res = await api.post('/auth/send-otp', { email, type });
      return { success: true, data: res.data };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to send verification code. Please try again.';
      const notFound = Boolean(err.response?.data?.notFound);
      const alreadyExists = Boolean(err.response?.data?.alreadyExists);
      set({ error: message });
      return { success: false, error: message, notFound, alreadyExists };
    }
  },

  /**
   * Verify the 6-digit OTP code, complete registration or sign-in, and establish session.
   * Supports optional contractor profileDetails during signup.
   */
  verifyOtp: async (email, otp, type = 'login', profileDetails = {}) => {
    try {
      set({ error: null });
      const res = await api.post('/auth/verify-otp', { email, otp, type, profileDetails });
      if (res.data?.success && res.data?.user) {
        if (res.data.accessToken) {
          localStorage.setItem('token', res.data.accessToken);
        }
        set({
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        // Sync any guest bookmarks and load contractor's persistent list
        useBookmarkStore.getState().syncWithBackend();
        return { success: true, user: res.data.user };
      }
      return { success: false, error: 'Verification failed.' };
    } catch (err) {
      const message = err.response?.data?.error || 'Verification failed. Please check your code.';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Trigger the server-side Google OAuth 2.0 flow.
   * Supports mode: 'login' | 'signup'
   */
  loginWithGoogle: (mode = 'login') => {
    const backendUrl = api.defaults.baseURL || 'http://localhost:8000/api/v1';
    window.location.href = `${backendUrl}/auth/google?mode=${mode}`;
  },

  /**
   * Terminate the session and clear cookies.
   */
  logout: async () => {
    try {
      localStorage.removeItem('token');
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      // Clear contractor-scoped bookmarks from local memory
      useBookmarkStore.getState().clearBookmarks();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
