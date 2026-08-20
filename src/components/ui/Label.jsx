import { cn } from '@/lib/utils';

export function Label({ className, htmlFor, children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('cursor-pointer text-sm font-medium text-charcoal', className)}
      {...props}
    >
      {children}
    </label>
  );
}
