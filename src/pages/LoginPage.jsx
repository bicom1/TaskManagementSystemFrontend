import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { PublicRoute } from '@/routes/ProtectedRoute';

/**
 * LoginPage — BIWORKSPACE
 * A single quiet card on a dark ambient ground. One violet glow, nothing else.
 */
export default function LoginPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const googleError = params.get('googleError');
    if (!googleError) return;
    toast.error(
      googleError === 'redirect_uri_mismatch'
        ? 'Google redirect URI mismatch. Add http://localhost:5000/api/v1/auth/google/callback in Google Console.'
        : `Google sign-in failed: ${googleError}`
    );
  }, [params]);

  return (
    <PublicRoute>
      <div
        className="relative flex min-h-screen flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-rail-bg)' }}
      >
        {/* Ambient glow — one source, held low */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.18] blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--color-brand-500), transparent 70%)' }}
        />

        {/* Top banner */}
        <div className="relative z-10 flex h-11 items-center border-b border-white/5 px-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              BIWORKSPACE
            </span>
            <span className="hidden text-[12px] text-white/25 sm:inline">Plan · Track · Ship</span>
          </div>
        </div>

        {/* Main */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-[392px] animate-slide-up">
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-[var(--shadow-2xl)]">
              <div className="px-7 pb-5 pt-7">
                <BrandLogo asLink={false} size="md" />
                <h1 className="voice-line mt-5 text-[24px] text-text-primary">Welcome back</h1>
                <p className="mt-1.5 text-[13px] text-text-muted">
                  Sign in to your projects, tasks, and team workspace.
                </p>
              </div>

              <div className="mx-7 h-px bg-border-subtle" />

              <div className="space-y-4 px-7 py-6">
                <LoginForm />

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-disabled">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>

                <GoogleAuthButton label="Continue with Google" />

                <p className="pt-1 text-center text-[13px] text-text-muted">
                  No account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-4 py-5 text-center text-[11px] text-white/20">
          © {new Date().getFullYear()} BIWORKSPACE
        </div>
      </div>
    </PublicRoute>
  );
}
