import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../../../store/authStore';

const KEY = 'users';

export function useUsers(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => userApi.list(params),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: [KEY, 'me'],
    queryFn: userApi.me,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to send invite');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => userApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('User updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update user');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => userApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('User deactivated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to deactivate user');
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (user) => {
      setAuth(user, accessToken);
      queryClient.invalidateQueries({ queryKey: [KEY, 'me'] });
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update profile');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: (data) => {
      toast.success(data?.message ?? 'Password updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to change password');
    },
  });
}
