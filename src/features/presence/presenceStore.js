import { create } from 'zustand';

/**
 * Real-time presence map keyed by userId.
 * status: 'online' | 'offline'
 */
export const usePresenceStore = create((set, get) => ({
  byId: {},

  applySnapshot: (onlineList = []) => {
    set((state) => {
      const next = { ...state.byId };
      const onlineIds = new Set();
      for (const row of onlineList) {
        const id = String(row.userId || row._id || '');
        if (!id) continue;
        onlineIds.add(id);
        next[id] = {
          status: 'online',
          lastSeen: null,
          name: row.name || next[id]?.name || null,
        };
      }
      // After reconnect, mark anyone previously online but absent from snapshot as offline
      for (const [id, entry] of Object.entries(next)) {
        if (entry?.status === 'online' && !onlineIds.has(id)) {
          next[id] = {
            ...entry,
            status: 'offline',
            lastSeen: entry.lastSeen || new Date().toISOString(),
          };
        }
      }
      return { byId: next };
    });
  },

  applyUpdate: (payload) => {
    if (!payload?.userId) return;
    const id = String(payload.userId);
    set((state) => ({
      byId: {
        ...state.byId,
        [id]: {
          status: payload.status === 'online' ? 'online' : 'offline',
          lastSeen: payload.lastSeen
            ? new Date(payload.lastSeen).toISOString()
            : null,
          name: payload.name || state.byId[id]?.name || null,
        },
      },
    }));
  },

  applyBulk: (rows = []) => {
    set((state) => {
      const next = { ...state.byId };
      for (const row of rows) {
        const id = String(row.userId || '');
        if (!id) continue;
        next[id] = {
          status: row.status === 'online' ? 'online' : 'offline',
          lastSeen: row.lastSeen ? new Date(row.lastSeen).toISOString() : null,
          name: row.name || next[id]?.name || null,
        };
      }
      return { byId: next };
    });
  },

  getStatus: (userId) => {
    if (!userId) return 'offline';
    return get().byId[String(userId)]?.status || 'offline';
  },

  getLastSeen: (userId) => {
    if (!userId) return null;
    return get().byId[String(userId)]?.lastSeen || null;
  },
}));
