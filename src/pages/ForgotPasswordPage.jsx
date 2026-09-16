import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Label } from '@/components/ui/Label';
import { PublicRoute } from '@/routes/ProtectedRoute';
import { useForgotPassword, useResetPassword } from '@/features/auth/hooks/useAuth';

const emailSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

const resetSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code from your email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const reset = useResetPassword();
  const [step, setStep] = useState('email'); // email | otp
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState('BIWORKSPACE');

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm({ resolver: zodResolver(resetSchema) });

  const onSendOtp = (values) => {
    forgot.mutate(values, {
      onSuccess: (data) => {
        const payload = data?.data || data;
        if (payload?.googleOnly) {
          return;
        }
        setEmailTo(payload?.emailTo || values.email);
        setEmailFrom(payload?.emailFrom || 'BIWORKSPACE');
        setStep('otp');
      },
    });
  };

  const onReset = (values) => {
    reset.mutate({
      email: emailTo,
      otp: values.otp,
      password: values.password,
    });
  };

  const subtitle = useMemo(() => {
    if (step === 'otp') {
      return `Enter the 6-digit code we emailed from BIWORKSPACE, then set a new password.`;
    }
    return `We'll email a one-time code from BIWORKSPACE so you can reset your password and sign in again.`;
  }, [step]);

  return (
    <PublicRoute>
      <div
        className="relative flex h-full min-h-0 flex-col overflow-y-auto"
        style={{ backgroundColor: 'var(--color-rail-bg)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.18] blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--color-brand-500), transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-[392px] animate-slide-up">
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-[var(--shadow-2xl)]">
              <div className="flex flex-col items-center px-7 pb-5 pt-7 text-center">
                <BrandLogo asLink={false} size="md" className="justify-center" />
                <h1 className="voice-line mt-5 text-[24px] text-text-primary">
                  {step === 'otp' ? 'Enter OTP & new password' : 'Forgot password'}
                </h1>
                <p className="mt-1.5 max-w-[300px] text-[13px] text-text-muted">{subtitle}</p>
              </div>

              <div className="mx-7 h-px bg-border-subtle" />

              <div className="space-y-4 px-7 py-6">
                {step === 'email' ? (
                  <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...emailForm.register('email')}
                      />
                      {emailForm.formState.errors.email && (
                        <p className="text-sm text-bloom-coral">
                          {emailForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={forgot.isPending}>
                      {forgot.isPending ? 'Sending code…' : 'Send OTP to email'}
                    </Button>
                    <p className="text-center text-[13px] text-text-muted">
                      <Link to="/login" className="font-medium text-primary hover:underline">
                        Back to sign in
                      </Link>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                    <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-[13px] text-text-muted">
                      Code sent from <span className="font-medium text-text-primary">{emailFrom}</span>{' '}
                      to <span className="font-medium text-text-primary">{emailTo}</span>. Check
                      inbox and spam.
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp">6-digit OTP</Label>
                      <Input
                        id="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        maxLength={6}
                        {...resetForm.register('otp')}
                      />
                      {resetForm.formState.errors.otp && (
                        <p className="text-sm text-bloom-coral">
                          {resetForm.formState.errors.otp.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">New password</Label>
                      <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        {...resetForm.register('password')}
                      />
                      {resetForm.formState.errors.password && (
                        <p className="text-sm text-bloom-coral">
                          {resetForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <PasswordInput
                        id="confirmPassword"
                        autoComplete="new-password"
                        {...resetForm.register('confirmPassword')}
                      />
                      {resetForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-bloom-coral">
                          {resetForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={reset.isPending}>
                      {reset.isPending ? 'Saving…' : 'Reset password & continue'}
                    </Button>
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => {
                          setStep('email');
                          resetForm.reset();
                        }}
                      >
                        Use a different email
                      </button>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline disabled:opacity-50"
                        disabled={forgot.isPending}
                        onClick={() => onSendOtp({ email: emailTo })}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-4 py-5 text-center text-[11px] text-white">
          © {new Date().getFullYear()} BIWORKSPACE
        </div>
      </div>
    </PublicRoute>
  );
}
