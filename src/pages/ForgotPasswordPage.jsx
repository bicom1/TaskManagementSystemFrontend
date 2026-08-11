import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDecoration } from '@/components/layout/ChevronDecoration';
import { GradientBlobs } from '@/components/layout/GradientBlobs';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <div className="relative flex min-h-screen flex-col bg-cloud overflow-hidden">
        <div className="flex h-9 items-center bg-ink px-3 text-[12px] text-on-ink sm:px-4 sm:text-[13px]">
          <div className="mx-auto flex w-full max-w-[1366px] items-center justify-between gap-2">
            <span className="font-medium tracking-wide">BIWORKSPACE</span>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
          <GradientBlobs />
          <ChevronDecoration />
          <Card className="relative z-10 w-full max-w-[420px] border-0 shadow-[var(--shadow-soft-lift)]">
            <CardHeader className="space-y-3 pb-2">
              <BrandLogo asLink={false} size="lg" />
              <div>
                <CardTitle className="text-[24px] leading-none sm:text-[28px]">
                  {step === 'otp' ? 'Enter OTP & new password' : 'Forgot password'}
                </CardTitle>
                <CardDescription className="mt-2">{subtitle}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
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
                  <p className="text-center text-sm text-graphite">
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Back to sign in
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                  <div className="rounded-lg border border-primary-soft bg-primary-soft/30 px-3 py-2 text-sm text-graphite">
                    Code sent from <span className="font-medium text-ink">{emailFrom}</span> to{' '}
                    <span className="font-medium text-ink">{emailTo}</span>. Check inbox and spam.
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
                    <Input
                      id="password"
                      type="password"
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
                    <Input
                      id="confirmPassword"
                      type="password"
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
                  <div className="flex items-center justify-between gap-2 text-sm">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicRoute>
  );
}
