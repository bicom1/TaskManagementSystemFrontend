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
          <Card className="relative z-10 w-full max-w-[420px] border border-border-subtle shadow-[var(--shadow-xl)]">
            <CardHeader className="space-y-3 pb-2">
              <BrandLogo asLink={false} size="md" />
              <div>
                <CardTitle className="voice-line text-[24px] font-normal leading-tight tracking-[-0.01em] sm:text-[26px]">
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
                <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-text-secondary">
                  Invite link accepted — fill in your details below, or continue with Google.
                </div>
              )}
              <RegisterForm />
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-disabled">
                  or
                </span>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>
              <GoogleAuthButton label="Sign up with Google" inviteOnly />
              <p className="text-center text-sm text-graphite">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
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
