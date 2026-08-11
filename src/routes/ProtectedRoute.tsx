import { useEffect, useState, type PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../features/auth/api/authApi';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: Array<'admin' | 'manager' | 'member'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setIsBootstrapping(false);
      return;
    }

    // On a hard refresh, the Zustand store is empty but the httpOnly
    // refresh cookie may still be valid — try to silently rehydrate.
    authApi
      .refresh()
      .then(({ user: refreshedUser, accessToken }) => setAuth(refreshedUser, accessToken))
      .catch(() => {
        /* not logged in — fall through to redirect */
      })
      .finally(() => setIsBootstrapping(false));
  }, [isAuthenticated, setAuth]);

  if (isBootstrapping) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
