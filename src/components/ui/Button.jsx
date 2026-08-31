import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — BIWORKSPACE Design System
 *
 * Variants:
 *   primary   — Brand gradient, shadow, shimmer on hover (default)
 *   outline   — Bordered, transparent background
 *   ghost     — No border, subtle hover
 *   ghost-dark— Ghost variant for use inside dark sidebars
 *   ink       — Dark/inverted button
 *   destructive — Red danger action
 *
 * Sizes:  sm | default | lg | icon
 */
const buttonVariants = cva(
  [
    'inline-flex cursor-pointer items-center justify-center gap-2',
    'font-semibold border tracking-[-0.005em]',
    'transition-[background-color,border-color,color,box-shadow] duration-[130ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-45',
    'active:scale-[0.985]',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'border-transparent text-white',
          'bg-brand-500 shadow-xs',
          'hover:bg-brand-600',
          'active:bg-brand-700',
        ].join(' '),

        outline: [
          'border-border-base bg-surface-0 text-text-secondary',
          'hover:border-border-strong hover:bg-surface-1 hover:text-text-primary',
        ].join(' '),

        ghost: [
          'border-transparent bg-transparent text-text-secondary',
          'hover:bg-surface-2 hover:text-text-primary',
        ].join(' '),

        'ghost-dark': [
          'border-transparent bg-transparent',
          'text-[var(--color-sidebar-text)]',
          'hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]',
        ].join(' '),

        ink: [
          'border-transparent bg-text-primary text-white',
          'hover:bg-black',
        ].join(' '),

        destructive: [
          'border-transparent bg-danger-500 text-white shadow-xs',
          'hover:bg-[#b23c41]',
        ].join(' '),
      },

      size: {
        default: 'h-9 rounded-lg px-4 text-sm',
        sm:      'h-7 rounded-md px-3 text-xs',
        lg:      'h-11 rounded-xl px-6 text-sm',
        icon:    'h-9 w-9 rounded-lg',
        'icon-sm': 'h-7 w-7 rounded-md',
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
