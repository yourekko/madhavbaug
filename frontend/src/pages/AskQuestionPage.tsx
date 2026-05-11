import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuilding,
  FaChevronDown,
  FaCircleCheck,
  FaClock,
  FaFire,
  FaPaperPlane,
  FaPhone,
  FaCircleInfo,
  FaShieldHalved,
  FaStar,
  FaVideo,
} from 'react-icons/fa6';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../lib/api';
import { QUESTION_CATEGORY_OPTIONS, QUESTION_CATEGORY_PLACEHOLDER } from '../constants/questionCategories';
import '../AskQuestion.css';

const categories = [QUESTION_CATEGORY_PLACEHOLDER, ...QUESTION_CATEGORY_OPTIONS];

const ageGroups = ['Select age group', '18–30', '31–45', '46–60', '60+'];
const genders = ['Select gender', 'Female', 'Male', 'Prefer not to say'];

const sidebarDoctors = [
  { name: 'Dr. Rajesh Kumar', role: 'Cardiologist', years: 15, avatarClass: 'd1' },
  { name: 'Dr. Priya Sharma', role: 'Diabetes Specialist', years: 12, avatarClass: 'd2' },
  { name: 'Dr. Amit Verma', role: 'General Physician', years: 10, avatarClass: 'd3' },
];

const popularTopics = [
  'Heart',
  'Diabetes',
  'Hypertension',
  'Weight Loss',
  'Thyroid',
];

const faqItems = [
  {
    q: 'How long does it take to get an answer?',
    a: 'Most questions receive a doctor-reviewed response within 24–48 hours. Complex cases may take slightly longer.',
  },
  {
    q: 'Is my information kept confidential?',
    a: 'Yes. Your submission is handled according to our privacy policy and is only shared with qualified medical reviewers.',
  },
  {
    q: 'Can I ask follow-up questions?',
    a: 'You can submit a new question referencing your earlier topic, or book a consultation for ongoing care.',
  },
  {
    q: 'Are the doctors qualified?',
    a: 'All answering doctors are licensed practitioners with verified credentials and relevant specializations.',
  },
];

const MAX_Q = 2000;
const MIN_Q = 20;
/** Must match API `CreateQuestionDto` @MaxLength(180) — was 80 and cut titles mid-sentence in lists. */
const MAX_TITLE_LEN = 180;

type AskLocationState = { draftQuestion?: string };

