import { useState, type ChangeEvent, type FormEvent, type FormEvent as ReactFormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaStethoscope } from 'react-icons/fa6';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { QUESTION_CATEGORY_ALL } from '../constants/questionCategories';
import { apiRequest, apiUploadPublicImage, type AuthPayload } from '../lib/api';
import './DoctorAuth.css';

type FormState = {
  degree: string;
  qualification: string;
  experience: string;
  branchName: string;
  profileLink: string;
  whatsappNumber: string;
  photo: File | null;
  bio: string;
};

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

export default function DoctorCompleteProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, token, isAuthenticated, replaceSession } = useSession();
  const [form, setForm] = useState<FormState>({
    degree: '',
    qualification: '',
    experience: '',
    branchName: '',
    profileLink: '',
    whatsappNumber: '',
    photo: null,
    bio: '',
  });
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bioCharCount = form.bio.length;
  const bioRemaining = MAX_BIO_CHARS - bioCharCount;
  const bioAtLimit = bioCharCount >= MAX_BIO_CHARS;

  function onFieldChange<K extends keyof Omit<FormState, 'photo'>>(key: K, value: FormState[K]) {
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
    if (!form.photo || expertiseTags.length === 0 || !token) return;
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

      const payload = await apiRequest<AuthPayload>(
        '/auth/doctor/complete-profile',
        {
          method: 'PATCH',
          body: JSON.stringify({
            degree: form.degree.trim(),
            qualification: form.qualification.trim(),
            clinicalExperienceYears: Number(form.experience || 0),
            branchName: form.branchName.trim(),
            profileLink: form.profileLink.trim(),
            whatsappNumber: form.whatsappNumber.trim(),
            photoUrl,
            bio: form.bio.trim(),
            expertiseTags,
          }),
        },
        token,
      );
      replaceSession(payload);
      toast.success('Profile complete. Welcome to the doctor panel.');
      navigate('/forum/doctor/panel', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save profile.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/forum/doctor-login" replace />;
  }
  if (user.role !== 'doctor') {
    return <Navigate to="/forum" replace />;
  }
  if (!user.needsDoctorProfile) {
    return <Navigate to="/forum/doctor/panel" replace />;
  }

  return (
    <main className="doctor-auth-page">
      <Seo
        title="Complete doctor profile"
        description="Finish your professional details after signing in with Google."
        canonicalPath="/forum/doctor/complete-profile"
      />
      <section className="doctor-auth-card doctor-auth-card-wide">
        <header className="doctor-auth-header">
          <span className="doctor-auth-header-icon" aria-hidden>
            <FaStethoscope />
          </span>
          <h1>Complete your doctor profile</h1>
          <p>
            You signed in with Google as <strong>{user?.email ?? 'your account'}</strong>. Add your credentials, photo,
            and specialties before using the doctor panel.
          </p>
        </header>

        <form className="doctor-auth-form doctor-signup-grid" onSubmit={onSubmit} noValidate>
          <label className="doctor-auth-field">
            <span>Degree</span>
            <input
              type="text"
              value={form.degree}
              onChange={(e) => onFieldChange('degree', e.target.value)}
              placeholder="MBBS, MD, BAMS…"
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
            <span>Clinical experience (years)</span>
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
            <span>Branch name</span>
            <input
              type="text"
              value={form.branchName}
              onChange={(e) => onFieldChange('branchName', e.target.value)}
              placeholder="Clinic branch name"
              required
            />
          </label>

          <label className="doctor-auth-field">
            <span>Profile link</span>
            <input
              type="url"
              value={form.profileLink}
              onChange={(e) => onFieldChange('profileLink', e.target.value)}
              placeholder="https://..."
              required
            />
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>WhatsApp number</span>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => onFieldChange('whatsappNumber', e.target.value)}
              placeholder="Number used on WhatsApp"
              autoComplete="tel"
              required
            />
            <small className="doctor-meta">Used to share new patient questions with you on WhatsApp.</small>
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>Photo</span>
            <input id="doctor-complete-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPhotoChange} required />
            <div className="doctor-upload-shell">
              <label htmlFor="doctor-complete-photo" className="doctor-upload-btn">
                Choose photo
              </label>
              <p className="doctor-upload-name">{form.photo ? form.photo.name : 'No file selected'}</p>
            </div>
            <small className="doctor-meta">Accepted: JPEG, PNG, WebP, GIF. Max 5 MB.</small>
          </label>

          <label className="doctor-auth-field doctor-auth-field-full">
            <span>Bio (short) — max {MAX_BIO_CHARS} characters</span>
            <textarea
              value={form.bio}
              onChange={onBioChange}
              onInput={onBioInput}
              placeholder="Write a short doctor bio…"
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
            <p className="doctor-meta doctor-expertise-help">Choose at least one category you are willing to review.</p>
            <div className="doctor-expertise-grid">
              {QUESTION_CATEGORY_ALL.map((tag) => (
                <label key={tag} className="doctor-expertise-chip">
                  <input type="checkbox" checked={expertiseTags.includes(tag)} onChange={() => toggleExpertise(tag)} />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="doctor-auth-actions doctor-auth-field-full">
            <button type="submit" className="doctor-auth-btn" disabled={!form.photo || expertiseTags.length === 0 || loading}>
              {loading ? 'Please wait…' : 'Save profile'}
            </button>
            {error ? <p className="doctor-meta doctor-meta-error">{error}</p> : null}
            <p>
              <Link to="/forum" className="doctor-auth-login-back">
                ← Back to main site
              </Link>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
