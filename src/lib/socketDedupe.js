/**
 * Socket events can arrive more than once for a single server emit — a transport
 * upgrade (polling → websocket), a reconnect replay, or a second live tab feeding
 * the same singleton socket. Handlers that toast, play a sound, or bump a counter
 * must run exactly once per logical event, so they gate on this.
 *
 * Keyed by the entity id the server sent, kept for a short TTL and pruned lazily.
 */
const seen = new Map();
const DEFAULT_TTL = 60_000;

export function isDuplicateEvent(key, ttl = DEFAULT_TTL) {
  if (!key) return false;

  const now = Date.now();
  for (const [k, at] of seen) {
    if (now - at > ttl) seen.delete(k);
  }

  if (seen.has(key)) return true;
  seen.set(key, now);
  return false;
}

/** Test/logout hook — drops the window so a fresh session starts clean. */
export function resetEventDedupe() {
  seen.clear();
}
