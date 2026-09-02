import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const TONE_STYLES = {
  brand: {
    glow: 'var(--color-brand-400)',
    glowSecondary: 'radial-gradient(circle, #fcd34d, transparent 70%)',
    badge: 'border-brand-200/60 bg-brand-50/80 text-brand-700',
  },
  amber: {
    glow: '#fbbf24',
    glowSecondary: 'radial-gradient(circle, var(--color-brand-300), transparent 70%)',
    badge: 'border-amber-200/70 bg-amber-50/90 text-amber-700',
  },
  emerald: {
    glow: '#34d399',
    glowSecondary: 'radial-gradient(circle, #a7f3d0, transparent 70%)',
    badge: 'border-emerald-200/70 bg-emerald-50/90 text-emerald-700',
  },
  danger: {
    glow: '#f87171',
    glowSecondary: 'radial-gradient(circle, #fecaca, transparent 70%)',
    badge: 'border-red-200/70 bg-red-50/90 text-red-700',
  },
};

/**
 * Modal — BIWORKSPACE Design System
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   title         — string (renders h2 in header)
 *   description   — string (renders p below title)
 *   size          — 'sm' | 'md' | 'lg' | 'xl'
 *   variant       — 'default' | 'premium'
 *   badge         — short label above title (premium only)
 *   tone          — 'brand' | 'amber' | 'emerald' | 'danger' (premium header accent)
 *   className     — applied to the dialog panel
 *   bodyClassName — applied to the scrollable body
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  variant = 'default',
  badge,
  tone = 'brand',
  bodyClassName,
}) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.brand;
  const isPremium = variant === 'premium';

  const closeButton = isPremium ? (
    <button
      type="button"
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-white/80 text-graphite shadow-sm transition hover:bg-cloud hover:text-ink"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </button>
  ) : (
    <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="shrink-0">
      <X className="h-4 w-4" />
    </Button>
  );

  const header = (
    <div
      className={cn(
        'flex shrink-0 items-start justify-between',
        isPremium
          ? 'relative overflow-hidden border-b border-hairline/80 px-5 pb-4 pt-5'
          : 'border-b border-border-subtle bg-surface-1 px-5 py-4 sm:px-6'
      )}
    >
      {isPremium && (
        <>
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl"
            style={{ background: `radial-gradient(circle, ${toneStyle.glow}, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full opacity-30 blur-2xl"
            style={{ background: toneStyle.glowSecondary }}
          />
        </>
      )}
      <div className={cn('min-w-0 pr-3', isPremium && 'relative')}>
        {isPremium && badge && (
          <div
            className={cn(
              'mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
              toneStyle.badge
            )}
          >
            {badge}
          </div>
        )}
        {title && (
          <h2
            id="modal-title"
            className={cn(
              'font-semibold leading-snug tracking-tight text-ink',
              isPremium ? 'text-lg' : 'text-[0.9375rem] text-text-primary'
            )}
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            className={cn(
              'mt-1 leading-snug',
              isPremium ? 'max-w-[90%] text-sm text-graphite' : 'text-[0.8125rem] text-text-muted'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {closeButton}
    </div>
  );

  const body = (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto',
        isPremium ? 'px-5 py-4' : 'px-5 py-5 sm:px-6',
        bodyClassName
      )}
    >
      {children}
    </div>
  );

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className={cn(
        'relative z-10 flex w-full flex-col overflow-hidden',
        'max-h-[min(880px,calc(100vh-2rem))]',
        isPremium
          ? 'rounded-[22px] border border-white/60 bg-paper shadow-[0_24px_80px_rgba(15,15,19,0.22)] animate-scale-in'
          : 'rounded-2xl border border-border-subtle bg-surface-0 shadow-[var(--shadow-2xl)] animate-[scaleIn_150ms_cubic-bezier(0.34,1.4,0.64,1)_both]',
        sizeClasses[size],
        className
      )}
    >
      {header}
      {body}
    </div>
  );

  if (isPremium) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div
          className="absolute inset-0 bg-[rgba(8,8,12,0.55)] backdrop-blur-[6px]"
          onClick={onClose}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full opacity-25 blur-[100px]"
            style={{ background: toneStyle.glow }}
          />
        </div>
        {panel}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(19,19,24,0.42)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      {panel}
    </div>
  );
}

/** Shared footer row for premium form modals */
export function ModalFormFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-hairline/80 pt-4',
        className
      )}
    >
      {children}
    </div>
  );
}
