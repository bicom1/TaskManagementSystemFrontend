import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { LoginForm } from '@/features/auth/components/LoginForm';
import {
  GoogleAuthButton,
  readInviteToken,
} from '@/features/auth/components/GoogleAuthButton';
import { getGoogleErrorToast, isInviteGateError } from '@/features/auth/googleErrors';
import { PublicRoute } from '@/routes/ProtectedRoute';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params, setSearchParams] = useSearchParams();
  const [showInviteHint, setShowInviteHint] = useState(false);

  // If Google OAuth bounced an invitee to /login, send them back to accept-invite
  useEffect(() => {
    const token = readInviteToken();
    const googleError = params.get('googleError');
    if (!token || !googleError) return;
    const qs = new URLSearchParams();
    qs.set('token', token);
    qs.set('googleError', googleError);
    navigate(`/accept-invite?${qs.toString()}`, { replace: true });
  }, [navigate, params]);

  useEffect(() => {
    const googleError = params.get('googleError');
    if (!googleError) return;
    if (readInviteToken()) return; // redirect effect handles invitees

    const inviteBlocked = isInviteGateError(googleError);
    setShowInviteHint(inviteBlocked);

    const { title, description } = getGoogleErrorToast(googleError);
    if (inviteBlocked && description) {
      toast.error(title, { description, duration: 12000 });
    } else if (description) {
      toast.error(title, { description, duration: 12000 });
    } else {
      toast.error(title, { duration: 6000 });
    }

    const next = new URLSearchParams(params);
    next.delete('googleError');
    setSearchParams(next, { replace: true });
  }, [params, setSearchParams]);

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
                <h1 className="voice-line mt-5 text-[24px] text-text-primary">Welcome back</h1>
                <p className="mt-1.5 max-w-[280px] text-[13px] text-text-muted">
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

                <p className="text-center text-[12px] leading-relaxed text-text-muted">
                  Invited? Open your invite link, then continue with Google using the invited email.
                </p>

                {showInviteHint && (
                  <>
                    <p className="text-center text-[12px] leading-relaxed text-text-muted">
                      Google sign-in is available after your Super Admin invites you to this
                      workspace.
                    </p>
                    <p className="pt-1 text-center text-[13px] text-text-muted">
                      Need access?{' '}
                      <span className="text-text-secondary">
                        Ask your Super Admin to send you a workspace invitation.
                      </span>
                    </p>
                  </>
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
