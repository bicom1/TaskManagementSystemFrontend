import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDecoration } from '@/components/layout/ChevronDecoration';
import { GradientBlobs } from '@/components/layout/GradientBlobs';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { PublicRoute } from '@/routes/ProtectedRoute';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const fromInvite = params.get('invite') === '1';

  return (
    <PublicRoute>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-cloud">
        <div className="flex h-9 items-center bg-ink px-3 text-[12px] text-on-ink sm:px-4 sm:text-[13px]">
          <div className="mx-auto flex w-full max-w-[1366px] items-center justify-between gap-2">
            <span className="font-medium tracking-wide">BIWORKSPACE</span>
            <span className="hidden text-steel xs:inline sm:inline">
              Plan, track, and ship work together
            </span>
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
                  {fromInvite ? 'Join BIWORKSPACE' : 'Create account'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {fromInvite
                    ? 'You were invited via a share link. Create your account to get started.'
                    : "Join your organization's workspace to track delivery."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {fromInvite && (
                <div className="rounded-lg border border-primary-soft bg-primary-soft/40 px-3 py-2 text-sm text-ink">
                  Invite link accepted — fill in your details below, or continue with Google.
                </div>
              )}
              <RegisterForm />
              <GoogleAuthButton label="Sign up with Google" />
              <p className="text-center text-sm text-graphite">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-steel/20 px-4 py-4 text-center text-xs text-graphite">
          © {new Date().getFullYear()} BIWORKSPACE. All rights reserved.
        </div>
      </div>
    </PublicRoute>
  );
}
