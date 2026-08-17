import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-graphite">{message}</p>
    </div>
  );
}

/** Lightweight placeholders — keeps layout visible while data loads */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-hairline bg-paper p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-3">
          <div className="h-4 w-4 rounded bg-cloud" />
          <div className="h-3 flex-1 rounded bg-cloud" />
          <div className="h-3 w-16 rounded bg-cloud" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }) {
  return (
    <div className="grid animate-pulse gap-4 md:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border border-hairline bg-paper p-4">
          <div className="mb-4 h-4 w-1/3 rounded bg-cloud" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-cloud" />
            <div className="h-3 w-5/6 rounded bg-cloud" />
            <div className="h-3 w-2/3 rounded bg-cloud" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-steel" />}
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-graphite">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
