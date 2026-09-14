import { create } from 'zustand';

/**
 * Light / dark / system appearance.
 *
 * The first paint is handled by the inline script in index.html (same key and
 * rules as here) so a dark page never flashes white. This store keeps the
 * choice, follows OS changes while on "system", and syncs other open tabs.
 */
export const THEME_STORAGE_KEY = 'bw-theme';
export const THEME_OPTIONS = ['light', 'dark', 'system'];

const THEME_COLOR = { light: '#f6f6f7', dark: '#0f0f13' };
const systemQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

function readPreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_OPTIONS.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function resolve(preference) {
  if (preference === 'system') return systemQuery?.matches ? 'dark' : 'light';
  return preference;
}

function apply(resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
}

const initialPreference = readPreference();

export const useThemeStore = create((set, get) => ({
  /** What the person chose: light | dark | system */
  preference: initialPreference,
  /** What is on screen: light | dark */
  resolved: resolve(initialPreference),
  setPreference: (preference) => {
    if (!THEME_OPTIONS.includes(preference)) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* private mode — still switch for this session */
    }
    const resolved = resolve(preference);
    apply(resolved);
    set({ preference, resolved });
  },
  /** Flip between light and dark from whatever is showing now. */
  toggle: () => get().setPreference(get().resolved === 'dark' ? 'light' : 'dark'),
}));

apply(resolve(initialPreference));

systemQuery?.addEventListener?.('change', () => {
  const { preference } = useThemeStore.getState();
  if (preference !== 'system') return;
  const resolved = resolve('system');
  apply(resolved);
  useThemeStore.setState({ resolved });
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const preference = THEME_OPTIONS.includes(event.newValue) ? event.newValue : 'system';
    const resolved = resolve(preference);
    apply(resolved);
    useThemeStore.setState({ preference, resolved });
  });
}
