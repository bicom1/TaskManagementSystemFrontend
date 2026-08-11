import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 flex max-h-[min(880px,calc(100vh-2rem))] w-full flex-col overflow-hidden rounded-xl border border-hairline bg-paper shadow-[var(--shadow-soft-lift)]',
          sizeClasses[size],
          className
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-hairline px-5 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 pr-3">
            {title && (
              <h2 id="modal-title" className="text-lg font-medium text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-graphite">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6', bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
