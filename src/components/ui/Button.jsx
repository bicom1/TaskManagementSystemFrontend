import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 border font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-on-ink shadow-soft-lift hover:border-primary-bright hover:bg-primary-bright',
        outline:
          'border-hairline bg-paper text-ink hover:border-primary/40 hover:bg-primary-soft/50 hover:text-primary-deep',
        ink: 'border-ink bg-ink text-on-ink hover:border-charcoal hover:bg-charcoal',
        ghost:
          'border-transparent bg-transparent text-charcoal hover:bg-cloud hover:text-ink',
        destructive:
          'border-bloom-coral bg-bloom-coral text-on-ink hover:border-bloom-deep hover:bg-bloom-deep',
      },
      size: {
        default: 'h-10 rounded-lg px-4 text-sm normal-case tracking-normal',
        sm: 'h-8 rounded-lg px-3 text-xs normal-case tracking-normal',
        lg: 'h-11 rounded-xl px-6 text-sm normal-case tracking-normal',
        icon: 'h-9 w-9 rounded-lg',
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
