import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input — BIWORKSPACE Design System
 *
 * Props mirror a standard <input> element.
 * For dark sidebar context, pass className="input-dark"
 */
export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        // Layout
        'flex h-9 w-full px-3 py-2',
        // Typography
        'text-sm text-text-primary placeholder:text-text-muted',
        // Background & border
        'rounded-lg border border-border-base bg-surface-0',
        // Transitions
        'transition-[border-color,box-shadow,background-color] duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        // Focus — quiet ring
        'focus-visible:outline-none',
        'focus-visible:border-brand-400',
        'focus-visible:ring-2 focus-visible:ring-brand-400/25',
        'focus-visible:bg-surface-0',
        // Hover
        'hover:border-border-strong',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-2',
        className
      )}
      {...props}
    />
  );
});
