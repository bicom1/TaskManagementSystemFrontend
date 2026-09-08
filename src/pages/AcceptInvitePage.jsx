import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { userApi } from '@/features/users/api/userApi';
import { BrandLogo } from '@/components/BrandLogo';
import {
  GoogleAuthButton,
  storeInviteToken,
  clearInviteToken,
} from '@/features/auth/components/GoogleAuthButton';
import { getGoogleErrorToast } from '@/features/auth/googleErrors';
import { getRoleLabel } from '@/lib/roles';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function AcceptInvitePage() {
  const [params, setSearchParams] = useSearchParams();
  const token = params.get('token') || '';
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) storeInviteToken(token);
  }, [token]);

  useEffect(() => {
    const googleError = params.get('googleError');
    if (!googleError) return;

    const { title, description } = getGoogleErrorToast(googleError);
    if (description) {
      toast.error(title, { description, duration: 12000 });
    } else {
      toast.error(title, { duration: 8000 });
    }

    const next = new URLSearchParams(params);
    next.delete('googleError');
    setSearchParams(next, { replace: true });
  }, [params, setSearchParams]);

  useEffect(() => {
    if (!token) {
      setError('Missing invite token. Open the invite link from your email or Superadmin.');
      setLoading(false);
      return;
    }
    userApi
      .previewInvite(token)
      .then((data) => {
        setPreview(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Invite link is invalid or expired');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const invitedEmail = preview?.email || '';

  if (loading) {
    return (
      <div
        className="relative flex h-full min-h-0 items-center justify-center overflow-y-auto"
        style={{ backgroundColor: 'var(--color-rail-bg)' }}
      >
        <LoadingScreen />
      </div>
    );
  }

  return (
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
                {error ? 'Invite unavailable' : 'Accept invite'}
              </h1>
              {!error && (
                <p className="mt-1.5 max-w-[300px] text-[13px] text-text-muted">
                  Welcome{preview?.name ? `, ${preview.name}` : ''}. Your invite
                  {preview?.role ? ` as ${getRoleLabel(preview.role)}` : ''}
                  {preview?.department?.name ? ` in ${preview.department.name}` : ''} is ready —
                  continue with Google to join.
                </p>
              )}
            </div>

            <div className="mx-7 h-px bg-border-subtle" />

            <div className="space-y-4 px-7 py-6">
              {error ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-bloom-coral">{error}</p>
                  <p className="text-[13px] text-text-muted">
                    Ask your Superadmin for a new invite link. Then open that link and continue
                    with Google — do not use the password form on the login page.
                  </p>
                  {token ? (
                    <GoogleAuthButton
                      label="Try Continue with Google"
                      inviteToken={token}
                      loginHint={invitedEmail}
                    />
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
                      Invited email — use this Google account
                    </p>
                    <p className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2.5 text-center text-[13px] font-semibold text-text-primary">
                      {invitedEmail || '—'}
                    </p>
                  </div>

                  <GoogleAuthButton
                    label="Continue with Google to join"
                    loginHint={invitedEmail}
                    inviteToken={token}
                  />

                  <p className="text-center text-[12px] leading-relaxed text-text-muted">
                    Invited members must sign in with Google using{' '}
                    <span className="font-medium text-text-secondary">{invitedEmail}</span>.
                    You will not be sent to a password login.
                  </p>
                </>
              )}

              <p className="pt-1 text-center text-[12px] text-text-muted">
                Already joined?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                  onClick={() => clearInviteToken()}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 py-5 text-center text-[11px] text-white">
        © {new Date().getFullYear()} BIWORKSPACE
      </div>
    </div>
  );
}
