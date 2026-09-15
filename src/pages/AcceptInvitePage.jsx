import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { userApi } from '@/features/users/api/userApi';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  GoogleAuthButton,
  storeInviteToken,
  readInviteToken,
  clearInviteToken,
} from '@/features/auth/components/GoogleAuthButton';
import { getGoogleErrorToast } from '@/features/auth/googleErrors';
import { getRoleLabel } from '@/lib/roles';
import { LoadingScreen } from '@/components/ui/Spinner';

function isCompanyWebmailEmail(email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  return normalized.endsWith('@bicommunications.net') || normalized.includes('@bicommunications.net');
}

function readTokenFromSearch(params) {
  return String(params.get('token') || params.get('inviteToken') || '').trim();
}

const passwordAcceptSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Invite accept page (live + local).
 * @bicommunications.net → Complete registration (password) — NEVER Google
 * Other emails → Continue with Google
 */
export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [params, setSearchParams] = useSearchParams();

  const token = useMemo(() => {
    const fromUrl = readTokenFromSearch(params);
    if (fromUrl) return fromUrl;
    return String(readInviteToken() || '').trim();
  }, [params]);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const invitedEmail = String(preview?.email || '')
    .trim()
    .toLowerCase();
  const invitedRole = preview?.role || '';

  // HARD RULE for live + local: company webmail = password registration page
  const isPasswordInvite = Boolean(
    preview &&
      (preview.inviteMode === 'password' ||
        preview.authProvider === 'local' ||
        isCompanyWebmailEmail(invitedEmail))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordAcceptSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const fromUrl = readTokenFromSearch(params);
    if (fromUrl) {
      storeInviteToken(fromUrl);
      return;
    }
    const stored = String(readInviteToken() || '').trim();
    if (stored) {
      setSearchParams({ token: stored }, { replace: true });
    }
  }, [params, setSearchParams]);

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
      setError(
        'Open the full invite link from your email or the shared invite (it must include ?token=).'
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    storeInviteToken(token);

    userApi
      .previewInvite(token)
      .then((data) => {
        if (cancelled) return;
        // Normalize so .net always triggers password UI even if API is old
        const email = String(data?.email || '')
          .trim()
          .toLowerCase();
        const passwordFlow =
          data?.inviteMode === 'password' ||
          data?.authProvider === 'local' ||
          isCompanyWebmailEmail(email);
        setPreview({
          ...data,
          email,
          inviteMode: passwordFlow ? 'password' : data?.inviteMode || 'google',
          authProvider: passwordFlow ? 'local' : data?.authProvider,
        });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Invite link is invalid or expired');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onAcceptPassword = async (values) => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      await userApi.acceptInvite({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      clearInviteToken();
      toast.success('Account ready — sign in with your email and password');
      navigate(`/login?email=${encodeURIComponent(invitedEmail)}`, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

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
      data-invite-flow={isPasswordInvite ? 'password' : 'google'}
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
                {error
                  ? 'Invite unavailable'
                  : isPasswordInvite
                    ? 'Complete registration'
                    : 'Accept invite'}
              </h1>
              {!error && (
                <p className="mt-1.5 max-w-[300px] text-[13px] text-text-muted">
                  Welcome{preview?.name ? `, ${preview.name}` : ''}. Your invite
                  {invitedRole ? ` as ${getRoleLabel(invitedRole)}` : ''}
                  {preview?.department?.name ? ` in ${preview.department.name}` : ''} is ready
                  {isPasswordInvite
                    ? ' — set a password to join.'
                    : ' — continue with Google to join.'}
                </p>
              )}
            </div>

            <div className="mx-7 h-px bg-border-subtle" />

            <div className="space-y-4 px-7 py-6">
              {error ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-bloom-coral">{error}</p>
                  <p className="text-[13px] text-text-muted">
                    Ask your Superadmin for a new invite, then open the full link from your email or
                    the shared invite (must include <span className="font-medium">?token=</span>).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Go to sign in
                  </Button>
                </div>
              ) : isPasswordInvite ? (
                <form onSubmit={handleSubmit(onAcceptPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={invitedEmail}
                      readOnly
                      disabled
                      className="bg-surface-1 text-text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Input
                      id="invite-role"
                      value={getRoleLabel(invitedRole) || invitedRole || '—'}
                      readOnly
                      disabled
                      className="bg-surface-1 text-text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-password">Password</Label>
                    <PasswordInput
                      id="invite-password"
                      autoComplete="new-password"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-bloom-coral">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-confirm">Confirm password</Label>
                    <PasswordInput
                      id="invite-confirm"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-bloom-coral">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account & continue'}
                  </Button>

                  <p className="text-center text-[12px] leading-relaxed text-text-muted">
                    After this you will sign in with{' '}
                    <span className="font-medium text-text-secondary">{invitedEmail}</span> and your
                    new password. Email and role cannot be changed.
                  </p>
                </form>
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
                    {preview?.expiresAt ? (
                      <>
                        {' '}
                        This invite link expires in {preview.expiresInMinutes ?? 10} minutes from
                        when it was created.
                      </>
                    ) : null}
                  </p>
                </>
              )}

              <p className="pt-1 text-center text-[12px] text-text-muted">
                Already joined?{' '}
                <Link
                  to={invitedEmail ? `/login?email=${encodeURIComponent(invitedEmail)}` : '/login'}
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
