import { cn } from '@/lib/utils';

/**
 * Card — BIWORKSPACE Design System
 *
 * Usage:
 *   <Card>                          — standard elevated card
 *   <Card hover>                    — adds lift-on-hover
 *   <Card variant="flush">          — no padding, full bleed
 *   <CardHeader> <CardTitle>        — header section
 *   <CardContent>                   — main body
 *   <CardFooter>                    — bottom action row
 *   <CardDescription>              — muted sub-text
 */

export function Card({ className, hover = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border-subtle bg-surface-0 shadow-xs',
        'transition-[box-shadow,border-color] duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        hover && 'hover:shadow-md hover:border-border-base',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-5 pt-5 pb-0 sm:px-6 sm:pt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        'text-[0.9375rem] font-semibold leading-snug tracking-tight text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-[0.8125rem] leading-relaxed text-text-muted', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-5 py-5 sm:px-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-t border-border-subtle px-5 py-3.5 sm:px-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * StatCard — A card variant for dashboard KPI numbers.
 *
 *   <StatCard icon={Icon} label="Active Projects" value={12} color="brand" />
 *
 * color: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
 */
const statAccentMap = {
  brand: 'text-brand-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  danger: 'text-danger-500',
  neutral: 'text-text-muted',
};

/**
 * StatCard — a precision readout. One number, one label, a hairline
 * accent rule, and an optional trend. No fills, no glows.
 */
export function StatCard({ icon: Icon, label, value, color = 'brand', trend, className }) {
  const accent = statAccentMap[color] ?? statAccentMap.brand;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border-subtle bg-surface-0 p-4 shadow-xs',
        'transition-[box-shadow,border-color] duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:border-border-base',
        className
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-3 left-0 w-[2px] rounded-r-full bg-current', accent)} />
      <div className="flex items-center justify-between">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-text-muted">{label}</p>
        {Icon && <Icon className={cn('h-3.5 w-3.5 opacity-70', accent)} />}
      </div>
      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-text-primary tabular-nums">
        {value}
      </p>
      {trend && (
        <p className="mt-1.5 text-[0.75rem] font-medium text-text-muted tabular-nums">{trend}</p>
      )}
    </div>
  );
}
