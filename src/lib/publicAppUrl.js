/**
 * Public app origin for invite / share links.
 * Live always uses https://bicomworkspace.com so email + copied links match production.
 */
export function getPublicAppOrigin() {
  if (typeof window === 'undefined') {
    return 'https://bicomworkspace.com';
  }
  const origin = String(window.location.origin || '').replace(/\/$/, '');
  if (/localhost|127\.0\.0\.1/i.test(origin)) {
    return origin;
  }
  // Canonical live host (cPanel) — avoid www / vercel drift in shared invite links
  return 'https://bicomworkspace.com';
}

/**
 * Invite email + share links → /register?token=…
 * RegisterPage with a token renders Complete registration (same as /accept-invite).
 */
export function buildAcceptInviteUrl(token) {
  const raw = String(token || '').trim();
  if (!raw) return `${getPublicAppOrigin()}/register`;
  return `${getPublicAppOrigin()}/register?token=${encodeURIComponent(raw)}`;
}
