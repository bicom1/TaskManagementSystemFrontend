import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { PublicRoute } from '@/routes/ProtectedRoute';

/**
 * LoginPage — BIWORKSPACE
 *
 * Premium auth page with:
 * - Deep dark gradient background
 * - Floating animated orbs
 * - Glassmorphism login card
 */
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
      <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: '#07070d' }}>

        {/* ── Background orbs / gradient ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top-left orb */}
          <div
            className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
          />
          {/* Bottom-right orb */}
          <div
            className="absolute -bottom-48 -right-32 h-[600px] w-[600px] rounded-full opacity-15 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
          />
          {/* Center subtle glow */}
          <div
            className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-8 blur-[80px]"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* ── Top banner ── */}
        <div className="relative z-10 flex h-10 items-center border-b border-white/5 bg-white/3 px-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
            <span className="text-[12px] font-bold tracking-widest text-white/60 uppercase">BIWORKSPACE</span>
            <span className="hidden text-[12px] text-white/30 sm:inline">
              Plan · Track · Ship
            </span>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-[400px] animate-slide-up">

            {/* Card */}
            <div
              className={[
                'overflow-hidden rounded-2xl',
                'border border-white/10',
                'bg-white/[0.04] backdrop-blur-xl',
                'shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]',
              ].join(' ')}
            >
              {/* Card header */}
              <div className="px-7 pt-7 pb-5">
                <BrandLogo asLink={false} size="md" dark />
                <div className="mt-5">
                  <h1 className="text-[22px] font-bold tracking-tight text-white">
                    Welcome back
                  </h1>
                  <p className="mt-1 text-[13px] text-white/45">
                    Sign in to access your projects, tasks, and team workspace.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/6 mx-7" />

              {/* Form body */}
              <div className="px-7 py-6 space-y-4">
                <LoginForm dark />
                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[11px] font-medium text-white/25">or</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
                <GoogleAuthButton label="Continue with Google" />
                <p className="pt-1 text-center text-[13px] text-white/35">
                  No account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            {/* Below card links */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                to="/forgot-password"
                className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
              >
                Forgot password?
              </Link>
              <span className="text-white/15">·</span>
              <Link
                to="/register"
                className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 border-t border-white/5 px-4 py-4 text-center text-[11px] text-white/20">
          © {new Date().getFullYear()} BIWORKSPACE. All rights reserved.
        </div>
      </div>
    </PublicRoute>
  );
}