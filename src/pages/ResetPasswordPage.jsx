import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useResetPassword } from '@/features/auth/hooks/useAuth';

const schema = z
  .object({
    email: z.string().trim().email('Enter your account email'),
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

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reset = useResetPassword();
  const emailFromQuery = params.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromQuery,
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values) => {
    reset.mutate(
      {
        email: values.email,
        otp: values.otp,
        password: values.password,
      },
      {
        onSuccess: () => navigate('/login', { replace: true }),
      }
    );
  };

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
                <CardTitle className="voice-line text-[24px] font-normal leading-tight tracking-[-0.01em] sm:text-[26px]">
                  Reset password
                </CardTitle>
                <CardDescription className="mt-2">
                  Enter the OTP from your BIWORKSPACE email, then choose a new password.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-sm text-bloom-coral">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    {...register('otp')}
                  />
                  {errors.otp && (
                    <p className="text-sm text-bloom-coral">{errors.otp.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-bloom-coral">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-bloom-coral">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={reset.isPending}>
                  {reset.isPending ? 'Saving…' : 'Reset password'}
                </Button>
                <p className="text-center text-sm text-graphite">
                  Need a new code?{' '}
                  <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                    Request OTP
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicRoute>
  );
}
