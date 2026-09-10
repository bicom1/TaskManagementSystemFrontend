import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../features/auth/api/authApi';
import { userApi } from '../features/users/api/userApi';
import { hasPermission } from '../lib/permissions';
import { clearTabSession, hasTabSession } from '../lib/tabSession';
import { sanitizeNextPath, withNextParam } from '../lib/postLoginRedirect';

async function hydrateSession(setAuth) {
  const { user: refreshedUser, accessToken } = await authApi.refresh();
  try {
    const full = await userApi.me();
    setAuth({ ...refreshedUser, ...full }, accessToken);
  } catch {
    setAuth(refreshedUser, accessToken);
  }
}

/**
 * Auth gate — tab-session approach:
 * - Cold open / new tab / after leaving: no sessionStorage flag → instant /login (no splash, no refresh call)
 * - Same-tab reload (F5) while logged in: flag present → silent refresh once (no full-page spinner)
 * Memory auth store is never persisted across tab close.
 */
export function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, user, setAuth, accessToken, clearAuth } = useAuthStore();
  const location = useLocation();
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    if (isAuthenticated) return false;
    return hasTabSession();
  });

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      if (user && !user.permissions && accessToken) {
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

    // No tab session → require login immediately (zero network wait)
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

  // Never show a full-page loading gate — blank frame only during rare same-tab F5 restore
  if (isBootstrapping) return null;

  if (!isAuthenticated) {
    const next = sanitizeNextPath(`${location.pathname}${location.search || ''}`);
    return <Navigate to={withNextParam('/login', next)} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && user && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (isAuthenticated) {
    const params = new URLSearchParams(location.search || '');
    const next = sanitizeNextPath(params.get('next') || params.get('returnTo'));
    return <Navigate to={next || '/'} replace />;
  }
  return children;
}
