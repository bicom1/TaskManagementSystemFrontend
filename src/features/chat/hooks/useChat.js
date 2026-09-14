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
import { getErrorMessage, toastError } from '@/lib/toast';
import { isDuplicateEvent } from '@/lib/socketDedupe';

export const CHAT_CONVERSATIONS_KEY = 'chat-conversations';
export const CHAT_MESSAGES_KEY = 'chat-messages';
export const CHAT_PEOPLE_KEY = 'chat-people';

export function useChatDirectory(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['chat-directory'],
    queryFn: () => chatApi.directory(),
    enabled: enabled && Boolean(token),
    staleTime: 60_000,
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

export function useConversation(conversationId) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
    enabled: Boolean(conversationId && token),
    staleTime: 15_000,
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

/** The start endpoints return the full conversation — cache it so the header renders at once. */
function seedConversation(queryClient, conversation) {
  if (conversation?._id) queryClient.setQueryData(['chat-conversation', conversation._id], conversation);
}

export function useStartDm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => chatApi.startDm(userId),
    onSuccess: (conversation) => {
      seedConversation(queryClient, conversation);
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error) => {
      toastError(error, 'Could not start chat');
    },
  });
}

export function useStartTeamChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId) => chatApi.startTeamChat(teamId),
    onSuccess: (conversation) => {
      seedConversation(queryClient, conversation);
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
    },
    onError: (error) => {
      toastError(error, 'Could not open team chat');
    },
  });
}

export function useStartDepartmentChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId) => chatApi.startDepartmentChat(departmentId),
    onSuccess: (conversation) => {
      seedConversation(queryClient, conversation);
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
    },
    onError: (error) => {
      toastError(error, 'Could not open department chat');
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

/** Same wording the API stores as lastMessagePreview (chat.service previewFromMessage). */
function previewFor({ body, files = [], shareLinks = [] } = {}) {
  const text = String(body || '').trim();
  if (text) return text.slice(0, 240);
  if (files.length) {
    const kind = String(files[0].type || '').startsWith('image/') ? 'image' : 'file';
    return files.length > 1
      ? `Shared ${files.length} ${kind === 'image' ? 'images' : 'files'}`
      : `Shared ${kind}: ${files[0].name || 'attachment'}`;
  }
  if (shareLinks.length) {
    return `Shared a link: ${shareLinks[0].label || shareLinks[0].url}`.slice(0, 240);
  }
  return 'New message';
}

const idOf = (value) => String(value?._id || value || '');

/**
 * Apply a change to one conversation in the cached chat list, optionally moving
 * it to the top. Returns false when the conversation isn't cached (the caller
 * should refetch). Without this, a chat only reordered once the full list had
 * been refetched — seconds after the message was already on screen.
 */
function patchConversationList(queryClient, conversationId, patch, { toTop = false, fallback } = {}) {
  let found = false;
  queryClient.setQueryData([CHAT_CONVERSATIONS_KEY], (old) => {
    if (!old?.data) return old;
    const rows = old.data;
    const idx = rows.findIndex((c) => idOf(c) === String(conversationId));
    let updated;
    if (idx >= 0) {
      found = true;
      updated = { ...rows[idx], ...patch };
    } else if (fallback) {
      // A brand-new chat (first message) isn't in the list yet.
      found = true;
      updated = { ...fallback, ...patch };
    } else {
      return old;
    }
    const rest = idx >= 0 ? rows.filter((_, i) => i !== idx) : rows;
    const data = toTop
      ? [updated, ...rest]
      : idx >= 0
        ? rows.map((c, i) => (i === idx ? updated : c))
        : [updated, ...rest];
    return { ...old, data, unread: data.filter((c) => c.unread).length };
  });
  return found;
}

function removeCachedMessage(queryClient, conversationId, messageId) {
  queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
    if (!old?.data) return old;
    const target = old.data.find((m) => String(m._id) === String(messageId));
    (target?.attachments || []).forEach((a) => {
      if (a.localPreview && String(a.url).startsWith('blob:')) URL.revokeObjectURL(a.url);
    });
    return { ...old, data: old.data.filter((m) => String(m._id) !== String(messageId)) };
  });
}

