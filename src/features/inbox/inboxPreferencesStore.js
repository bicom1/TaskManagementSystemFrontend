import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDefaultImportantMap } from './inboxNotificationTypes';

export const useInboxPreferencesStore = create(
  persist(
    (set, get) => ({
      showAllTab: false,
      groupByDate: true,
      sortNewestFirst: true,
      displayMode: 'inline', // 'inline' | 'fullscreen'
      importantTypes: buildDefaultImportantMap(),

      setShowAllTab: (showAllTab) => set({ showAllTab }),
      setGroupByDate: (groupByDate) => set({ groupByDate }),
      setSortNewestFirst: (sortNewestFirst) => set({ sortNewestFirst }),
      setDisplayMode: (displayMode) => set({ displayMode }),

      toggleImportantType: (typeId) =>
        set((s) => ({
          importantTypes: {
            ...s.importantTypes,
            [typeId]: !s.importantTypes[typeId],
          },
        })),

      setImportantType: (typeId, value) =>
        set((s) => ({
          importantTypes: { ...s.importantTypes, [typeId]: value },
        })),

      setAllImportant: (value) =>
        set((s) => {
          const next = { ...s.importantTypes };
          Object.keys(next).forEach((k) => {
            next[k] = value;
          });
          return { importantTypes: next };
        }),

      resetImportantTypes: () => set({ importantTypes: buildDefaultImportantMap() }),

      isImportantType: (typeId) => Boolean(get().importantTypes[typeId]),
    }),
    {
      name: 'biworkspace-inbox-prefs',
      partialize: (s) => ({
        showAllTab: s.showAllTab,
        groupByDate: s.groupByDate,
        sortNewestFirst: s.sortNewestFirst,
        displayMode: s.displayMode,
        importantTypes: s.importantTypes,
      }),
    }
  )
);
