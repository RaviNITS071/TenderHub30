import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      savedTenders: [],
      toggleBookmark: (tender) => {
        const id = tender._id || tender.sourceTenderId;
        const exists = get().savedTenders.some((item) => (item._id || item.sourceTenderId) === id);

        if (exists) {
          set({ savedTenders: get().savedTenders.filter((item) => (item._id || item.sourceTenderId) !== id) });
        } else {
          set({ savedTenders: [tender, ...get().savedTenders] });
        }
      },
      isBookmarked: (id) => get().savedTenders.some((item) => (item._id || item.sourceTenderId) === id),
    }),
    { name: 'tenderhub_bookmarks' }
  )
);