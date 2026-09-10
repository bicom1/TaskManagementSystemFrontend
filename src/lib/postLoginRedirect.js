/**
 * Safe in-app path for post-login redirects (email deep links, etc.).
 * Only allows relative paths on this origin — never external URLs.
 */
export function sanitizeNextPath(raw) {
  if (raw == null) return null;
  let value = String(raw).trim();
  if (!value) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      value = `${url.pathname || '/'}${url.search || ''}${url.hash || ''}`;
    }
  } catch {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/login') || value.startsWith('/auth/') || value.startsWith('/register')) {
    return null;
  }
  if (value.length > 512) return null;
  return value;
}

export function readNextFromSearchParams(params) {
  if (!params) return null;
  const next = params.get?.('next') || params.get?.('returnTo');
  return sanitizeNextPath(next);
}

export function withNextParam(path, next) {
  const safe = sanitizeNextPath(next);
  if (!safe) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}next=${encodeURIComponent(safe)}`;
}
