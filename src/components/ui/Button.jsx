import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 border font-semibold uppercase tracking-[0.7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-on-ink hover:border-primary-bright hover:bg-primary-bright',
        outline: 'border-primary bg-paper text-primary hover:bg-primary-soft',
        ink: 'border-ink bg-ink text-on-ink hover:border-charcoal hover:bg-charcoal',
        ghost:
          'border-transparent bg-transparent text-charcoal hover:border-hairline hover:bg-cloud uppercase tracking-normal font-medium normal-case',
        destructive:
          'border-bloom-coral bg-bloom-coral text-on-ink hover:border-bloom-deep hover:bg-bloom-deep',
      },
      size: {
        default: 'h-11 px-6 rounded-md text-sm',
        sm: 'h-9 px-4 rounded-md text-xs',
        lg: 'h-11 px-8 rounded-md text-sm',
        icon: 'h-11 w-11 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export const Button = forwardRef(function Button(
  { className, variant, size, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { buttonVariants };
