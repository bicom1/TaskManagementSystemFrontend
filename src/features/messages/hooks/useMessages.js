import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messageApi } from '../api/messageApi';
import { getSocket } from '../../../api/socketClient';
import { useAuthStore } from '../../../store/authStore';

const INBOX_KEY = 'messages-inbox';

export function useMessageInbox(params) {
  return useQuery({
    queryKey: [INBOX_KEY, params],
    queryFn: () => messageApi.inbox(params),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messageApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INBOX_KEY] });
      toast.success('Query sent');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to send message');
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messageApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INBOX_KEY] });
    },
  });
}

export function useMarkAllMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messageApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INBOX_KEY] });
      toast.success('All messages marked read');
    },
  });
}

export function useCreateTaskFromMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => messageApi.createTask(id, payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      toast.success(`Task ${task.key || ''} created`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create task');
    },
  });
}

export function useLiveMessages() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket();

    const handleNew = (message) => {
      queryClient.invalidateQueries({ queryKey: [INBOX_KEY] });
      // Chat events use chat:message; avoid double toast for chat type
      if (message?.type === 'chat') return;
      toast.info(`New message: ${message.subject || message.body?.slice(0, 40) || 'Inbox'}`);
    };

    socket.on('message:new', handleNew);
    return () => {
      socket.off('message:new', handleNew);
    };
  }, [queryClient, token]);
}
