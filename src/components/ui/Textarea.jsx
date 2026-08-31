import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea — BIWORKSPACE Design System
 * Matches Input / Select styling for visual consistency.
 */
export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[88px] w-full resize-y px-3 py-2.5',
        'text-sm text-text-primary placeholder:text-text-muted leading-relaxed',
        'rounded-lg border border-border-base bg-surface-0',
        'transition-[border-color,box-shadow] duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'focus-visible:outline-none focus-visible:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-400/20',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-2',
        className
      )}
      {...props}
    />
  );
});
