import { GoogleLogin } from '@react-oauth/google';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaStethoscope } from 'react-icons/fa6';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import './DoctorAuth.css';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

function safeInternalPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('://')) return fallback;
  return raw;
}

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle } = useSession();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const afterLogin = safeInternalPath(searchParams.get('next'), '/forum/doctor/panel');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back. Redirecting to your panel…');
      navigate(afterLogin, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to login';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="doctor-auth-page">
      <Seo
        title="Doctor Login"
        description="Login for doctors with email and password."
        canonicalPath="/forum/doctor-login"
        noindex
      />
      <section className="doctor-auth-card doctor-auth-card-narrow">
        <header className="doctor-auth-header">
          <span className="doctor-auth-header-icon" aria-hidden>
            <FaStethoscope />
          </span>
          <h1>Doctor sign in</h1>
          <p>Use the email and password from your verified doctor profile.</p>
        </header>

        {googleClientId ? (
          <div className="doctor-auth-google-block">
            <div className="doctor-auth-google-inner">
              <GoogleLogin
                locale="en"
                size="large"
                width={320}
                text="continue_with"
                onSuccess={async (cred) => {
                  const idToken = cred.credential;
                  if (!idToken) return;
                  setLoading(true);
                  setError(null);
                  try {
                    await loginWithGoogle(idToken, 'doctor');
                    toast.success('Signed in with Google.');
                    navigate(afterLogin, { replace: true });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
                    toast.error(msg);
                    setError(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => toast.error('Google sign-in was interrupted.')}
              />
            </div>
            <p className="doctor-auth-google-hint">New doctors: after Google you’ll complete your professional profile.</p>
            <div className="doctor-auth-or">
              <span>or</span>
            </div>
          </div>
        ) : null}

        <form className="doctor-auth-form doctor-auth-form--login" onSubmit={onSubmit} noValidate>
          <div className="doctor-auth-fields-stack">
            <label className="doctor-auth-field">
              <span className="doctor-auth-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="doctor-auth-field">
              <span className="doctor-auth-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          <div className="doctor-auth-login-submit">
            <button type="submit" className="doctor-auth-btn doctor-auth-btn--login" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            {error ? (
              <p className="doctor-auth-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="doctor-auth-login-footer">
            <p className="doctor-auth-login-footer-line">
              New doctor?{' '}
              <Link to="/forum/doctor-signup" className="doctor-auth-login-footer-link">
                Create an account
              </Link>
            </p>
            <Link to="/forum" className="doctor-auth-login-back">
              ← Back to main site
            </Link>
          </footer>
        </form>
      </section>
    </main>
  );
}
