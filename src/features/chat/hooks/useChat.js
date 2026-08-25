import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { chatApi } from '../api/chatApi';
import { getSocket } from '../../../api/socketClient';
import { useAuthStore } from '../../../store/authStore';
import { playMessageNotifySound } from '../../../lib/notifySound';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { getActiveChatId, setActiveChatId } from '../chatActiveStore';

export const CHAT_CONVERSATIONS_KEY = 'chat-conversations';
export const CHAT_MESSAGES_KEY = 'chat-messages';
export const CHAT_PEOPLE_KEY = 'chat-people';

export function useChatDirectory(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['chat-directory'],
    queryFn: () => chatApi.directory(),
    enabled: enabled && Boolean(token),
    staleTime: 30_000,
  });
}

export function useChatPeople(q, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  const debouncedQ = useDebouncedValue(q, 280);
  return useQuery({
    queryKey: [CHAT_PEOPLE_KEY, debouncedQ || ''],
    queryFn: () => chatApi.searchPeople({ q: debouncedQ || '', limit: 40 }),
    enabled: enabled && Boolean(token),
    staleTime: 30_000,
  });
}

export function useConversations() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [CHAT_CONVERSATIONS_KEY],
    queryFn: () => chatApi.listConversations({ limit: 50 }),
    enabled: Boolean(token),
  });
}

export function useConversationMessages(conversationId) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [CHAT_MESSAGES_KEY, conversationId],
    queryFn: () => chatApi.listMessages(conversationId, { limit: 80 }),
    enabled: Boolean(conversationId && token),
  });
}

/** Load older history for always-on workplace chats (no time expiry) */
export function useLoadOlderMessages(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (before) => chatApi.listOlderMessages(conversationId, before),
    onSuccess: (result) => {
      queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
        const older = result?.data || [];
        if (!old?.data?.length) {
          return {
            data: older,
            pagination: result.pagination,
          };
        }
        const existingIds = new Set(old.data.map((m) => String(m._id)));
        const merged = [
          ...older.filter((m) => !existingIds.has(String(m._id))),
          ...old.data,
        ];
        return {
          ...old,
          data: merged,
          pagination: {
            ...(old.pagination || {}),
            ...(result.pagination || {}),
            total: result.pagination?.total ?? old.pagination?.total,
          },
        };
      });
    },
  });
}

export function useStartDm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => chatApi.startDm(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Could not start chat');
    },
  });
}

export function useStartTeamChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId) => chatApi.startTeamChat(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Could not open team chat');
    },
  });
}

export function useStartDepartmentChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId) => chatApi.startDepartmentChat(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Could not open department chat');
    },
  });
}

export function useProjectChannel(projectId) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['chat-project', projectId],
    queryFn: () => chatApi.startProjectChat(projectId),
    enabled: Boolean(projectId && token),
    staleTime: 60_000,
  });
}

export function useSendChatMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => chatApi.sendMessage(conversationId, payload),
    onMutate: async (payload) => {
      const files = payload?.files || [];
      const attachments = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          url: previewUrl,
          previewUrl,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          localPreview: true,
        };
      });
      const user = useAuthStore.getState().user;
      const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic = {
        _id: clientId,
        clientId,
        pending: true,
        body: payload?.body || '',
        attachments,
        shareLinks: payload?.shareLinks || [],
        mentions: payload?.mentions || [],
        from: user,
        createdAt: new Date().toISOString(),
        conversation: conversationId,
        type: 'chat',
      };

      queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
        if (!old) return { data: [optimistic], pagination: {} };
        return { ...old, data: [...(old.data || []), optimistic] };
      });

      return { clientId, previewUrls: attachments.map((a) => a.previewUrl || a.url) };
    },
    onSuccess: (message, _payload, ctx) => {
      queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
        if (!old) return { data: [message], pagination: {} };
        const merged = mergeServerMessage(message, ctx);
        const withoutDup = (old.data || []).filter(
          (m) =>
            String(m._id) !== String(ctx?.clientId) &&
            String(m._id) !== String(message._id)
        );
        return { ...old, data: [...withoutDup, merged] };
      });
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error, _payload, ctx) => {
      queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((m) => String(m._id) !== String(ctx?.clientId)),
        };
      });
      (ctx?.previewUrls || []).forEach((url) => {
        if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to send');
    },
  });
}

