import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-primary-soft text-primary-deep',
        secondary: 'bg-cloud text-charcoal',
        outline: 'border border-hairline bg-paper text-charcoal',
        success: 'bg-primary-soft/80 text-primary-deep',
        warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
        destructive: 'bg-red-50 text-bloom-deep ring-1 ring-red-200/70',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
