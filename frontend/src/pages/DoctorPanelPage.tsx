import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCircleCheck, FaComments, FaLock, FaStethoscope, FaUserDoctor } from 'react-icons/fa6';
import AnswerHtml from '../components/AnswerHtml';
import DoctorAnswerEditor from '../components/DoctorAnswerEditor';
import { Seo } from '../components/Seo';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { answerHasMeaningfulContent } from '../lib/answerContent';
import { apiRequest } from '../lib/api';
import './DoctorPanel.css';

type DoctorQueueItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
  assignedToMe: boolean;
  canAnswer: boolean;
};

type ThreadAnswer = {
  id: string;
  answerText: string;
  doctorUserId: string;
  createdAt: string;
  isPublished?: boolean;
};

type DoctorThread = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
  answers?: ThreadAnswer[];
};

export default function DoctorPanelPage() {
  const { token, user, isAuthenticated } = useSession();
  const toast = useToast();
  const [items, setItems] = useState<DoctorQueueItem[]>([]);
  const [selected, setSelected] = useState<DoctorQueueItem | null>(null);
  const [thread, setThread] = useState<DoctorThread | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [draftKey, setDraftKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const loadQueue = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    setError(null);
    try {
      const data = await apiRequest<DoctorQueueItem[]>('/doctor/questions', {}, token);
      setItems(data);
      setSelected((prev) => {
        if (prev && data.some((q) => q.id === prev.id)) return prev;
        return data[0] ?? null;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load doctor queue.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  }, [token, toast]);

  const loadThread = useCallback(
    async (questionId: string) => {
      if (!token) return;
      setLoadingThread(true);
      try {
        const t = await apiRequest<DoctorThread>(`/doctor/questions/${questionId}`, {}, token);
        setThread(t);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load question.';
        toast.error(msg);
        setThread(null);
      } finally {
        setLoadingThread(false);
      }
    },
    [token, toast],
  );

  useEffect(() => {
    if (!token) return;
    loadQueue().catch(() => {});
  }, [token, loadQueue]);

  useEffect(() => {
    if (!selected?.id || !token) {
      setThread(null);
      return;
    }
    loadThread(selected.id).catch(() => {});
  }, [selected?.id, token, loadThread]);

  const publishedAnswers = (thread?.answers ?? []).filter((a) => a.isPublished !== false);
  const threadOpen =
    thread && (thread.status === 'open' || thread.status === 'assigned');
  const canSubmit = Boolean(threadOpen && publishedAnswers.length === 0);

  async function submitAnswer(e: FormEvent) {
    e.preventDefault();
    if (!token || !selected) return;
    if (!answerHasMeaningfulContent(answerText)) {
      toast.error('Please write a short answer (at least a few words) or add an image.');
      return;
    }
    try {
      await apiRequest(
        `/doctor/questions/${selected.id}/answers`,
        { method: 'POST', body: JSON.stringify({ answerText: answerText.trim() }) },
        token,
      );
      setAnswerText('');
      setDraftKey((k) => k + 1);
      toast.success('Your answer was posted. No other doctor can add a competing reply to this thread.');
      await loadQueue();
      await loadThread(selected.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit answer.';
      toast.error(msg);
      setError(msg);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="dp-gate-page">
        <Seo title="Doctor workspace" description="Sign in to review and answer patient questions." canonicalPath="/doctor/panel" />
        <div className="content-wrap dp-gate-inner">
          <div className="dp-gate-card">
            <div className="dp-gate-accent" aria-hidden />
            <div className="dp-gate-icon-wrap">
              <FaUserDoctor className="dp-gate-icon" aria-hidden />
            </div>
            <h1 className="dp-gate-title">Doctor workspace</h1>
            <p className="dp-gate-lead">
              Answer community questions that match your specialties. Sign in with your verified doctor account to open
              your queue.
            </p>
            <ul className="dp-gate-list">
              <li>
                <FaCircleCheck aria-hidden />
                <span>Questions routed by medical category and your expertise</span>
              </li>
              <li>
                <FaCircleCheck aria-hidden />
                <span>One published answer per thread—clear guidance for patients</span>
              </li>
              <li>
                <FaCircleCheck aria-hidden />
                <span>Secure access with your clinic email</span>
              </li>
            </ul>
            <div className="dp-gate-actions">
              <Link className="dp-gate-btn dp-gate-btn-primary" to="/forum/doctor-login?next=/forum/doctor/panel">
                Sign in as doctor
                <FaArrowRight aria-hidden />
              </Link>
              <Link className="dp-gate-btn dp-gate-btn-secondary" to="/forum/doctor-signup">
                New doctor? Create profile
              </Link>
            </div>
            <p className="dp-gate-foot">
              Patient or guest? Use <strong>Login</strong> in the header for the health forum, or go{' '}
              <Link to="/forum">home</Link>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (user?.role !== 'doctor') {
    return (
      <main className="dp-gate-page">
        <Seo title="Doctor workspace" description="Doctor question queue and answer workspace." canonicalPath="/doctor/panel" />
        <div className="content-wrap dp-gate-inner">
          <div className="dp-gate-card dp-gate-card--notice">
            <div className="dp-gate-icon-wrap dp-gate-icon-wrap--muted">
              <FaLock className="dp-gate-icon" aria-hidden />
            </div>
            <h1 className="dp-gate-title">Different account type</h1>
            <p className="dp-gate-lead">
              You’re signed in as a <strong>{user?.role === 'patient' ? 'patient' : user?.role}</strong>. This workspace is
              only for verified doctors. Sign out and use doctor credentials, or continue with your patient tools.
            </p>
            <div className="dp-gate-actions">
              <Link className="dp-gate-btn dp-gate-btn-primary" to="/forum/doctor-login?next=/forum/doctor/panel">
                Doctor sign in
                <FaArrowRight aria-hidden />
              </Link>
              <Link className="dp-gate-btn dp-gate-btn-secondary" to="/forum/my-discussions">
                My discussions
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dp-page">
      <Seo title="Doctor Panel" description="Doctor question queue and answer workspace." canonicalPath="/doctor/panel" />
      <div className="content-wrap dp-inner">
        <header className="dp-head">
          <h1>Doctor workspace</h1>
          <p>
            You see open questions that match the specialties on your profile, plus any thread an admin has explicitly
            assigned to you. The first published answer closes the thread so patients do not get conflicting advice.
          </p>
        </header>

        {error ? <div className="dp-error">{error}</div> : null}

        <div className="dp-layout">
          <aside className="dp-sidebar">
            <h2 className="dp-sidebar-title">Question queue</h2>
            {loadingList && !items.length ? <div className="dp-loading">Loading queue…</div> : null}
            {!loadingList && items.length === 0 ? (
              <div className="dp-panel-empty" style={{ padding: 24, minHeight: 'auto' }}>
                <strong>No questions in your queue</strong>
                New submissions appear here when they match your listed areas of expertise. If your profile has no
                specialties yet, you will still see all open questions until those are set.
              </div>
            ) : (
              items.map((q) => (
                <button
                  type="button"
                  key={q.id}
                  className={`dp-thread-btn ${selected?.id === q.id ? 'is-active' : ''}`}
                  onClick={() => setSelected(q)}
                >
                  <h3>{q.body}</h3>
                  <div className="dp-thread-meta">
                    <span>{q.category}</span>
                    <span aria-hidden>·</span>
                    <span>{q.status}</span>
                    {q.assignedToMe ? (
                      <span className="dp-badge dp-badge--yours">Assigned to you</span>
                    ) : q.canAnswer ? (
                      <span className="dp-badge dp-badge--queue">Open</span>
                    ) : (
                      <span className="dp-badge dp-badge--done">Answered</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </aside>

          <section className="dp-panel">
            {!selected ? (
              <div className="dp-panel-empty">
                <strong>Select a question</strong>
                Choose a thread from the queue to read the full message and respond.
              </div>
            ) : loadingThread && !thread ? (
              <div className="dp-loading">Loading question…</div>
            ) : thread ? (
              <>
                <h2 className="dp-question-title">{thread.body}</h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8' }}>
                  Submitted {new Date(thread.createdAt).toLocaleString()}
                </p>

                <h3 className="dp-section-title">
                  <FaStethoscope aria-hidden />
                  Published answers
                </h3>
                {publishedAnswers.length === 0 ? (
                  <div className="dp-callout dp-callout--info">
                    No doctor reply yet. The first published answer locks this case for other doctors.
                  </div>
                ) : (
                  publishedAnswers.map((a) => (
                    <article key={a.id} className="dp-answer-card">
                      <AnswerHtml html={a.answerText} className="dp-answer-html" />
                      <div className="dp-answer-meta">
                        {a.doctorUserId === user?.id ? 'Your reply' : 'Another doctor'} ·{' '}
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </article>
                  ))
                )}

                {canSubmit && token ? (
                  <form className="dp-form" onSubmit={submitAnswer}>
                    <h3 className="dp-section-title">
                      <FaComments aria-hidden />
                      Your response
                    </h3>
                    <DoctorAnswerEditor
                      key={`${selected.id}-${draftKey}`}
                      token={token}
                      editable={canSubmit}
                      onChange={setAnswerText}
                      onUploadError={(m) => toast.error(m)}
                    />
                    <button type="submit" className="ask-submit" disabled={!answerHasMeaningfulContent(answerText)}>
                      Publish answer
                    </button>
                  </form>
                ) : (
                  <div className="dp-callout dp-callout--locked">
                    <FaLock aria-hidden style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    {publishedAnswers.length > 0
                      ? 'This question already has a published doctor answer. Other doctors cannot post an additional reply.'
                      : 'This thread is no longer open for new answers.'}
                  </div>
                )}
              </>
            ) : (
              <div className="dp-panel-empty">
                <strong>Unable to load this question</strong>
                It may have been removed or you may no longer have access.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
