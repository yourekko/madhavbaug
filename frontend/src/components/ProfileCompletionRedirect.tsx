import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

/** Sends Google OAuth users to finish required profile or phone steps before using the forum. */
export function ProfileCompletionRedirect() {
  const { user, isAuthenticated } = useSession();
  const { pathname } = useLocation();

  if (!isAuthenticated || !user) return null;

  if (user.needsPatientPhone && !pathname.startsWith('/forum/complete-phone')) {
    return <Navigate to="/forum/complete-phone" replace />;
  }

  if (user.role === 'doctor' && user.needsDoctorProfile && !pathname.startsWith('/forum/doctor/complete-profile')) {
    return <Navigate to="/forum/doctor/complete-profile" replace />;
  }

  return null;
}
