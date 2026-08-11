import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDecoration } from '@/components/layout/ChevronDecoration';
import { GradientBlobs } from '@/components/layout/GradientBlobs';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { PublicRoute } from '@/routes/ProtectedRoute';

export default function LoginPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const googleError = params.get('googleError');
    if (!googleError) return;
    toast.error(
      googleError === 'redirect_uri_mismatch'
        ? 'Google redirect URI mismatch. Add http://localhost:5000/api/v1/auth/google/callback in Google Console.'
        : `Google Sign-In failed: ${googleError}`
    );
  }, [params]);

  return (
    <PublicRoute>
      <div className="relative flex min-h-screen flex-col bg-cloud overflow-hidden">
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
                <CardTitle className="text-[24px] leading-none sm:text-[28px]">Sign in</CardTitle>
                <CardDescription className="mt-2">
                  Access your projects, boards, and team workspace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <LoginForm />
              <GoogleAuthButton label="Sign in with Google" />
              <p className="text-center text-sm text-graphite">
                No account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create one
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