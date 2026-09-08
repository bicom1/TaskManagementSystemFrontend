import { create } from 'zustand';
import { clearTabSession, markTabSession } from '@/lib/tabSession';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    markTabSession();
    set({ user, accessToken, isAuthenticated: true });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => {
    clearTabSession();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
