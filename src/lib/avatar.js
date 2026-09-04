/** Deterministic avatar colors — a muted, jewel-neutral set that
 *  stays legible under white text and never shouts. */
const AVATAR_COLORS = [
  '#6f64c4', // iris
  '#4f6f8f', // slate blue
  '#3f8a7d', // muted teal
  '#a56a5b', // clay
  '#8a7a5c', // olive taupe
  '#7a5c8a', // muted plum
  '#5b7a9d', // steel blue
  '#9d6b6b', // dusty rose
  '#5f8a6a', // sage
  '#b08a4a', // ochre
  '#6b7280', // slate
  '#7d6a9c', // lavender grey
];

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getAvatarColor(seed = '') {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Derive presence-style status for UI filters.
 * Online ONLY when live socket presence says so — never from lastLoginAt. */
export function getPersonStatus(person, liveStatus) {
  if (person?.invitePending) return 'invited';
  if (person?.isActive === false) return 'inactive';
  if (liveStatus === 'online') return 'online';
  if (person?.lastSeenAt || person?.lastLoginAt) {
    const ts = new Date(person.lastSeenAt || person.lastLoginAt).getTime();
    const age = Date.now() - ts;
    if (age < 7 * 24 * 60 * 60 * 1000) return 'active';
  }
  return 'offline';
}

export const PERSON_STATUS_LABELS = {
  online: 'Online',
  active: 'Away',
  offline: 'Offline',
  invited: 'Invited',
  inactive: 'Deactivated',
};