/** Drop a message that failed to send (the "Remove" action). */
export function useDiscardFailedMessage() {
  const queryClient = useQueryClient();
  return (conversationId, messageId) => removeCachedMessage(queryClient, conversationId, messageId);
}

/**
 * Keep the chat list in step with a message that just arrived over the socket:
 * preview, time, position and unread dot, without waiting for a refetch.
 */
function applyLiveMessageToList(queryClient, { conversationId, at, preview, by, participantIds }) {
  const me = useAuthStore.getState().user?._id;
  const fromMe = idOf(by) === String(me);
  const viewing = getActiveChatId() === String(conversationId);
  const iAmIn = participantIds ? participantIds.map(String).includes(String(me)) : true;
  const cached = queryClient
    .getQueryData([CHAT_CONVERSATIONS_KEY])
    ?.data?.find((c) => idOf(c) === String(conversationId));
  const patch = { lastMessageAt: at, lastMessagePreview: preview, lastMessageBy: by };
  // Never un-read a chat on someone else's message; only flag it when it's for you.
  if (!fromMe && iAmIn && !viewing) patch.unread = true;
  // Out-of-order delivery must not move an older message above a newer one.
  if (cached?.lastMessageAt && new Date(cached.lastMessageAt) > new Date(at)) return;
  if (patchConversationList(queryClient, conversationId, patch, { toTop: true })) return;
  if (!queryClient.getQueryData([CHAT_CONVERSATIONS_KEY])) return; // list not loaded yet

  // A chat that isn't listed yet (someone's first message). Fetch just that one
  // conversation — both socket events for the message share the request — rather
  // than reloading the whole list, which is the slow endpoint.
  queryClient
    .fetchQuery({
      queryKey: ['chat-conversation', String(conversationId)],
      queryFn: () => chatApi.getConversation(conversationId),
      staleTime: 5_000,
    })
    .then((conversation) =>
      patchConversationList(queryClient, conversationId, patch, { toTop: true, fallback: conversation })
    )
    .catch(() => queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] }));
}

