import { GoogleLogin } from '@react-oauth/google';
import { useEffect, useId, useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import { FiX } from 'react-icons/fi';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import './AuthModal.css';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

type AuthTab = 'signin' | 'signup';

export type AuthModalVariant = 'ask' | 'general' | 'admin';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  defaultTab?: AuthTab;
  variant?: AuthModalVariant;
};

export function AuthModal({
  open,
  onClose,
  onAuthenticated,
  defaultTab = 'signup',
  variant = 'general',
}: AuthModalProps) {
  const titleId = useId();
  const { login, signup, loginWithGoogle } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<AuthTab>(defaultTab);

  useEffect(() => {
    if (!open) return;
    setTab(variant === 'admin' ? 'signin' : defaultTab);
  }, [open, defaultTab, variant]);

  const [signInPhone, setSignInPhone] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const copy = useMemo(() => {
    if (variant === 'ask') {
      return {
        title: 'Continue to ask your question',
        lead: 'Sign in to an existing account or create one to submit your health question.',
        signInSubmit: 'Sign in & continue',
        signUpSubmit: 'Create account & continue',
      };
    }
    if (variant === 'admin') {
      return {
        title: 'Admin sign in',
        lead: 'Use your platform admin email and password (not your phone number).',
        signInSubmit: 'Sign in to admin',
        signUpSubmit: 'Create account',
      };
    }
    return {
      title: 'Sign in or create an account',
      lead: 'Use your phone or Google to access Madhavbaug consultations and your health forum profile.',
      signInSubmit: 'Sign in',
      signUpSubmit: 'Create account',
    };
  }, [variant]);

  if (!open) return null;

  function handleBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function finishAuth() {
    onAuthenticated();
    onClose();
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (variant === 'admin') {
      if (!signInEmail.trim() || !signInPassword) return;
    } else if (!signInPhone.trim() || !signInPassword) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (variant === 'admin') {
        await login({ email: signInEmail.trim(), password: signInPassword });
      } else {
        await login({ phone: signInPhone.trim(), password: signInPassword });
      }
      toast.success('Signed in successfully. Welcome back!');
      finishAuth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await signup({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: signInPassword || 'Password@123',
        signupLocation: location.trim(),
      });
      toast.success('Account created. You’re all set!');
      finishAuth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign up.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
      <div
        className={`auth-modal${variant === 'admin' ? ' auth-modal--admin' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <h2 id={titleId} className="auth-modal-title">
            {copy.title}
          </h2>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
            <FiX aria-hidden />
          </button>
        </div>
        <p className="auth-modal-lead">{copy.lead}</p>

        {variant !== 'admin' ? (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              className={`auth-tab ${tab === 'signin' ? 'is-active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`auth-tab ${tab === 'signup' ? 'is-active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign up
            </button>
          </div>
        ) : null}

        {variant !== 'admin' && googleClientId ? (
          <>
            <div className="auth-google-wrap">
              <GoogleLogin
                locale="en"
                size="large"
                width={368}
                text="continue_with"
                onSuccess={async (cred) => {
                  const idToken = cred.credential;
                  if (!idToken) return;
                  setLoading(true);
                  setError(null);
                  try {
                    await loginWithGoogle(idToken, 'patient');
                    toast.success('Signed in with Google.');
                    finishAuth();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
                    toast.error(msg);
                    setError(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  toast.error('Google sign-in was interrupted.');
                }}
              />
            </div>
            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        ) : null}
        {error && <p className="hero-q-error">{error}</p>}

        {tab === 'signin' ? (
          <form className="auth-form" onSubmit={handleSignIn} noValidate>
            {variant === 'admin' ? (
              <label className="auth-label">
                <span className="auth-label-text">
                  Admin email <span className="auth-req">*</span>
                </span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@yourdomain.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
            ) : (
              <label className="auth-label">
                <span className="auth-label-text">
                  Phone number <span className="auth-req">*</span>
                </span>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="10-digit mobile number"
                  value={signInPhone}
                  onChange={(e) => setSignInPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </label>
            )}
            <label className="auth-label">
              <span className="auth-label-text">
                Password <span className="auth-req">*</span>
              </span>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="auth-submit">
              {loading ? 'Please wait...' : copy.signInSubmit}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUp} noValidate>
            <label className="auth-label">
              <span className="auth-label-text">
                Full name <span className="auth-req">*</span>
              </span>
              <input
                type="text"
                className="auth-input"
                placeholder="As per your ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="auth-label">
              <span className="auth-label-text">
                Phone number <span className="auth-req">*</span>
              </span>
              <input
                type="tel"
                className="auth-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </label>
            <label className="auth-label">
              <span className="auth-label-text">
                Email <span className="auth-optional">(optional)</span>
              </span>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="auth-label">
              <span className="auth-label-text">
                Password <span className="auth-req">*</span>
              </span>
              <input
                type="password"
                className="auth-input"
                placeholder="Minimum 8 characters"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="auth-label">
              <span className="auth-label-text">
                Location <span className="auth-req">*</span>
              </span>
              <input
                type="text"
                className="auth-input"
                placeholder="City, state"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="address-level2"
                required
              />
            </label>
            <button type="submit" className="auth-submit">
              {loading ? 'Please wait...' : copy.signUpSubmit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
