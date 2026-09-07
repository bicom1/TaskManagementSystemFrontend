import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

/**
 * Password field with show / hide toggle (eye icon).
 * Drop-in for react-hook-form via {...register('password')}.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { className, id, autoComplete = 'current-password', ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.8} /> : <Eye className="h-4 w-4" strokeWidth={1.8} />}
      </button>
    </div>
  );
});
