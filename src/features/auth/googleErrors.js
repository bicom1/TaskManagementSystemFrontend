const GOOGLE_ERROR_MESSAGES = {
  redirect_uri_mismatch:
    'Google redirect URI mismatch. In Google Cloud Console add this redirect URI: https://biworkspace-api.onrender.com/api/v1/auth/google/callback',
  invalid_state:
    'Google sign-in session expired. Please try again — do not use the browser back button after choosing your Google account.',
  access_denied: 'Google sign-in was cancelled.',
  session: 'Signed in with Google but could not load your profile. Try again or use email login.',
};

function isLocalDev() {
  if (typeof window === 'undefined') return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

export function getGoogleErrorMessage(code) {
  if (!code) return 'Google Sign-In failed. Please try again.';

  if (code === 'redirect_uri_mismatch' && isLocalDev()) {
    return 'Google redirect URI mismatch. Add http://localhost:5000/api/v1/auth/google/callback in Google Console.';
  }

  if (GOOGLE_ERROR_MESSAGES[code]) {
    return GOOGLE_ERROR_MESSAGES[code];
  }

  if (/Google authorization failed/i.test(code)) {
    return 'Google authorization failed. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.';
  }

  return `Google Sign-In failed: ${code}`;
}
