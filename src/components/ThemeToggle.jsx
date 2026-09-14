import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/theme';
import { cn } from '@/lib/utils';

export const THEME_CHOICES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor, hint: 'Match this device' },
];

/** Top-bar appearance switch: shows the current mode, opens Light / Dark / System. */
export function ThemeToggle({ className }) {
  const preference = useThemeStore((s) => s.preference);
  const resolved = useThemeStore((s) => s.resolved);
  const setPreference = useThemeStore((s) => s.setPreference);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const CurrentIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-primary',
          open && 'bg-surface-2 text-text-primary'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Appearance: ${preference === 'system' ? `system (${resolved})` : preference}`}
        title="Appearance"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Appearance"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-xl border border-border-subtle bg-surface-0 p-1 shadow-lg"
        >
          {THEME_CHOICES.map(({ id, label, icon: Icon, hint }) => {
            const selected = preference === id;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setPreference(id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                  selected
                    ? 'bg-surface-2 font-medium text-text-primary'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="min-w-0 flex-1">
                  <span className="block">{label}</span>
                  {hint ? <span className="block text-[11px] text-text-muted">{hint}</span> : null}
                </span>
                {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
