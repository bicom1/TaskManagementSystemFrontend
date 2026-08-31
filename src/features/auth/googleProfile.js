/** Decode base64url profile blob from Google OAuth redirect. */
export function decodeOAuthProfile(value) {
  if (!value) return null;
  try {
    const pad = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
