import { useEffect, useRef, useState } from 'react';
import { Check, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SUBTASK_MODES = [
  {
    id: 'collapsed',
    label: 'Collapsed (default)',
    hint: 'Hide subtasks under their parent',
  },
  {
    id: 'expanded',
    label: 'Expanded',
    hint: 'Nest subtasks under each parent',
  },
  {
    id: 'separate',
    label: 'Separate',
    hint: 'Show subtasks as their own rows',
  },
];

const STORAGE_KEY = 'tms-subtask-mode';

export function readSubtaskMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUBTASK_MODES.some((m) => m.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'collapsed';
}

export function SubtasksMenu({ value = 'collapsed', onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = SUBTASK_MODES.find((m) => m.id === value) || SUBTASK_MODES[0];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition',
          open
            ? 'border-ink/15 bg-cloud text-ink'
            : 'border-hairline bg-paper text-ink hover:bg-cloud'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <GitBranch className="h-3.5 w-3.5 text-graphite" />
        Subtasks
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1.5 w-[220px] overflow-hidden rounded-xl border border-hairline bg-paper py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] animate-scale-in"
        >
          <p className="px-3 pb-1.5 pt-1 text-[11px] font-medium text-graphite">Show subtasks</p>
          {SUBTASK_MODES.map((mode) => {
            const selected = mode.id === active.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange?.(mode.id);
                  try {
                    localStorage.setItem(STORAGE_KEY, mode.id);
                  } catch {
                    /* ignore */
                  }
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-cloud"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{mode.label}</span>
                </span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-ink" /> : null}
              </button>
            );
          })}
          <p className="px-3 pb-1.5 pt-1 text-[11px] text-graphite">Use this to filter subtasks</p>
        </div>
      )}
    </div>
  );
}