export function useSendChatMessage(defaultConversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    // conversationId travels with each send, so switching chats while a message
    // is in flight can't file it (or its failure) under the wrong conversation.
    mutationFn: ({ conversationId = defaultConversationId, conversation: _c, retryOf: _r, ...payload }) =>
      chatApi.sendMessage(conversationId, payload),
    onMutate: async (vars) => {
      const { conversationId = defaultConversationId, conversation, retryOf, ...payload } = vars;
      if (retryOf) removeCachedMessage(queryClient, conversationId, retryOf);
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
      const createdAt = new Date().toISOString();
      const optimistic = {
        _id: clientId,
        clientId,
        pending: true,
        body: payload?.body || '',
        attachments,
        shareLinks: payload?.shareLinks || [],
        mentions: payload?.mentions || [],
        from: user,
        createdAt,
        conversation: conversationId,
        type: 'chat',
        // Kept so a failed message can be retried exactly as written.
        sendPayload: payload,
      };

      queryClient.setQueryData([CHAT_MESSAGES_KEY, conversationId], (old) => {
        if (!old) return { data: [optimistic], pagination: {} };
        return { ...old, data: [...(old.data || []), optimistic] };
      });

      // A refetch already in flight would land after this and put the chat back
      // where it was, so stop it; onSettled refetches the real list.
      await queryClient.cancelQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
      patchConversationList(
        queryClient,
        conversationId,
        {
          lastMessageAt: createdAt,
          lastMessagePreview: previewFor(payload),
          lastMessageBy: user ? { _id: user._id, name: user.name, avatarUrl: user.avatarUrl } : null,
          unread: false,
        },
        { toTop: true, fallback: conversation }
      );

      return { clientId, conversationId, previewUrls: attachments.map((a) => a.previewUrl || a.url) };
    },
    onSuccess: (message, _vars, ctx) => {
      queryClient.setQueryData([CHAT_MESSAGES_KEY, ctx.conversationId], (old) => {
        if (!old) return { data: [message], pagination: {} };
        const merged = mergeServerMessage(message, ctx);
        const withoutDup = (old.data || []).filter(
          (m) =>
            String(m._id) !== String(ctx?.clientId) &&
            String(m._id) !== String(message._id)
        );
        return { ...old, data: [...withoutDup, merged] };
      });
      patchConversationList(queryClient, ctx.conversationId, { lastMessageAt: message.createdAt });
    },
    onError: (error, _vars, ctx) => {
      if (!ctx) return;
      const reason = getErrorMessage(error, 'Check your connection and try again.');
      // Keep the message on screen, clearly marked, instead of silently removing
      // it — the user can see what didn't go through and retry it.
      queryClient.setQueryData([CHAT_MESSAGES_KEY, ctx.conversationId], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((m) =>
            String(m._id) === String(ctx.clientId)
              ? { ...m, pending: false, failed: true, error: reason }
              : m
          ),
        };
      });
      // The failure is shown inline in the open chat; only toast when the user
      // has moved to a different one and would otherwise never see it.
      if (getActiveChatId() !== String(ctx.conversationId)) {
        toastError(error, 'A message could not be sent', { id: `chat-send-failed:${ctx.clientId}` });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
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
    // Clear the dot in place. This runs whenever a message lands in the open chat;
    // refetching the whole list each time raced with sends — a refetch that started
    // before your message was saved came back without it and dropped the chat down.
    onMutate: (id) => {
      patchConversationList(queryClient, id, { unread: false });
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

      // Move the chat to the top right away, without reloading the list.
      applyLiveMessageToList(queryClient, {
        conversationId: convId,
        at: message.createdAt,
        preview: previewFor({
          body: message.body,
          files: (message.attachments || []).map((a) => ({ type: a.fileType, name: a.fileName })),
          shareLinks: message.shareLinks,
        }),
        by: message.from,
      });
      // Do not append here — useLiveChat owns the thread cache (avoids duplicate bubbles).

      // One toast and one sound per message, however many times it is delivered.
      if (isDuplicateEvent(`chat:message:${message?._id}`)) return;

      const fromId = String(message.from?._id || message.from);
      if (!userId || fromId === String(userId)) return;

      // Already viewing this thread — no toast/sound clutter
      if (getActiveChatId() === convId) return;

      const name = message.from?.name || 'Someone';
      const preview = String(message.body || 'sent you a message').slice(0, 80);

      playMessageNotifySound();

      toast(`${name} sent you a message`, {
        id: `chat:${message?._id}`,
        description: preview,
        duration: 5500,
        action: {
          label: 'Open chat',
          onClick: () => navigate(`/inbox?chat=${convId}`),
        },
      });
    };

    // Also reaches a Super Admin for chats they aren't in (oversight room).
    const onConversation = (conversation) => {
      const convId = idOf(conversation);
      if (!convId || !conversation?.lastMessageAt) {
        queryClient.invalidateQueries({ queryKey: [CHAT_CONVERSATIONS_KEY] });
        return;
      }
      applyLiveMessageToList(queryClient, {
        conversationId: convId,
        at: conversation.lastMessageAt,
        preview: conversation.lastMessagePreview,
        by: conversation.lastMessageBy,
        participantIds: conversation.participantIds,
      });
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
        // Only a message still sending can be the one the server just confirmed.
        const pendingIdx = rows.findIndex(
          (m) => m.pending && !m.failed && String(m.from?._id || m.from || '') === fromId
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
      // The chat list itself is kept current by useLiveChatNotifications (always
      // mounted in the shell) — refetching it here on every message was redundant.
    };

    const onTypingEvent = (payload) => {
      if (payload?.conversationId && onTyping) {
        onTyping(payload);
      }
    };

    socket.on('chat:message', onMessage);
    socket.on('message:typing', onTypingEvent);

    return () => {
      socket.off('chat:message', onMessage);
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
