import { cn } from '@/lib/utils';

export function Label({ className, htmlFor, children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      // block: a bare <label> is inline, so vertical gaps between it and its
      // field collapse unpredictably. Flex/grid parents blockify children anyway,
      // so inline usages are unaffected.
      className={cn('block cursor-pointer text-[13px] font-medium text-charcoal', className)}
      {...props}
    >
      {children}
    </label>
  );
}
