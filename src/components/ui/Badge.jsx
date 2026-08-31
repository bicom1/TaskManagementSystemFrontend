import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — BIWORKSPACE Design System
 *
 * Variants:
 *   default     — Brand blue (general label)
 *   secondary   — Neutral gray
 *   outline     — Bordered, no fill
 *   success     — Green (completed, approved)
 *   warning     — Amber (in progress, pending)
 *   danger      — Red (overdue, blocked, error)
 *   info        — Blue (informational)
 *   active      — Pulsing green dot + label (live status)
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tracking-[0.01em]',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700',
        secondary: 'bg-surface-2 text-text-secondary',
        outline: 'border border-border-base bg-surface-0 text-text-secondary',
        success: 'bg-success-bg text-success-text',
        warning: 'bg-warning-bg text-warning-text',
        danger: 'bg-danger-bg text-danger-text',
        info: 'bg-info-bg text-info-text',
        /* Pulsing "live" status badge */
        active: 'bg-success-bg text-success-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, showDot = false, ...props }) {
  const isActive = variant === 'active';
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {(showDot || isActive) && (
        <span
          aria-hidden
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            isActive ? 'bg-success-500 animate-[pulse-ring_2s_infinite]' : 'bg-current opacity-60'
          )}
        />
      )}
      {props.children}
    </span>
  );
}
