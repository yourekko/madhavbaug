import { GoogleOAuthProvider } from '@react-oauth/google';
import { Outlet } from 'react-router-dom';
import { AuthModalProvider } from '../context/AuthModalContext';
import { SessionProvider } from '../context/SessionContext';
import { ToastProvider } from '../context/ToastContext';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import { ProfileCompletionRedirect } from './ProfileCompletionRedirect';
import { SiteJsonLd } from './SiteJsonLd';
import SiteTrustBar from './SiteTrustBar';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

function SiteShell() {
  return (
    <SessionProvider>
      <ToastProvider>
        <AuthModalProvider>
          <div className="page">
            <SiteJsonLd />
            <SiteHeader />
            <ProfileCompletionRedirect />
            <SiteTrustBar />
            <Outlet />
            <SiteFooter />
          </div>
        </AuthModalProvider>
      </ToastProvider>
    </SessionProvider>
  );
}

export default function SiteLayout() {
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <SiteShell />
      </GoogleOAuthProvider>
    );
  }
  return <SiteShell />;
}
