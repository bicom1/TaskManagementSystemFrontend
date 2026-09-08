/** Tab-scoped session marker (cleared when the browser tab/window closes). */
export const TAB_SESSION_KEY = 'bw_tab_session';

export function hasTabSession() {
  try {
    return sessionStorage.getItem(TAB_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTabSession() {
  try {
    sessionStorage.setItem(TAB_SESSION_KEY, '1');
  } catch {
    // ignore private-mode / blocked storage
  }
}

export function clearTabSession() {
  try {
    sessionStorage.removeItem(TAB_SESSION_KEY);
  } catch {
    // ignore
  }
}
