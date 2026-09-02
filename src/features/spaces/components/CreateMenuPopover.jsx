import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CheckSquare, Folder, RefreshCw, Download, Wand2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CREATE_MENU_PRIMARY = [
  {
    id: 'list',
    label: 'List',
    description: 'Track tasks, projects, people & more',
    icon: CheckSquare,
    accent: 'from-brand-500 to-brand-700',
    iconBg: 'bg-brand-50 text-brand-600',
    ring: 'hover:ring-brand-200',
  },
  {
    id: 'folder',
    label: 'Folder',
    description: 'Group lists and related projects',
    icon: Folder,
    accent: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-50 text-amber-600',
    ring: 'hover:ring-amber-200',
  },
  {
    id: 'sprint',
    label: 'Sprint Folder',
    description: 'Organize agile sprints in one place',
    icon: RefreshCw,
    accent: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-50 text-emerald-600',
    ring: 'hover:ring-emerald-200',
  },
];

export const CREATE_MENU_FOOTER = [
  { id: 'imports', label: 'Imports', description: 'Bring work in', icon: Download },
  { id: 'templates', label: 'Templates', description: 'Start from a template', icon: Wand2 },
];

function MenuPanel({ onSelect, onClose, centered, className, style }) {
  const pick = (id) => {
    onSelect?.(id);
    onClose?.();
  };

  return (
    <div
      role="menu"
      aria-label="Create"
      style={style}
      className={cn(
        'z-[80] flex w-full flex-col overflow-hidden border border-white/60 bg-paper shadow-[0_24px_80px_rgba(15,15,19,0.22)] animate-scale-in',
        centered
          ? 'max-w-[420px] rounded-[22px]'
          : 'w-[300px] rounded-2xl border-hairline bg-paper/95 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-md',
        className
      )}
    >
      {centered ? (
        <div className="relative overflow-hidden border-b border-hairline/80 px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-brand-300), transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full opacity-30 blur-2xl"
            style={{ background: 'radial-gradient(circle, #fcd34d, transparent 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                <Sparkles className="h-3 w-3" />
                New workspace item
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">What would you like to create?</h2>
              <p className="mt-1 max-w-[280px] text-sm leading-snug text-graphite">
                Pick a structure for your work — lists, folders, or sprint groups.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-white/80 text-graphite shadow-sm transition hover:bg-cloud hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="text-sm font-semibold text-ink">Create</p>
        </div>
      )}

      <div className={cn('flex-1', centered ? 'space-y-2 p-4' : 'space-y-1 p-2')}>
        {CREATE_MENU_PRIMARY.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => pick(item.id)}
              className={cn(
                'group flex w-full items-center gap-3.5 text-left transition-all',
                centered
                  ? cn(
                      'rounded-xl border border-hairline/80 bg-gradient-to-br from-white to-surface-1/80 p-3 shadow-sm ring-1 ring-transparent hover:-translate-y-0.5 hover:border-hairline hover:shadow-md',
                      item.ring
                    )
                  : 'rounded-xl px-3 py-2.5 hover:bg-cloud'
              )}
            >
              <span
                className={cn(
                  'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm',
                  centered ? 'h-10 w-10' : 'h-9 w-9 rounded-lg border border-hairline bg-cloud',
                  centered && item.iconBg
                )}
              >
                {centered && (
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-15',
                      item.accent
                    )}
                  />
                )}
                <Icon className={cn('relative z-[1]', centered ? 'h-4 w-4' : 'h-4 w-4 text-ink')} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block font-semibold text-ink transition-colors group-hover:text-brand-700',
                    centered ? 'text-sm' : 'text-sm'
                  )}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-graphite">{item.description}</span>
              </span>
              {centered && (
                <span className="text-lg font-light text-steel/50 transition group-hover:translate-x-0.5 group-hover:text-brand-400">
                  →
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          'border-t border-hairline/80',
          centered ? 'bg-surface-1/40 px-4 py-3' : 'p-2'
        )}
      >
        {centered ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
            More options
          </p>
        ) : null}
        <div className={cn(centered ? 'grid grid-cols-2 gap-2' : 'space-y-0.5')}>
          {CREATE_MENU_FOOTER.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => pick(item.id)}
                className={cn(
                  'flex items-center gap-2.5 text-left transition-colors',
                  centered
                    ? 'rounded-xl border border-hairline/80 bg-white px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40'
                    : 'w-full rounded-lg px-3 py-2 hover:bg-cloud'
                )}
              >
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-lg',
                    centered ? 'h-8 w-8 bg-cloud text-graphite' : ''
                  )}
                >
                  <Icon className="h-4 w-4 text-graphite" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  {centered && (
                    <span className="block text-[11px] text-graphite">{item.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * ClickUp-style Create popover — anchored to + or centered modal.
 */
export function CreateMenuPopover({ open, onClose, onSelect, anchorRef, centered = false }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const useModal = centered || !anchorRef?.current;

  useLayoutEffect(() => {
    if (!open || useModal) return;

    const anchor = anchorRef?.current;
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const panel = panelRef.current;
      const width = 300;
      const height = panel?.offsetHeight || 380;
      const gap = 8;

      let left = rect.right + gap;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, rect.left - width - gap);
      }

      let top = rect.top - 12;
      if (top + height > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - height - 12);
      }
      if (top < 12) top = 12;

      setPos({ top, left: Math.max(12, left) });
    };

    place();
    requestAnimationFrame(place);
  }, [open, anchorRef, useModal]);

  useEffect(() => {
    if (!open) return undefined;

    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (!useModal && anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = useModal ? 'hidden' : '';
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      if (useModal) document.body.style.overflow = '';
    };
  }, [open, onClose, anchorRef, useModal]);

  if (!open) return null;

  if (useModal) {
    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-6">
        <div
          className="absolute inset-0 bg-[rgba(8,8,12,0.55)] backdrop-blur-[6px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-[100px]"
            style={{ background: 'var(--color-brand-400)' }}
          />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-amber-300/20 blur-[80px]" />
        </div>
        <div ref={panelRef} className="relative flex w-full max-w-[420px] flex-col">
          <MenuPanel onSelect={onSelect} onClose={onClose} centered={centered || !anchorRef?.current} />
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="fixed" style={{ top: pos.top, left: pos.left }}>
      <MenuPanel onSelect={onSelect} onClose={onClose} centered={false} />
    </div>
  );
}
