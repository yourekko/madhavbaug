import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const POST_AUTH_PATH_KEY = 'madhav_post_auth_path';

/** Remember where the user was headed before Google phone / doctor profile completion. */
export function stashPostAuthPath(path: string) {
  try {
    if (path.startsWith('/forum')) sessionStorage.setItem(POST_AUTH_PATH_KEY, path);
  } catch {
    /* ignore */
  }
}

export function takePostAuthPath(fallback = '/forum'): string {
  try {
    const stored = sessionStorage.getItem(POST_AUTH_PATH_KEY);
    sessionStorage.removeItem(POST_AUTH_PATH_KEY);
    if (stored?.startsWith('/forum')) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Sends Google OAuth users to finish required profile or phone steps before using the forum. */
export function ProfileCompletionRedirect() {
  const { user, isAuthenticated } = useSession();
  const { pathname, search } = useLocation();

  if (!isAuthenticated || !user) return null;

  if (user.needsPatientPhone && !pathname.startsWith('/forum/complete-phone')) {
    stashPostAuthPath(`${pathname}${search}`);
    return <Navigate to="/forum/complete-phone" replace />;
  }

  if (user.role === 'doctor' && user.needsDoctorProfile && !pathname.startsWith('/forum/doctor/complete-profile')) {
    stashPostAuthPath(`${pathname}${search}`);
    return <Navigate to="/forum/doctor/complete-profile" replace />;
  }

  return null;
}
