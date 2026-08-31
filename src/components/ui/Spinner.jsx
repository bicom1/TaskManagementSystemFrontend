import { cn } from '@/lib/utils';

/**
 * Spinner — BIWORKSPACE Design System
 *
 * Gradient ring spinner using conic-gradient + mask technique.
 * Sizes: 'sm' | 'md' | 'lg'
 */
export function Spinner({ className, size = 'md' }) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-11 w-11',
  };

  return (
    <div
      className={cn('relative shrink-0', sizeMap[size], className)}
      role="status"
      aria-label="Loading"
    >
      {/* Outer gradient track */}
      <div
        aria-hidden
        className="absolute inset-0 animate-spin rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, var(--color-brand-500) 100%)',
        }}
      />
      {/* Inner mask to create ring */}
      <div
        aria-hidden
        className="absolute inset-[2.5px] rounded-full bg-surface-0"
      />
    </div>
  );
}

/**
 * LoadingScreen — centered full-area loading state
 */
export function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-[0.8125rem] font-medium text-text-muted">{message}</p>
    </div>
  );
}

/**
 * ListSkeleton — animated skeleton for list views
 */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-0 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-3 flex-1 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * CardGridSkeleton — animated skeleton for card grids
 */
export function CardGridSkeleton({ cards = 4 }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="min-h-[280px] rounded-xl border border-border-subtle bg-surface-0 p-5 shadow-sm"
        >
          <div className="skeleton mb-4 h-4 w-1/3 rounded" />
          <div className="space-y-3">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * EmptyState — Placeholder for empty lists/views
 *
 * Props:
 *   icon        — Lucide icon component
 *   title       — Main heading
 *   description — Supporting text
 *   action      — React node (e.g. a Button)
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-1 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
          <Icon className="h-6 w-6 text-text-muted" />
        </div>
      )}
      <h3 className="text-[0.9375rem] font-semibold tracking-tight text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
