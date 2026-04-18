import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaPhone } from 'react-icons/fa6';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, type AuthPayload } from '../lib/api';
import './DoctorAuth.css';

export default function CompletePatientPhonePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, token, isAuthenticated, replaceSession } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = phone.replace(/\s+/g, ' ').trim();
    if (!normalized || !token) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest<AuthPayload>(
        '/auth/patient/phone',
        { method: 'PATCH', body: JSON.stringify({ name: name.trim(), phone: normalized }) },
        token,
      );
      replaceSession(payload);
      toast.success('Phone number saved. Welcome!');
      navigate('/forum', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save phone number.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/forum" replace />;
  }
  if (user.role !== 'patient' || !user.needsPatientPhone) {
    return <Navigate to="/forum" replace />;
  }

  return (
    <main className="doctor-auth-page">
      <Seo
        title="Add your phone number"
        description="Complete your Madhavbaug account with a mobile number after signing in with Google."
        canonicalPath="/forum/complete-phone"
      />
      <section className="doctor-auth-card doctor-auth-card-narrow">
        <header className="doctor-auth-header">
          <span className="doctor-auth-header-icon" aria-hidden>
            <FaPhone />
          </span>
          <h1>Add your phone number</h1>
          <p>
            You signed in with Google. Please confirm your profile details so doctors can reach you when needed.
          </p>
        </header>

        <form className="doctor-auth-form doctor-auth-form--login" onSubmit={onSubmit} noValidate>
          <label className="doctor-auth-field">
            <span className="doctor-auth-label">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </label>
          <label className="doctor-auth-field">
            <span className="doctor-auth-label">Mobile number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              required
            />
          </label>
          <div className="doctor-auth-login-submit">
            <button type="submit" className="doctor-auth-btn doctor-auth-btn--login" disabled={loading}>
              {loading ? 'Saving…' : 'Save and continue'}
            </button>
            {error ? (
              <p className="doctor-auth-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <footer className="doctor-auth-login-footer">
            <Link to="/forum" className="doctor-auth-login-back">
              ← Back to forum
            </Link>
          </footer>
        </form>
      </section>
    </main>
  );
}
