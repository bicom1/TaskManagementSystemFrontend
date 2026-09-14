/** Deterministic avatar colors — a muted, jewel-neutral set that
 *  stays legible under white text and never shouts.
 *  Every entry keeps white initials at WCAG AA (≥ 4.5:1); several were
 *  deepened slightly to get there. Order matters: it maps people to colors. */
const AVATAR_COLORS = [
  '#6f64c4', // iris
  '#4f6f8f', // slate blue
  '#3b8074', // muted teal
  '#9e6657', // clay
  '#827356', // olive taupe
  '#7a5c8a', // muted plum
  '#587698', // steel blue
  '#986868', // dusty rose
  '#567e60', // sage
  '#8f703c', // ochre
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
