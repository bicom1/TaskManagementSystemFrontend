import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { refreshSessionToken } from './sessionRefresh';

let socket: Socket | null = null;
let subscribed = false;
let handlersAttached = false;
let refreshInFlight = false;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function socketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return String(explicit).replace(/\/$/, '');

  const api = import.meta.env.VITE_API_BASE_URL;
  if (api) return String(api).replace(/\/api\/v1\/?$/, '');

  return 'http://localhost:5000';
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (!useAuthStore.getState().accessToken) return;
    refreshSessionToken().catch(() => {});
  }, 10 * 60 * 1000);
}

async function recoverSocketAuth() {
  if (refreshInFlight) return;
  if (!useAuthStore.getState().accessToken) return;

  refreshInFlight = true;
  try {
    const newToken = await refreshSessionToken();
    if (socket && newToken) {
      socket.auth = { token: newToken };
      if (!socket.connected) socket.connect();
    }
  } catch {
    if (socket?.connected) socket.disconnect();
  } finally {
    refreshInFlight = false;
  }
}

function attachSocketHandlers(sock: Socket) {
  if (handlersAttached) return;
  handlersAttached = true;

  sock.on('connect', () => {
    startKeepAlive();
  });

  sock.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      recoverSocketAuth();
    }
  });

  sock.on('connect_error', () => {
    recoverSocketAuth();
  });
}

function ensureAuthSubscription() {
  if (subscribed) return;
  subscribed = true;

  let lastToken = useAuthStore.getState().accessToken;

  useAuthStore.subscribe((state) => {
    if (!socket) return;
    const next = state.accessToken;
    if (next === lastToken) return;
    lastToken = next;

    socket.auth = { token: next || null };

    if (next) {
      if (socket.connected) socket.disconnect();
      socket.connect();
      startKeepAlive();
    } else {
      stopKeepAlive();
      if (socket.connected) socket.disconnect();
    }
  });
}

function createSocket(token: string | null) {
  return io(socketUrl(), {
    auth: { token: token || null },
    autoConnect: Boolean(token),
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    transports: ['polling', 'websocket'],
    timeout: 20_000,
  });
}

export function getSocket(): Socket {
  ensureAuthSubscription();

  const token = useAuthStore.getState().accessToken;

  if (!socket) {
    socket = createSocket(token);
    attachSocketHandlers(socket);
  } else if (token) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  stopKeepAlive();
  handlersAttached = false;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  subscribed = false;
}
