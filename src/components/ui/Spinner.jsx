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
