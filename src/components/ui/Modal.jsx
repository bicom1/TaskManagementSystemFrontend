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
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 flex max-h-[min(880px,calc(100vh-2rem))] w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-[0_20px_50px_rgba(26,26,26,0.18)]',
          sizeClasses[size],
          className
        )}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-hairline bg-cloud/30 px-5 py-3.5 sm:px-6">
          <div className="min-w-0 pr-3">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold tracking-tight text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-graphite">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 shrink-0 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6', bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
