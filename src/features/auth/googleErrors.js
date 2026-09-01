const GOOGLE_ERROR_MESSAGES = {
  redirect_uri_mismatch:
    'Google redirect URI mismatch. In Google Cloud Console add this redirect URI: https://biworkspace-api.onrender.com/api/v1/auth/google/callback',
  invalid_state:
    'Google sign-in session expired. Please try again — do not use the browser back button after choosing your Google account.',
  access_denied: 'Google sign-in was cancelled.',
  session: 'Signed in with Google but could not load your profile. Try again or use email login.',
  not_invited: 'You are not invited to this workspace.',
  invite_expired: 'Your invitation has expired. Ask your admin to send a new invite.',
};

/** Rich toast copy for invite-gated Google sign-in */
const GOOGLE_ERROR_TOASTS = {
  not_invited: {
    title: 'Invitation required',
    description:
      'This workspace is invite-only. Your Super Admin must invite you first and assign your role. Once you receive the invitation email, return here and sign in with Google using the same email address.',
  },
  invite_expired: {
    title: 'Invitation expired',
    description:
      'Your invite link is no longer valid. Please ask your Super Admin to send a new invitation, then sign in with Google using the invited email address.',
  },
};

const NOT_INVITED_MARKERS = new Set([
  'You are not invited to this workspace.',
  'not_invited',
]);

function isLocalDev() {
  if (typeof window === 'undefined') return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

function decodeGoogleError(code) {
  try {
    return decodeURIComponent(String(code || ''));
  } catch {
    return String(code || '');
  }
}

function isNotInvitedError(decoded) {
  return NOT_INVITED_MARKERS.has(decoded) || decoded.includes('not invited to this workspace');
}

function isInviteExpiredError(decoded) {
  return (
    decoded.startsWith('Your invitation has expired') ||
    decoded === GOOGLE_ERROR_MESSAGES.invite_expired
  );
}

/**
 * Returns { title, description? } for sonner toasts.
 * Use description when present for clearer invite-only messaging.
 */
export function getGoogleErrorToast(code) {
  if (!code) {
    return { title: 'Google Sign-In failed. Please try again.' };
  }

  const decoded = decodeGoogleError(code);

  if (isNotInvitedError(decoded)) {
    return GOOGLE_ERROR_TOASTS.not_invited;
  }

  if (isInviteExpiredError(decoded)) {
    return GOOGLE_ERROR_TOASTS.invite_expired;
  }

  return { title: getGoogleErrorMessage(code) };
}

export function getGoogleErrorMessage(code) {
  if (!code) return 'Google Sign-In failed. Please try again.';

  const decoded = decodeGoogleError(code);

  if (isNotInvitedError(decoded)) {
    return GOOGLE_ERROR_TOASTS.not_invited.title;
  }

  if (isInviteExpiredError(decoded)) {
    return GOOGLE_ERROR_TOASTS.invite_expired.title;
  }

  if (code === 'redirect_uri_mismatch' && isLocalDev()) {
    return 'Google redirect URI mismatch. Add http://localhost:5000/api/v1/auth/google/callback in Google Console.';
  }

  if (GOOGLE_ERROR_MESSAGES[code]) {
    return GOOGLE_ERROR_MESSAGES[code];
  }

  if (GOOGLE_ERROR_MESSAGES[decoded]) {
    return GOOGLE_ERROR_MESSAGES[decoded];
  }

  if (/Google authorization failed/i.test(code)) {
    return 'Google authorization failed. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.';
  }

  return `Google Sign-In failed: ${code}`;
}
