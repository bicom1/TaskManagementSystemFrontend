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
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: [
          'bg-brand-100 text-brand-700',
          'ring-1 ring-brand-200',
        ].join(' '),

        secondary: [
          'bg-surface-2 text-text-secondary',
          'ring-1 ring-border-subtle',
        ].join(' '),

        outline: [
          'border border-border-base bg-surface-0 text-text-secondary',
        ].join(' '),

        success: [
          'bg-success-bg text-success-text',
          'ring-1 ring-success-border',
        ].join(' '),

        warning: [
          'bg-warning-bg text-warning-text',
          'ring-1 ring-warning-border',
        ].join(' '),

        danger: [
          'bg-danger-bg text-danger-text',
          'ring-1 ring-danger-border',
        ].join(' '),

        info: [
          'bg-info-bg text-info-text',
          'ring-1 ring-info-border',
        ].join(' '),

        /* Pulsing "live" status badge */
        active: [
          'bg-success-bg text-success-text',
          'ring-1 ring-success-border',
        ].join(' '),
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
