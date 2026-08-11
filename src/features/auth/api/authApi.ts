import { axiosClient } from '../../../api/axiosClient';
import type { AuthUser } from '../../../store/authStore';
import type { LoginFormValues, RegisterFormValues } from '../schemas/authSchemas';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

export const authApi = {
  login: (payload: LoginFormValues) =>
    axiosClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data.data),

  register: (payload: RegisterFormValues) =>
    axiosClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data.data),

  refresh: () =>
    axiosClient.post<AuthResponse>('/auth/refresh').then((r) => r.data.data),

  logout: () => axiosClient.post('/auth/logout'),

  logoutAllDevices: () => axiosClient.post('/auth/logout-all'),
};
