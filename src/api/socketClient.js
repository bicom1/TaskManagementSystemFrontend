import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;
let subscribed = false;

function socketUrl() {
  return import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';
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
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (socket.connected) {
      socket.disconnect();
    }
  });
}

/**
 * Socket connects only when a JWT is available — prevents handshake 401s.
 */
export function getSocket() {
  ensureAuthSubscription();

  const token = useAuthStore.getState().accessToken;

  if (!socket) {
    // Persistent workplace chat: keep reconnecting all day while logged in
    socket = io(socketUrl(), {
      auth: { token: token || null },
      autoConnect: Boolean(token),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      transports: ['websocket', 'polling'],
      timeout: 12_000,
    });
  } else if (token) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  subscribed = false;
}
