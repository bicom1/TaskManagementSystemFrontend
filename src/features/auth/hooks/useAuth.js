import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { userApi } from '../../users/api/userApi';
import { useAuthStore } from '../../../store/authStore';
import { disconnectSocket } from '../../../api/socketClient';
import { toastSuccess, toastError } from '@/lib/toast';

async function setAuthWithPermissions(setAuth, user, accessToken) {
  try {
    setAuth(user, accessToken);
    const full = await userApi.me();
    setAuth({ ...user, ...full }, accessToken);
  } catch {
    setAuth(user, accessToken);
  }
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: async ({ user, accessToken }) => {
      await setAuthWithPermissions(setAuth, user, accessToken);
      queryClient.invalidateQueries();
      toastSuccess(`Welcome back, ${user.name}`);
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toastError(error, 'Invalid email or password');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => authApi.register(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      toastSuccess('Account created successfully');
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toastError(
        error,
        'This email is already registered. Please log in using your existing account.'
      );
    },
  });
}

export function useGoogleAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => authApi.google(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      queryClient.invalidateQueries();
      toastSuccess(`Welcome, ${user.name}`);
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toastError(error, 'Google Sign-In failed');
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      disconnectSocket();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data) => {
      toastSuccess(
        data?.message ??
          data?.data?.message ??
          'Check your email for the BIWORKSPACE OTP code'
      );
    },
    onError: (error) => {
      toastError(error, 'Could not send reset email');
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      toastSuccess(data?.message ?? 'Password reset successfully — you can sign in now');
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      toastError(error, 'Invalid or expired OTP');
    },
  });
}