export default function AskQuestionPage() {
  const location = useLocation();
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [ageGroup, setAgeGroup] = useState(ageGroups[0]);
  const [gender, setGender] = useState(genders[0]);
  const [history, setHistory] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, token } = useSession();
  const toast = useToast();

  useEffect(() => {
    const st = location.state as AskLocationState | null;
    const draft = st?.draftQuestion?.trim();
    if (draft) setQuestion(draft.slice(0, MAX_Q));
  }, [location.state]);

  const qLen = question.length;
  /** Only the question text is required — category / age / gender are optional to reduce form abandonment. */
  const canSubmit = qLen >= MIN_Q;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (!isAuthenticated || !token) {
      const msg = 'Please sign in first to submit your question.';
      toast.info(msg);
      setSubmitError(msg);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await apiRequest(
        '/questions',
        {
          method: 'POST',
          body: JSON.stringify({
            title: question.trim().slice(0, MAX_TITLE_LEN) || 'Health Question',
            body: question,
            ...(category !== categories[0] ? { category } : {}),
            patientAgeGroup: ageGroup === ageGroups[0] ? undefined : ageGroup,
            patientGender: gender === genders[0] ? undefined : gender,
            patientHistory: history.trim() || undefined,
          }),
        },
        token,
      );
      setQuestion('');
      setCategory(categories[0]);
      setAgeGroup(ageGroups[0]);
      setGender(genders[0]);
      setHistory('');
      toast.success('Question submitted. Check My Discussions for updates.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit question.';
      toast.error(msg);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ask-page">
      <Seo
        title="Ask a Doctor"
        description="Submit your health question for a doctor-reviewed answer. Confidential, structured form with category and history fields."
        canonicalPath="/ask"
      />
      <Reveal as="div" className="ask-hero-wrap">
        <main className="ask-main">
          <div className="content-wrap ask-grid">
            <div className="ask-form-column">
              <div className="ask-form-card ask-form-reveal">
                <div className="ask-form-header">
                  <span className="ask-form-icon" aria-hidden>
                    ?
                  </span>
                  <div>
                    <h1 className="ask-form-title">Ask a Doctor Your Health Question</h1>
                    <p className="ask-form-lead">
                      Describe your concern in detail. A verified doctor will review and respond with medically sound
                      guidance.
                    </p>
                  </div>
                </div>

                <form className="ask-form" onSubmit={handleSubmit} noValidate>
                  <label className="ask-label">
                    Your Health Question
                    <textarea
                      className="ask-textarea"
                      rows={6}
                      placeholder="Example: I have been experiencing frequent headaches for the past two weeks, mostly in the morning. I also feel dizzy when standing up quickly..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value.slice(0, MAX_Q))}
                      aria-describedby="q-counter q-hint"
                    />
                    <div className="ask-field-meta" id="q-counter">
                      <span className={qLen > 0 && qLen < MIN_Q ? 'warn' : ''}>
                        {qLen}/{MAX_Q}
                      </span>
                      <span id="q-hint">Add at least {MIN_Q} characters so a doctor can reply helpfully</span>
                    </div>
                  </label>

                  <label className="ask-label">
                    Medical Category <span className="optional">(optional)</span>
                    <div className="ask-select-wrap">
                      <select className="ask-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="ask-select-chevron" aria-hidden />
                    </div>
                  </label>

                  <div className="ask-row-2">
                    <label className="ask-label">
                      Age Group <span className="optional">(optional)</span>
                      <div className="ask-select-wrap">
                        <select className="ask-select" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                          {ageGroups.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="ask-select-chevron" aria-hidden />
                      </div>
                    </label>
                    <label className="ask-label">
                      Gender <span className="optional">(optional)</span>
                      <div className="ask-select-wrap">
                        <select className="ask-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                          {genders.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="ask-select-chevron" aria-hidden />
                      </div>
                    </label>
                  </div>

                  <label className="ask-label">
                    Medical History <span className="optional">(Optional)</span>
                    <textarea
                      className="ask-textarea ask-textarea-sm"
                      rows={3}
                      placeholder="List existing conditions, medications, or allergies..."
                      value={history}
                      onChange={(e) => setHistory(e.target.value)}
                    />
                  </label>

                  <div className="ask-privacy-banner">
                    <FaShieldHalved className="ask-privacy-icon" aria-hidden />
                    <div>
                      <strong>Your Privacy is Protected</strong>
                      <p>Your question is reviewed only by authorized medical staff and handled per our privacy policy.</p>
                    </div>
                  </div>

                  <div className="ask-form-actions">
                    <Link to="/forum" className="ask-cancel">
                      <FaArrowLeft aria-hidden /> Cancel
                    </Link>
                    <button type="submit" className="ask-submit" disabled={!canSubmit || submitting}>
                      <FaPaperPlane aria-hidden /> Submit Question
                    </button>
                  </div>
                  {submitError && (
                    <p className="hero-q-error" role="alert">
                      {submitError}
                    </p>
                  )}
                </form>
              </div>
            </div>

            <aside className="ask-sidebars" aria-label="Helpful information">
              <div className="ask-side-card ask-side-doctors">
                <h2 className="ask-side-title">Verified Doctors</h2>
                <ul className="ask-doctor-list">
                  {sidebarDoctors.map((d) => (
                    <li key={d.name}>
                      <span className={`ask-doc-avatar ${d.avatarClass}`} />
                      <div>
                        <strong>{d.name}</strong>
                        <span className="ask-doc-role">{d.role}</span>
                        <span className="ask-doc-exp">
                          <FaStar className="ask-star" aria-hidden /> {d.years} years exp
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="ask-verified-banner">
                  <FaCircleCheck aria-hidden /> All Doctors Verified
                </div>
              </div>

              <div className="ask-side-card ask-side-response">
                <div className="ask-response-head">
                  <FaClock className="ask-response-clock" aria-hidden />
                  <div>
                    <h2 className="ask-side-title-inline">Quick Response Time</h2>
                    <p>Typical turnaround for non-urgent medical questions.</p>
                  </div>
                </div>
                <div className="ask-response-badge">24–48h Average Response Time</div>
              </div>

              <div className="ask-side-card ask-side-topics">
                <h2 className="ask-side-title">
                  <FaFire className="ask-fire" aria-hidden /> Popular Topics
                </h2>
                <ul className="ask-topic-chips">
                  {popularTopics.map((t) => (
                    <li key={t}>
                      <button type="button" className="ask-topic-chip">
                        {t}
                        <FaArrowRight aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </Reveal>

      <Reveal as="section" className="ask-section ask-guidelines">
        <div className="content-wrap">
          <div className="ask-guidelines-card">
            <h2 className="ask-section-title">
              <FaCircleInfo className="ask-info-icon" aria-hidden /> Guidelines for Asking Questions
            </h2>
            <ul className="ask-guidelines-list">
              <li>
                <FaCircleCheck className="ask-g-check" aria-hidden />
                <div>
                  <strong>Be Specific and Detailed</strong>
                  <p>Include symptoms, duration, severity, and any factors that make it better or worse.</p>
                </div>
              </li>
              <li>
                <FaCircleCheck className="ask-g-check" aria-hidden />
                <div>
                  <strong>Mention Current Medications</strong>
                  <p>List all medications, supplements, and treatments you&apos;re currently taking.</p>
                </div>
              </li>
              <li>
                <FaCircleCheck className="ask-g-check" aria-hidden />
                <div>
                  <strong>One Question Per Submission</strong>
                  <p>Focus on one main health concern to receive the most accurate and detailed response.</p>
                </div>
              </li>
              <li>
                <FaCircleCheck className="ask-g-check" aria-hidden />
                <div>
                  <strong>Emergency Situations</strong>
                  <p>For urgent medical emergencies, call emergency services or visit the nearest hospital immediately.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="ask-section ask-immediate">
        <div className="content-wrap ask-immediate-inner">
          <h2 className="ask-immediate-title">Need Immediate Help?</h2>
          <p className="ask-immediate-sub">We&apos;re here to support you with multiple ways to get medical assistance.</p>
          <div className="ask-help-grid">
            <article className="ask-help-card ask-help-emergency">
              <span className="ask-help-icon pink">
                <FaPhone />
              </span>
              <h3>Emergency Hotline</h3>
              <p>For urgent medical situations</p>
              <a href="tel:18000000000" className="ask-help-phone">
                1800-XXX-XXXX
              </a>
            </article>
            <article className="ask-help-card">
              <span className="ask-help-icon green">
                <FaVideo />
              </span>
              <h3>Video Consultation</h3>
              <p>Book an online appointment</p>
              <button type="button" className="ask-help-btn ask-help-btn-teal">
                Book Now
              </button>
            </article>
            <article className="ask-help-card">
              <span className="ask-help-icon blue">
                <FaBuilding />
              </span>
              <h3>Visit Clinic</h3>
              <p>Find nearest Madhavbaug center</p>
              <button type="button" className="ask-help-btn ask-help-btn-blue">
                Find Location
              </button>
            </article>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="ask-section ask-faq-section">
        <div className="content-wrap ask-faq-inner">
          <h2 className="ask-immediate-title">Frequently Asked Questions</h2>
          <p className="ask-immediate-sub">Common questions about our medical Q&amp;A platform</p>
          <div className="ask-faq-list">
            {faqItems.map((item, i) => (
              <div key={item.q} className={`ask-faq-item ${faqOpen === i ? 'open' : ''}`}>
                <button
                  type="button"
                  className="ask-faq-trigger"
                  aria-expanded={faqOpen === i}
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <FaChevronDown className="ask-faq-chevron" aria-hidden />
                </button>
                <div className="ask-faq-panel" hidden={faqOpen !== i}>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
