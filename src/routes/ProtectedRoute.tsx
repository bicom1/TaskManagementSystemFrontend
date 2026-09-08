import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../features/auth/api/authApi';
import { userApi } from '../features/users/api/userApi';
import { hasPermission } from '../lib/permissions';
import { clearTabSession, hasTabSession } from '../lib/tabSession';

async function hydrateSession(
  setAuth: (user: unknown, accessToken: string) => void
) {
  const { user: refreshedUser, accessToken } = await authApi.refresh();
  try {
    const full = await userApi.me();
    setAuth({ ...refreshedUser, ...full }, accessToken);
  } catch {
    setAuth(refreshedUser, accessToken);
  }
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
}: {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}) {
  const { isAuthenticated, user, setAuth, accessToken, clearAuth } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    if (isAuthenticated) return false;
    return hasTabSession();
  });

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      if (user && !(user as { permissions?: unknown }).permissions && accessToken) {
        userApi
          .me()
          .then((full) => {
            if (!cancelled) setAuth({ ...user, ...full }, accessToken);
          })
          .catch(() => {});
      }
      setIsBootstrapping(false);
      return undefined;
    }

    if (!hasTabSession()) {
      setIsBootstrapping(false);
      return undefined;
    }

    hydrateSession(setAuth)
      .catch(() => {
        clearTabSession();
        clearAuth();
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setAuth, clearAuth, user, accessToken]);

  if (isBootstrapping) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && user && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}
