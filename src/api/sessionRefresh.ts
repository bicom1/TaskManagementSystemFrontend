import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

let refreshPromise: Promise<string> | null = null;

export async function refreshSessionToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 15_000 })
    .then((res) => {
      const newToken = res.data?.data?.accessToken as string;
      if (!newToken) throw new Error('Refresh response missing access token');
      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    })
    .catch((err) => {
      useAuthStore.getState().clearAuth();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
