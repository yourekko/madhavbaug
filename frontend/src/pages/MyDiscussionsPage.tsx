import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaCommentDots, FaStethoscope } from 'react-icons/fa6';
import AnswerHtml from '../components/AnswerHtml';
import DoctorAnswerCard from '../components/DoctorAnswerCard';
import type { DoctorAnswerCardDoctor } from '../components/DoctorAnswerCard';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../lib/api';
import '../Forum.css';
import './MyDiscussions.css';

type ThreadDoctorProfile = {
  degree?: string | null;
  qualification?: string | null;
  clinicalExperienceYears?: number | null;
  bio?: string | null;
  photoUrl?: string | null;
  branchName?: string | null;
  profileLink?: string | null;
};

type AnswerItem = {
  id: string;
  answerText: string;
  createdAt: string;
  isPublished?: boolean;
  doctor?: {
    name: string;
    doctorProfile?: ThreadDoctorProfile | null;
  } | null;
};

function threadAnswerToDoctorCardDoctor(a: AnswerItem): DoctorAnswerCardDoctor | null {
  const d = a.doctor;
  if (!d?.name) return null;
  const p = d.doctorProfile;
  const deg = p?.degree?.trim() ?? '';
  const qual = p?.qualification?.trim() ?? '';
  const titles =
    deg && qual ? `${deg} · ${qual}` : deg || qual ? `${deg}${qual}` : 'Medical reviewer';
  return {
    name: d.name,
    titles,
    experienceYears: p?.clinicalExperienceYears ?? null,
    photoUrl: p?.photoUrl ?? null,
    bio: p?.bio?.trim() ? p.bio.trim() : null,
    branchName: p?.branchName?.trim() ? p.branchName.trim() : null,
    profileLink: p?.profileLink?.trim() ? p.profileLink.trim() : null,
  };
}

type Question = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
  answers?: AnswerItem[];
  followups?: Array<{ id: string; message: string; createdAt: string }>;
};

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'open') return 'md-badge md-badge--open';
  if (s === 'assigned') return 'md-badge md-badge--assigned';
  if (s === 'answered') return 'md-badge md-badge--answered';
  if (s === 'closed') return 'md-badge md-badge--closed';
  return 'md-badge md-badge--open';
}

function publishedAnswers(answers: AnswerItem[] | undefined) {
  if (!answers?.length) return [];
  return answers.filter((a) => a.isPublished !== false);
}

