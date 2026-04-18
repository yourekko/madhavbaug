import { GoogleLogin } from '@react-oauth/google';
import { useState, type ChangeEvent, type FormEvent, type FormEvent as ReactFormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, apiUploadPublicImage } from '../lib/api';
import { QUESTION_CATEGORY_OPTIONS } from '../constants/questionCategories';
import './DoctorAuth.css';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

type SignupForm = {
  name: string;
  degree: string;
  qualification: string;
  experience: string;
  branchName: string;
  profileLink: string;
  whatsappNumber: string;
  photo: File | null;
  bio: string;
  email: string;
  password: string;
};

/** Short bio: limit by characters so the counter matches what users type (word count stays “1” for one long unbroken string). */
const MAX_BIO_CHARS = 400;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif'];

async function resizeForDoctorProfile(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not read selected image.'));
    img.src = objectUrl;
  });

  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Could not process image.');
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);
  URL.revokeObjectURL(objectUrl);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Could not compress image.');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'doctor-photo'}.jpg`, { type: 'image/jpeg' });
}

function limitLength(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars);
}

export default function DoctorSignupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { loginWithGoogle } = useSession();
  const [form, setForm] = useState<SignupForm>({
    name: '',
    degree: '',
    qualification: '',
    experience: '',
    branchName: '',
    profileLink: '',
    whatsappNumber: '',
    photo: null,
    bio: '',
    email: '',
    password: '',
  });
  const [expertiseTags, setExpertiseTags] = useState<string[]>([...QUESTION_CATEGORY_OPTIONS]);

  const bioCharCount = form.bio.length;
  const bioRemaining = MAX_BIO_CHARS - bioCharCount;
  const bioAtLimit = bioCharCount >= MAX_BIO_CHARS;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  function onFieldChange<K extends keyof Omit<SignupForm, 'photo'>>(key: K, value: SignupForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, photo: file }));
  }

  function onBioChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const safeValue = limitLength(event.target.value, MAX_BIO_CHARS);
    setForm((prev) => ({ ...prev, bio: safeValue }));
  }

  function onBioInput(event: ReactFormEvent<HTMLTextAreaElement>) {
    const safeValue = limitLength(event.currentTarget.value, MAX_BIO_CHARS);
    setForm((prev) => ({ ...prev, bio: safeValue }));
  }

  function toggleExpertise(tag: string) {
    setExpertiseTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.photo || expertiseTags.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(form.photo.type)) {
        throw new Error('Only JPEG, PNG, GIF, or WebP images are allowed.');
      }

      const resizedPhoto = await resizeForDoctorProfile(form.photo);
      if (resizedPhoto.size > MAX_UPLOAD_BYTES) {
        throw new Error('Photo must be smaller than 5 MB after compression.');
      }
      const { url: photoUrl } = await apiUploadPublicImage('/auth/doctor/upload-photo', resizedPhoto);

      await apiRequest('/auth/doctor/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          degree: form.degree,
          qualification: form.qualification,
          clinicalExperienceYears: Number(form.experience || 0),
          photoUrl,
          bio: form.bio,
          branchName: form.branchName,
          profileLink: form.profileLink,
          whatsappNumber: form.whatsappNumber,
          email: form.email,
          password: form.password,
          expertiseTags,
        }),
      });
      toast.success('Doctor profile created. Sign in with your email to continue.');
      navigate('/forum/doctor-login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to create doctor account.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="doctor-auth-page">
      <Seo
        title="Doctor Sign Up"
        description="Create a doctor account with credentials, profile details, and clinical experience."
        canonicalPath="/doctor-signup"
      />
      <section className="doctor-auth-card doctor-auth-card-wide">
        <header className="doctor-auth-header doctor-signup-header">
          <h1>Doctor Sign Up</h1>
          <p className="doctor-signup-header-intro">
            Create your profile and start building visibility through the Madhavbaug Forum.
          </p>
          <div className="doctor-signup-benefits">
            <h2>Why every doctor should participate</h2>
            <ul>
              <li>Be discovered by patients searching on Google and AI platforms.</li>
              <li>Each answer is published under your name and linked to your profile and clinic.</li>
              <li>Build stronger online credibility in your specialization.</li>
              <li>Reach more patients beyond your clinic with expert guidance.</li>
            </ul>
            <p className="doctor-signup-benefits-closing">Start answering. Build authority. Reach more patients.</p>
          </div>
        </header>

        {googleClientId ? (
          <div className="doctor-auth-google-block">
            <div className="doctor-auth-google-inner">
              <GoogleLogin
                locale="en"
                size="large"
                width={320}
                text="signup_with"
                onSuccess={async (cred) => {
                  const idToken = cred.credential;
                  if (!idToken) return;
                  setGoogleBusy(true);
                  setError(null);
                  try {
                    await loginWithGoogle(idToken, 'doctor');
                    toast.success('Signed in with Google. Complete your profile next.');
                    navigate('/forum/doctor/complete-profile', { replace: true });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unable to sign up with Google.';
                    toast.error(msg);
                    setError(msg);
                  } finally {
                    setGoogleBusy(false);
                  }
                }}
                onError={() => toast.error('Google sign-up was interrupted.')}
              />
            </div>
            <p className="doctor-auth-google-hint">
              Prefer email? Continue below, or use Google and we’ll ask for your credentials and photo next.
            </p>
            <div className="doctor-auth-or">
              <span>or register with email</span>
            </div>
          </div>
        ) : null}

        <form className="doctor-auth-form doctor-signup-grid" onSubmit={onSubmit} noValidate>
          <label className="doctor-auth-field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Dr. Full Name"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Degree</span>
            <input
              type="text"
              value={form.degree}
              onChange={(e) => onFieldChange('degree', e.target.value)}
              placeholder="MBBS, MD, BAMS..."
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Specialization</span>
            <input
              type="text"
              value={form.qualification}
              onChange={(e) => onFieldChange('qualification', e.target.value)}
              placeholder="Specialization and certifications"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Clinical Experience (Years)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.experience}
              onChange={(e) => onFieldChange('experience', e.target.value)}
              placeholder="Years of experience"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Branch Name</span>
            <input
              type="text"
              value={form.branchName}
              onChange={(e) => onFieldChange('branchName', e.target.value)}
              placeholder="Clinic branch name"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Profile Link</span>
            <input
              type="url"
              value={form.profileLink}
              onChange={(e) => onFieldChange('profileLink', e.target.value)}
              placeholder="https://..."
              required
            />
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>WhatsApp Number</span>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => onFieldChange('whatsappNumber', e.target.value)}
              placeholder="Number to receive new question alerts"
              autoComplete="tel"
              required
            />
            <small className="doctor-meta">Used to share new patient questions on WhatsApp.</small>
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>Photo</span>
            <input id="doctor-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPhotoChange} required />
            <div className="doctor-upload-shell">
              <label htmlFor="doctor-photo" className="doctor-upload-btn">
                Choose Photo
              </label>
              <p className="doctor-upload-name">{form.photo ? form.photo.name : 'No file selected'}</p>
            </div>
            <small className="doctor-meta">Accepted: JPEG, PNG, WebP, GIF. Max file size: 5 MB.</small>
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>Bio (Short) — max {MAX_BIO_CHARS} characters</span>
            <textarea
              value={form.bio}
              onChange={onBioChange}
              onInput={onBioInput}
              placeholder="Write a short doctor bio..."
              rows={5}
              maxLength={MAX_BIO_CHARS}
              required
            />
            <small className={bioAtLimit ? 'doctor-meta doctor-meta-warn' : 'doctor-meta'} aria-live="polite">
              {bioCharCount}/{MAX_BIO_CHARS} characters ({bioRemaining} remaining)
            </small>
          </label>

          <fieldset className="doctor-auth-field doctor-auth-field-full doctor-expertise-fieldset">
            <legend className="doctor-expertise-legend">Areas you can answer</legend>
            <p className="doctor-meta doctor-expertise-help">
              Patient questions are routed by category. Choose every specialty you are willing to review (at least one).
            </p>
            <div className="doctor-expertise-grid">
              {QUESTION_CATEGORY_OPTIONS.map((tag) => (
                <label key={tag} className="doctor-expertise-chip">
                  <input
                    type="checkbox"
                    checked={expertiseTags.includes(tag)}
                    onChange={() => toggleExpertise(tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="doctor-auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="doctor@example.com"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Password</span>
            <input
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => onFieldChange('password', e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          <div className="doctor-auth-actions doctor-auth-field-full">
            <button
              type="submit"
              className="doctor-auth-btn"
              disabled={!form.photo || expertiseTags.length === 0 || googleBusy}
            >
              {loading ? 'Please wait...' : 'Create Account'}
            </button>
            {error && <p className="doctor-meta doctor-meta-error">{error}</p>}
            <p>
              Already have an account? <Link to="/forum/doctor-login">Login</Link>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
