import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDecoration } from '@/components/layout/ChevronDecoration';
import { GradientBlobs } from '@/components/layout/GradientBlobs';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { readInviteToken } from '@/features/auth/components/GoogleAuthButton';
import { PublicRoute } from '@/routes/ProtectedRoute';
import AcceptInvitePage from '@/pages/AcceptInvitePage';

/**
 * Open registration is invite-only.
 * With ?token= → Complete registration (password). No Google for invited users.
 */
export default function RegisterPage() {
  const [params] = useSearchParams();
  const token = String(
    params.get('token') || params.get('inviteToken') || readInviteToken() || ''
  ).trim();

  if (token) {
    return <AcceptInvitePage />;
  }

  return (
    <PublicRoute>
      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto bg-cloud">
        <div className="flex h-9 items-center bg-ink px-3 text-[12px] text-on-ink sm:px-4 sm:text-[13px]">
          <div className="mx-auto flex w-full max-w-[1366px] items-center justify-between gap-2">
            <span className="font-medium tracking-wide">BIWORKSPACE</span>
            <span className="hidden text-on-ink/70 xs:inline sm:inline">
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
                  Join BIWORKSPACE
                </CardTitle>
                <CardDescription className="mt-2">
                  You join with an invite link from your Super Admin — not by opening this page
                  alone.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-text-secondary">
                Open the invite from your email or the shared link. That opens Complete registration
                so you can set a password, then sign in with email and password (your assigned role).
                Google sign-in is for Superadmin only.
              </div>

              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Go to sign in
              </Link>

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
