import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * Modal — BIWORKSPACE Design System
 *
 * Props:
 *   open         — boolean
 *   onClose      — () => void
 *   title        — string (renders h2 in header)
 *   description  — string (renders p below title)
 *   size         — 'sm' | 'md' | 'lg' | 'xl'
 *   className    — applied to the dialog panel
 *   bodyClassName— applied to the scrollable body
 */
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
      {/* Backdrop — dark glass */}
      <div
        className="absolute inset-0 bg-[rgba(19,19,24,0.42)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden',
          'max-h-[min(880px,calc(100vh-2rem))]',
          // Surface
          'rounded-2xl border border-border-subtle bg-surface-0',
          // Premium shadow
          'shadow-[var(--shadow-2xl)]',
          // Entry animation
          'animate-[scaleIn_150ms_cubic-bezier(0.34,1.4,0.64,1)_both]',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border-subtle bg-surface-1 px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-3">
            {title && (
              <h2
                id="modal-title"
                className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-text-primary"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[0.8125rem] text-text-muted">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