export default function MyDiscussionsPage() {
  const { token, isAuthenticated } = useSession();
  const toast = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followup, setFollowup] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [followupBusy, setFollowupBusy] = useState(false);

  const selected = questions.find((q) => q.id === selectedId) ?? null;

  const doctorReplies = useMemo(
    () => (selected ? publishedAnswers(selected.answers) : []),
    [selected],
  );
  const hasDoctorAnswer = doctorReplies.length > 0;

  async function loadMyQuestions() {
    if (!token) return;
    const data = await apiRequest<Question[]>('/questions/my', {}, token);
    setQuestions(data);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }

  async function loadThread(id: string) {
    if (!token) return;
    const thread = await apiRequest<Question>(`/questions/${id}`, {}, token);
    setQuestions((prev) => prev.map((q) => (q.id === id ? thread : q)));
  }

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    loadMyQuestions()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load discussions.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!selectedId || !token) return;
    loadThread(selectedId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token]);

  useEffect(() => {
    setFollowup('');
    setContactName('');
    setContactPhone('');
  }, [selectedId]);

  async function onFollowupSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !token || !followup.trim()) return;
    setFollowupBusy(true);
    setError(null);
    try {
      await apiRequest(
        `/questions/${selectedId}/followups`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: followup.trim(),
            ...(hasDoctorAnswer
              ? {
                  contactName: contactName.trim() || undefined,
                  contactPhone: contactPhone.trim() || undefined,
                }
              : {}),
          }),
        },
        token,
      );
      setFollowup('');
      setContactName('');
      setContactPhone('');
      await loadThread(selectedId);
      toast.success('Follow-up sent. Our team will review it.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to post follow-up.';
      toast.error(msg);
      setError(msg);
    } finally {
      setFollowupBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="md-page">
        <div className="md-inner">
          <Seo
            title="My Discussions"
            description="Track your doctor answers and follow-up responses."
            canonicalPath="/forum/my-discussions"
            noindex
          />
          <div className="md-guest">
            <h1>My Discussions</h1>
            <p>Sign in to see your questions and doctor responses in one place.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="md-page">
      <div className="md-inner">
        <Seo
          title="My Discussions"
          description="Track your doctor answers and follow-up responses."
          canonicalPath="/forum/my-discussions"
            noindex
        />

        <header className="md-head">
          <h1>My Discussions</h1>
          <p>Review your health questions, read verified doctor answers, and continue the conversation when you’re ready.</p>
        </header>

        {error && (
          <div className="md-error" role="alert">
            {error}
          </div>
        )}

        <div className="md-layout">
          <aside className="md-sidebar">
            <p className="md-sidebar-title">Your threads</p>
            {loading ? (
              <div className="md-skeleton">Loading your discussions…</div>
            ) : questions.length ? (
              questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`md-thread-btn ${q.id === selectedId ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(q.id)}
                >
                  <span className="md-thread-btn-title">{q.body}</span>
                  <span className="md-thread-meta">
                    <span>{q.category}</span>
                    <span aria-hidden>·</span>
                    <span className={statusBadgeClass(q.status)}>{q.status}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="md-empty-sidebar">
                No discussions yet.
                <br />
                <Link to="/forum/ask">Ask your first question</Link>
              </div>
            )}
          </aside>

          <section className="md-panel">
            {!selected ? (
              <div className="md-panel-body md-skeleton">Select a discussion from the list.</div>
            ) : (
              <>
                <div className="md-panel-header">
                  <h2>{selected.body}</h2>
                  <div className="md-panel-header-meta">
                    <span>{selected.category}</span>
                    <span aria-hidden>·</span>
                    <span className={statusBadgeClass(selected.status)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                      {selected.status}
                    </span>
                    <span aria-hidden>·</span>
                    <span>
                      <FaClock aria-hidden style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {new Date(selected.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="md-panel-body">
                  <h3 className="md-section-title">
                    <FaStethoscope aria-hidden />
                    Doctor answers
                  </h3>

                  {hasDoctorAnswer ? (
                    doctorReplies.map((a) => {
                      const doctor = threadAnswerToDoctorCardDoctor(a);
                      return doctor ? (
                        <DoctorAnswerCard
                          key={a.id}
                          answerId={a.id}
                          createdAt={a.createdAt}
                          answerHtml={a.answerText}
                          questionCategory={selected.category}
                          doctor={doctor}
                          className="forum-doctor-card md-thread-doctor-card"
                          answerHtmlClassName="forum-doctor-body-html md-answer-html"
                        />
                      ) : (
                        <article key={a.id} className="md-answer-card">
                          <AnswerHtml html={a.answerText} className="md-answer-html" />
                        </article>
                      );
                    })
                  ) : (
                    <div className="md-waiting">
                      <div className="md-waiting-icon" aria-hidden>
                        <FaClock />
                      </div>
                      <div>
                        <h4>Awaiting doctor response</h4>
                        <p>
                          A qualified doctor will review your question and post a reply here. You’ll be able to add a follow-up
                          and optionally share contact details after you receive their answer.
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.followups && selected.followups.length > 0 ? (
                    <div style={{ marginBottom: 24 }}>
                      <h3 className="md-section-title">
                        <FaCommentDots aria-hidden />
                        Your follow-ups
                      </h3>
                      {selected.followups.map((f) => (
                        <article key={f.id} className="md-answer-card" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                          <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>{f.message}</p>
                          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>
                            {new Date(f.createdAt).toLocaleString()}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {hasDoctorAnswer ? (
                    <div className="md-followup-block">
                      <h3 className="md-section-title">
                        <FaCommentDots aria-hidden />
                        Follow-up
                      </h3>
                      <form onSubmit={onFollowupSubmit}>
                        <textarea
                          value={followup}
                          onChange={(e) => setFollowup(e.target.value)}
                          placeholder="Add a follow-up question or extra context for the doctor…"
                          required
                        />
                        <p className="md-contact-note">
                          If you’d like us to reach you for the next steps, share your contact details below (optional).
                        </p>
                        <div className="md-contact-grid">
                          <input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Your name"
                            autoComplete="name"
                          />
                          <input
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="Phone number"
                            type="tel"
                            autoComplete="tel"
                          />
                        </div>
                        <button type="submit" className="md-submit" disabled={followupBusy || !followup.trim()}>
                          {followupBusy ? 'Sending…' : 'Send follow-up'}
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
