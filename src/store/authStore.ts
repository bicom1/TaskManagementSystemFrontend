import { create } from 'zustand';
import { clearTabSession, markTabSession } from '@/lib/tabSession';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

// Access token is memory-only. Tab session marker in sessionStorage enables
// same-tab F5 restore; closing the tab clears it so the next visit requires login.
export const useAuthStore = create<AuthState>((set) => ({
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
