import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePreferenceStore = create(
  persist(
    (set) => ({
      preferences: {
        isConfigured: false,
        targetSectors: [],
        preferredLocations: [],
        minTenderValue: 0,
        preferEmdExemption: false,
      },
      updatePreferences: (updatedFields) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updatedFields, isConfigured: true },
        })),
    }),
    { name: 'tenderhub_preferences' }
  )
);