import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../../../store/authStore';
import { toastSuccess, toastError } from '@/lib/toast';

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
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    },
    onError: (error) => {
      const timedOut =
        error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      const alreadyExists = /already (exists|registered)/i.test(
        error?.response?.data?.message || ''
      );
      toastError(
        timedOut
          ? 'Server is waking up. Wait a moment and try inviting again.'
          : alreadyExists
            ? 'This email is already registered. Please log in using your existing account.'
            : error,
        'Failed to create invite'
      );
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => userApi.updateUser(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      if (variables?.isActive === true) {
        toastSuccess(`${data?.name || 'User'} has been reactivated`);
      } else {
        toastSuccess('User updated');
      }
    },
    onError: (error) => toastError(error, 'Failed to update user'),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => userApi.deactivate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      removeUserFromUsersCache(queryClient, id);
      return { previous };
    },
    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toastError(error, 'Failed to deactivate user');
    },
    onSuccess: (data, id) => {
      removeUserFromUsersCache(queryClient, id);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
      queryClient.invalidateQueries({ queryKey: ['chat-people'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toastSuccess(`${data?.name || 'Member'} has been deactivated`);
    },
  });
}

function removeUserFromUsersCache(queryClient, userId) {
  const id = String(userId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!old || !Array.isArray(old.data)) return old;
    const next = old.data.filter((u) => String(u._id) !== id);
    if (next.length === old.data.length) return old;
    return {
      ...old,
      data: next,
      total: typeof old.total === 'number' ? Math.max(0, old.total - 1) : next.length,
    };
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => userApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      removeUserFromUsersCache(queryClient, id);
      return { previous };
    },
    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toastError(error, 'Failed to delete member');
    },
    onSuccess: (data, id) => {
      removeUserFromUsersCache(queryClient, id);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
      queryClient.invalidateQueries({ queryKey: ['chat-people'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const name = data?.deletedName || data?.name || 'Member';
      toastSuccess('Member removed', {
        description: `${name} has been permanently removed from the workspace.`,
        duration: 5500,
      });
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
      toastSuccess('Profile updated');
    },
    onError: (error) => toastError(error, 'Failed to update profile'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: (data) => {
      toastSuccess(data?.message ?? 'Password updated');
    },
    onError: (error) => toastError(error, 'Failed to update password'),
  });
}
