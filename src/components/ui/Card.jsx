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
        'rounded-xl border border-border-subtle bg-surface-0',
        'shadow-[0_1px_3px_rgba(13,13,20,0.07),0_1px_2px_rgba(13,13,20,0.03)]',
        'transition-all duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        hover && [
          'hover:shadow-[0_6px_20px_rgba(13,13,20,0.10),0_2px_6px_rgba(13,13,20,0.04)]',
          'hover:-translate-y-0.5',
        ],
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
const statColorMap = {
  brand: {
    wrap: 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200',
    icon: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]',
    value: 'text-text-primary',
  },
  success: {
    wrap: 'bg-gradient-to-br from-success-bg to-green-50 border-success-border',
    icon: 'bg-gradient-to-br from-success-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(34,197,94,0.35)]',
    value: 'text-text-primary',
  },
  warning: {
    wrap: 'bg-gradient-to-br from-warning-bg to-amber-50 border-warning-border',
    icon: 'bg-gradient-to-br from-warning-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)]',
    value: 'text-text-primary',
  },
  danger: {
    wrap: 'bg-gradient-to-br from-danger-bg to-rose-50 border-danger-border',
    icon: 'bg-gradient-to-br from-danger-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.35)]',
    value: 'text-text-primary',
  },
  neutral: {
    wrap: 'bg-gradient-to-br from-surface-1 to-surface-2 border-border-subtle',
    icon: 'bg-gradient-to-br from-text-secondary to-text-primary text-white shadow-md',
    value: 'text-text-primary',
  },
};

export function StatCard({ icon: Icon, label, value, color = 'brand', trend, className }) {
  const colors = statColorMap[color] ?? statColorMap.brand;
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border p-5',
        'transition-all duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,13,20,0.10)]',
        colors.wrap,
        className
      )}
    >
      {/* Subtle corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-300"
        style={{ background: 'var(--color-brand-400)' }}
      />

      <div className="flex items-start gap-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-2xl font-bold leading-none tracking-tight', colors.value)}>
            {value}
          </p>
          <p className="mt-1 text-[0.8125rem] font-medium text-text-muted">{label}</p>
          {trend && (
            <p className="mt-2 text-[0.75rem] font-medium text-success-text">{trend}</p>
          )}
        </div>
      </div>
    </div>
  );
}