function mergeServerMessage(message, ctx) {
  const previews = ctx?.previewUrls || [];
  if (!previews.length) return message;
  return {
    ...message,
    attachments: (message.attachments || []).map((file, i) => ({
      ...file,
      previewUrl: previews[i] || file.previewUrl,
    })),
  };
}

function mergeAttachmentPreviews(local = [], remote = []) {
  return (remote || []).map((file, i) => ({
    ...file,
    previewUrl: local?.[i]?.previewUrl || local?.[i]?.url || file.previewUrl,
  }));
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => chatApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
  });
}

/**
 * App-wide chat alerts: soft sound + toast with sender name.
 * Mount once in the shell (TopBar). Skips toast/sound when that chat is already open.
 */
export function useLiveChatNotifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?._id);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket();

    const onMessage = (message) => {
      const convId = String(message.conversation?._id || message.conversation || '');
      if (!convId) return;

      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
      // Do not append here — useLiveChat owns the thread cache (avoids duplicate bubbles).

      const fromId = String(message.from?._id || message.from);
      if (!userId || fromId === String(userId)) return;

      // Already viewing this thread — no toast/sound clutter
      if (getActiveChatId() === convId) return;

      const name = message.from?.name || 'Someone';
      const preview = String(message.body || 'sent you a message').slice(0, 80);

      playMessageNotifySound();

      toast(`${name} sent you a message`, {
        description: preview,
        duration: 5500,
        action: {
          label: 'Open chat',
          onClick: () => navigate(`/inbox?chat=${convId}`),
        },
      });
    };

    const onConversation = () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:conversation', onConversation);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:conversation', onConversation);
    };
  }, [queryClient, userId, navigate, token]);
}

/** Live chat thread: join room, append messages, typing (toasts handled globally) */
export function useLiveChat(activeConversationId, { onTyping } = {}) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    setActiveChatId(activeConversationId);
    return () => setActiveChatId(null);
  }, [activeConversationId]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket();

    const onMessage = (message) => {
      const convId = String(message.conversation?._id || message.conversation || '');
      if (!convId) return;

      queryClient.setQueryData([CHAT_MESSAGES_KEY, convId], (old) => {
        if (!old) {
          if (String(activeConversationId) === convId) {
            return { data: [message], pagination: {} };
          }
          return old;
        }
        const rows = old.data || [];
        const exists = rows.some((m) => String(m._id) === String(message._id));
        if (exists) {
          return {
            ...old,
            data: rows.map((m) =>
              String(m._id) === String(message._id) ? { ...m, ...message, previewUrl: m.previewUrl, attachments: mergeAttachmentPreviews(m.attachments, message.attachments) } : m
            ),
          };
        }
        const fromId = String(message.from?._id || message.from || '');
        const pendingIdx = rows.findIndex(
          (m) => m.pending && String(m.from?._id || m.from || '') === fromId
        );
        if (pendingIdx >= 0) {
          const pending = rows[pendingIdx];
          const next = [...rows];
          next[pendingIdx] = mergeServerMessage(message, {
            previewUrls: (pending.attachments || []).map((a) => a.previewUrl || a.url),
          });
          return { ...old, data: next };
        }
        return { ...old, data: [...rows, message] };
      });

      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    };

    const onConversation = () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    };

    const onTypingEvent = (payload) => {
      if (payload?.conversationId && onTyping) {
        onTyping(payload);
      }
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:conversation', onConversation);
    socket.on('message:typing', onTypingEvent);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:conversation', onConversation);
      socket.off('message:typing', onTypingEvent);
    };
  }, [queryClient, onTyping, activeConversationId, token]);

  useEffect(() => {
    if (!activeConversationId || !token) return undefined;
    const socket = getSocket();
    socket.emit('conversation:join', activeConversationId);
    return () => {
      socket.emit('conversation:leave', activeConversationId);
    };
  }, [activeConversationId, token]);
}

export function emitChatTyping(conversationId) {
  const socket = getSocket();
  socket.emit('message:typing', { conversationId });
}
