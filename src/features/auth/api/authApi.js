import { axiosClient } from '../../../api/axiosClient';

export const authApi = {
  login: (payload) =>
    axiosClient.post('/auth/login', payload).then((r) => r.data.data),

  register: (payload) =>
    axiosClient.post('/auth/register', payload).then((r) => r.data.data),

  refresh: () =>
    axiosClient.post('/auth/refresh').then((r) => r.data.data),

  logout: () => axiosClient.post('/auth/logout'),

  logoutAllDevices: () => axiosClient.post('/auth/logout-all'),

  google: (payload) =>
    axiosClient.post('/auth/google', payload).then((r) => r.data.data),

  forgotPassword: (payload) =>
    axiosClient.post('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload) =>
    axiosClient.post('/auth/reset-password', payload).then((r) => r.data),
};
