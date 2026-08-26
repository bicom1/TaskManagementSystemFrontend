import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full cursor-pointer rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
