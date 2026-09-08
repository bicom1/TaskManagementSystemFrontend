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
    title: 'You need an invitation first',
    description:
      'Ask your Super Admin to invite you to this workspace. Once invited, open the invite link and sign in with Google using the same email address they invited.',
  },
  invite_expired: {
    title: 'Invitation expired',
    description:
      'Your invite link is no longer valid. Please ask your Super Admin to send a new invitation, then sign in with Google using the invited email address.',
  },
  wrong_google_email: {
    title: 'Wrong Google account',
    description:
      'Use Continue with Google and choose the exact email from your invitation. A different Google account cannot accept this invite.',
  },
  google_account_in_use: {
    title: 'Google account already in use',
    description:
      'That Google account is already linked to another BIWORKSPACE user. Sign in with the Google account that matches your invited email.',
  },
};

const NOT_INVITED_MARKERS = new Set([
  'You are not invited to this workspace.',
  'not_invited',
]);

const INVITE_EXPIRED_MARKERS = new Set(['invite_expired']);

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
    INVITE_EXPIRED_MARKERS.has(decoded) ||
    decoded.startsWith('Your invitation has expired') ||
    decoded === GOOGLE_ERROR_MESSAGES.invite_expired
  );
}

function isWrongGoogleEmailError(decoded) {
  return (
    decoded === 'wrong_google_email' ||
    decoded.startsWith('wrong_google_email') ||
    /Sign in with Google using/i.test(decoded)
  );
}

/** True when Google sign-in failed because the user is not invited / invite expired */
export function isInviteGateError(code) {
  if (!code) return false;
  const decoded = decodeGoogleError(code);
  return (
    isNotInvitedError(decoded) ||
    isInviteExpiredError(decoded) ||
    isWrongGoogleEmailError(decoded)
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

  if (isWrongGoogleEmailError(decoded)) {
    const match = decoded.match(/using\s+([^\s—-]+@[^\s—-]+)/i);
    if (match?.[1]) {
      return {
        title: 'Wrong Google account',
        description: `Sign in with Google using ${match[1]} — the same email from your invitation.`,
      };
    }
    return GOOGLE_ERROR_TOASTS.wrong_google_email;
  }

  if (
    decoded === 'google_account_in_use' ||
    /already linked to another/i.test(decoded) ||
    /Google account is already/i.test(decoded)
  ) {
    return {
      title: GOOGLE_ERROR_TOASTS.google_account_in_use.title,
      description: decoded.length > 40 ? decoded : GOOGLE_ERROR_TOASTS.google_account_in_use.description,
    };
  }

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

  if (isWrongGoogleEmailError(decoded)) {
    return GOOGLE_ERROR_TOASTS.wrong_google_email.title;
  }

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
