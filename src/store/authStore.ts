import { create } from 'zustand';

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

// Deliberately NOT persisted (no zustand/persist middleware) — the access
// token lives only in memory. On a hard refresh, ProtectedRoute triggers a
// silent /auth/refresh call using the httpOnly refresh cookie to rehydrate.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
