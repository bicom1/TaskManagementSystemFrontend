import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userApi } from '@/features/users/api/userApi';
import { BrandLogo } from '@/components/BrandLogo';
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton';
import { getRoleLabel } from '@/lib/roles';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invite token');
      setLoading(false);
      return;
    }
    userApi
      .previewInvite(token)
      .then((data) => {
        setPreview(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Invite link is invalid or expired');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-canvas">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto bg-canvas px-4 py-10">
      <div className="mb-8">
        <BrandLogo size="lg" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-paper p-6 shadow-[var(--shadow-soft-lift)]">
        <h1 className="text-xl font-semibold text-ink">Join with Google</h1>
        {error ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-bloom-coral">{error}</p>
            <Link to="/login" className="text-sm font-medium text-primary">
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-graphite">
              Welcome{preview?.name ? `, ${preview.name}` : ''}. Your invite
              {preview?.role ? ` as ${getRoleLabel(preview.role)}` : ''}
              {preview?.department?.name ? ` in ${preview.department.name}` : ''} is ready.
              Sign in with Google using the same email you were invited with.
            </p>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-graphite">
                Invited email
              </p>
              <p className="rounded-md border border-hairline bg-cloud px-3 py-2 text-sm font-medium text-ink">
                {preview?.email || '—'}
              </p>
            </div>

            <div className="mt-6">
              <GoogleAuthButton label="Continue with Google" />
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-graphite">
              Use Google account <span className="font-medium text-ink">{preview?.email}</span>.
              Password sign-in is not available for invited members.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
