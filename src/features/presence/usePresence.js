import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '@/api/socketClient';
import { usePresenceStore } from './presenceStore';
import { useAuthStore } from '@/store/authStore';
import { toastWarning, toastSuccess } from '@/lib/toast';

/**
 * Global presence + session revoke listener. Mount once near the app shell.
 */
export function usePresenceSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const applySnapshot = usePresenceStore((s) => s.applySnapshot);
  const applyUpdate = usePresenceStore((s) => s.applyUpdate);
  const applyBulk = usePresenceStore((s) => s.applyBulk);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const socket = getSocket();
    if (!socket) return undefined;

    const onSnapshot = (payload) => {
      applySnapshot(payload?.online || []);
    };
    const onUpdate = (payload) => applyUpdate(payload);
    const onBulk = (rows) => applyBulk(Array.isArray(rows) ? rows : []);

    const onRevoked = (payload) => {
      const reason = payload?.reason;
      const message =
        payload?.message ||
        (reason === 'deleted'
          ? 'Your account has been deleted. Please contact your administrator.'
          : 'Your account has been deactivated. Please contact your administrator.');

      toastWarning(message, { duration: 8000 });
      clearAuth();
      disconnectSocket();
      window.setTimeout(() => {
        window.location.assign('/login');
      }, 400);
    };

    socket.on('presence:snapshot', onSnapshot);
    socket.on('presence:update', onUpdate);
    socket.on('presence:bulk', onBulk);
    socket.on('session:revoked', onRevoked);

    const onConnect = () => {
      socket.emit('presence:ping');
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('presence:snapshot', onSnapshot);
      socket.off('presence:update', onUpdate);
      socket.off('presence:bulk', onBulk);
      socket.off('session:revoked', onRevoked);
      socket.off('connect', onConnect);
    };
  }, [isAuthenticated, clearAuth, applySnapshot, applyUpdate, applyBulk]);
}

/**
 * Live invalidate people/users/chat directory when users are created/updated/deleted.
 */
export function useLiveUsers() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const myId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['chat-directory'] });
      queryClient.invalidateQueries({ queryKey: ['chat-people'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    };

    const onChanged = (payload) => {
      refresh();
      const event = payload?.event || '';
      const user = payload?.user || payload;
      const id = String(user?._id || '');
      if (!id || id === String(myId)) return;

      if (event === 'user:deleted') {
        const name = user?.deletedName || user?.name;
        if (name) toastSuccess(`${name} has been deleted`, { duration: 5000 });
      } else if (event === 'user:updated' && user?.isActive === false) {
        if (user?.name) toastSuccess(`${user.name} has been deactivated`, { duration: 4000 });
      }
    };

    // Canonical channel — emitUserEvent also fires specific events; ignore those to avoid double toasts
    socket.on('user:changed', onChanged);

    return () => {
      socket.off('user:changed', onChanged);
    };
  }, [isAuthenticated, queryClient, myId]);
}

/**
 * Ask the server for online/offline + lastSeen for a set of user ids.
 * Call from lists (sidebar DMs, people) so offline users aren't stuck looking online.
 */
export function usePresenceQuery(userIds = []) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const key = (userIds || []).map(String).filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!isAuthenticated || !key) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const ids = key.split(',');
    const emit = () => socket.emit('presence:query', ids);

    emit();
    socket.on('connect', emit);
    return () => {
      socket.off('connect', emit);
    };
  }, [isAuthenticated, key]);
}
