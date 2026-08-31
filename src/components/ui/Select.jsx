import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Select — BIWORKSPACE Design System
 * Matches Input styling for visual consistency.
 */
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full cursor-pointer appearance-none px-3 py-2',
        'text-sm text-text-primary',
        'rounded-lg border border-border-base bg-surface-0',
        'transition-[border-color,box-shadow] duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'focus-visible:outline-none focus-visible:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-400/20',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-2',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
