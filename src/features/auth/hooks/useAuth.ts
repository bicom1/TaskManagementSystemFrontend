import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';
import type { LoginFormValues, RegisterFormValues } from '../schemas/authSchemas';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginFormValues) => authApi.login(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      queryClient.invalidateQueries();
      toast.success(`Welcome back, ${user.name}`);
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterFormValues) => authApi.register(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      toast.success('Account created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Registration failed');
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
