import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/features/users/api/userApi';
import { decodeOAuthProfile } from '@/features/auth/googleProfile';
import { clearInviteToken, readInviteToken } from '@/features/auth/components/GoogleAuthButton';
import { LoadingScreen } from '@/components/ui/Spinner';
import { readNextFromSearchParams } from '@/lib/postLoginRedirect';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState('Signing you in with Google…');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const accessToken = params.get('accessToken');
      const profile = decodeOAuthProfile(params.get('profile'));
      const inviteToken = readInviteToken();
      const next = readNextFromSearchParams(params);

      if (!accessToken) {
        toast.error('Google Sign-In failed — missing token');
        if (inviteToken) {
          navigate(
            `/accept-invite?token=${encodeURIComponent(inviteToken)}&googleError=missing_token`,
            { replace: true }
          );
        } else {
          navigate(
            next
              ? `/login?googleError=missing_token&next=${encodeURIComponent(next)}`
              : '/login?googleError=missing_token',
            { replace: true }
          );
        }
        return;
      }

      const baseUser = profile || { name: 'User' };
      setAuth(baseUser, accessToken);
      clearInviteToken();

      try {
        const full = await userApi.me({ skipAuthRefresh: true });
        if (cancelled) return;
        setAuth({ ...baseUser, ...full }, accessToken);
      } catch {
        // Profile from OAuth redirect is enough to enter the app; permissions load later.
      }

      if (cancelled) return;
      toast.success(`Welcome${baseUser.name ? `, ${baseUser.name}` : ''}`);
      navigate(next || '/', { replace: true });
    }

    finish().catch(() => {
      if (cancelled) return;
      setStatus('Could not complete Google Sign-In');
      toast.error('Google Sign-In failed. Please try again.');
      const inviteToken = readInviteToken();
      const next = readNextFromSearchParams(params);
      if (inviteToken) {
        navigate(
          `/accept-invite?token=${encodeURIComponent(inviteToken)}&googleError=session`,
          { replace: true }
        );
      } else {
        navigate(
          next
            ? `/login?googleError=session&next=${encodeURIComponent(next)}`
            : '/login?googleError=session',
          { replace: true }
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params, navigate, setAuth]);

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-cloud px-4">
      <div className="text-center">
        <LoadingScreen />
        <p className="mt-4 text-sm text-graphite">{status}</p>
      </div>
    </div>
  );
}
