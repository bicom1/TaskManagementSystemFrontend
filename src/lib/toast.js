import { toast } from 'sonner';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

/**
 * Extract a safe, user-facing message from an Axios/API error.
 * Never surfaces raw Mongo/Axios/stack traces.
 */
export function getErrorMessage(error, fallback = DEFAULT_ERROR) {
  if (!error) return fallback;
  if (typeof error === 'string') return error.trim() || fallback;

  const data = error?.response?.data;
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) {
      const msg = data.message.trim();
      // Soft-upgrade legacy duplicate-email copy
      if (/already exists/i.test(msg) && /email/i.test(msg)) {
        return 'This email is already registered. Please log in using your existing account.';
      }
      return msg;
    }
    if (Array.isArray(data.errors) && data.errors.length) {
      const joined = data.errors
        .map((e) => (typeof e === 'string' ? e : e?.message))
        .filter(Boolean)
        .join(', ');
      if (joined) return joined;
    }
  }

  // Network / timeout without leaking internals
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
    return 'The request timed out. Please try again.';
  }
  if (error?.message === 'Network Error') {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  return fallback;
}

const baseOptions = {
  duration: 4500,
};

export function toastSuccess(message, options = {}) {
  return toast.success(message, { ...baseOptions, ...options });
}

export function toastError(errorOrMessage, fallback = DEFAULT_ERROR, options = {}) {
  const message =
    typeof errorOrMessage === 'string' || !errorOrMessage?.response
      ? getErrorMessage(errorOrMessage, fallback)
      : getErrorMessage(errorOrMessage, fallback);
  return toast.error(message, { ...baseOptions, duration: 5500, ...options });
}

export function toastWarning(message, options = {}) {
  return toast.warning(message, { ...baseOptions, ...options });
}

export function toastInfo(message, options = {}) {
  return toast.message(message, { ...baseOptions, ...options });
}

export function toastLoading(message, options = {}) {
  return toast.loading(message, options);
}
