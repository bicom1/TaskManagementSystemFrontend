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

/** Pull token from a full invite URL or raw token string. */
export function extractInviteToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!/[?&=/]/.test(raw) && raw.length >= 16) return raw;
  try {
    const url = new URL(raw, getPublicAppOrigin());
    return String(url.searchParams.get('token') || url.searchParams.get('inviteToken') || '').trim();
  } catch {
    const match = raw.match(/[?&](?:token|inviteToken)=([^&\s#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }
}

/**
 * Invite email + share links → always /register?token=…
 * Never /accept-invite (old live build shows Google there).
 */
export function buildAcceptInviteUrl(tokenOrUrl) {
  const raw = extractInviteToken(tokenOrUrl) || String(tokenOrUrl || '').trim();
  if (!raw || /[?&=/]/.test(raw)) {
    return `${getPublicAppOrigin()}/register`;
  }
  return `${getPublicAppOrigin()}/register?token=${encodeURIComponent(raw)}`;
}

/** Rewrite any accept-invite URL to /register?token=… */
export function toRegisterInviteUrl(url) {
  const token = extractInviteToken(url);
  return buildAcceptInviteUrl(token || url);
}
