import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FaBookmark } from 'react-icons/fa6';
import DoctorAnswerCard from '../components/DoctorAnswerCard';
import { Seo } from '../components/Seo';
import { useToast } from '../context/ToastContext';
import {
  CATEGORY_META,
  DEFAULT_FORUM_SLUG,
  isForumCategorySlug,
  type ForumCategorySlug,
} from '../data/forumData';
import { fetchForumQuestionDetail, submitForumReport, type ForumDetailResponse } from '../lib/forumPublicApi';
import { forumQuestionPath } from '../lib/questionSlug';
import {
  buildForumQuestionSeoDescription,
  buildForumQuestionSeoTitle,
  forumCategoryKeywords,
} from '../seo/forumQuestionSeo';
import { forumQuestionPageJsonLd } from '../seo/jsonLd';
import { formatShortAgo } from '../lib/formatShortAgo';
import { isForumQuestionSaved, toggleForumSaved } from '../lib/forumSavedQuestions';
import '../Forum.css';
import { FiArrowRight, FiBookmark, FiEye, FiFlag, FiMessageCircle, FiShare2 } from 'react-icons/fi';

function truncateMeta(text: string, max: number) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

const EDU_DISCLAIMER =
  'This information is educational and not a substitute for an in-person consultation. For emergencies, contact local emergency services immediately.';

async function shareDiscussionPage(title: string, url: string, toast: { success: (m: string) => void; error: (m: string) => void }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: title, url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard.');
  } catch {
    toast.error('Unable to copy automatically. Copy the URL from your browser’s address bar.');
  }
}

export function ForumQuestionDetailPage() {
  const toast = useToast();
  const { categorySlug, questionSlug } = useParams();
  const slugValid = Boolean(categorySlug && isForumCategorySlug(categorySlug));
  const slug = (slugValid ? categorySlug! : DEFAULT_FORUM_SLUG) as ForumCategorySlug;
  const meta = CATEGORY_META[slug];

  const [detail, setDetail] = useState<ForumDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (!slugValid) {
      setLoading(false);
      setDetail(null);
      setNotFound(false);
      return;
    }
    if (!questionSlug) {
      setLoading(false);
      setNotFound(true);
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchForumQuestionDetail(slug, questionSlug);
        if (cancelled) return;
        if (!d) {
          setDetail(null);
          setNotFound(true);
        } else {
          setDetail(d);
          setNotFound(false);
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugValid, slug, questionSlug]);

  useEffect(() => {
    if (!detail || !slugValid) return;
    setSaved(isForumQuestionSaved(slug, detail.slug));
  }, [slugValid, slug, detail]);

  useEffect(() => {
    if (!reportOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [reportOpen]);

  const onToggleSave = useCallback(() => {
    if (!detail || !slugValid) return;
    const nowSaved = toggleForumSaved(slug, detail.slug, detail.body);
    setSaved(nowSaved);
    toast.success(
      nowSaved
        ? 'Saved on this device. Your browser stores this list locally.'
        : 'Removed from your saved questions.',
    );
  }, [detail, slug, slugValid, toast]);

  const onShare = useCallback(() => {
    if (!detail || !slugValid) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    shareDiscussionPage(detail.body, url, toast).catch(() => {});
  }, [detail, slugValid, toast]);

  const onSubmitReport = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!detail || !slugValid) return;
      const msg = reportText.trim();
      if (msg.length < 10) {
        toast.error('Please describe your concern in at least 10 characters.');
        return;
      }
      setReportSubmitting(true);
      try {
        await submitForumReport(slug, detail.slug, msg);
        toast.success('Thank you. Our moderation team will review your report.');
        setReportOpen(false);
        setReportText('');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not send report.');
      } finally {
        setReportSubmitting(false);
      }
    },
    [detail, reportText, slug, slugValid, toast],
  );

  if (!slugValid) {
    return <Navigate to={`/forum/${DEFAULT_FORUM_SLUG}`} replace />;
  }

  if (loading) {
    return (
      <div className="forum-page forum-detail">
        <div className="forum-shell forum-detail-shell">
          <p style={{ padding: 48, color: '#64748b' }}>Loading discussion…</p>
        </div>
      </div>
    );
  }

  if (notFound || !detail) {
    const path = forumQuestionPath(slug, questionSlug ?? '');
    return (
      <>
        <Seo
          title="Question not found"
          description={`This forum question could not be found. Browse more in ${meta.title}.`}
          canonicalPath={path}
          noindex
        />
        <div className="forum-page forum-detail-empty">
          <p>This discussion is not available on the public forum yet, or the link may be outdated.</p>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 480 }}>
            Only questions with a published doctor reply appear here. New links use a title-based URL from the category
            listing.
          </p>
          <Link to={`/forum/${slug}`}>Back to {meta.title}</Link>
        </div>
      </>
    );
  }

  const seoTitle = buildForumQuestionSeoTitle(meta.title, detail.body);
  const seoDescription = buildForumQuestionSeoDescription(detail.body, {
    answerCount: detail.answers.length,
    doctorName: detail.answers[0]?.doctor.name,
  });
  const breadcrumbLeaf = truncateMeta(detail.body, 48);
  const lastModified =
    detail.answers[detail.answers.length - 1]?.createdAt ?? detail.createdAt;

  const canonicalPath = forumQuestionPath(slug, detail.slug);
  if (questionSlug && questionSlug !== detail.slug) {
    return <Navigate to={canonicalPath} replace />;
  }

  return (
    <div className="forum-page forum-detail">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        ogType="article"
        keywords={forumCategoryKeywords(slug)}
        publishedTime={detail.createdAt}
        modifiedTime={lastModified}
        jsonLd={forumQuestionPageJsonLd(slug, detail)}
      />
      <div className="forum-shell forum-detail-shell">
        <div className="forum-detail-main">
          <article className="forum-patient-card">
            <nav className="forum-breadcrumb forum-detail-bc" aria-label="Breadcrumb">
              <Link to="/forum">Home</Link>
              <span className="forum-bc-sep">›</span>
              <Link to={`/forum/${slug}`}>Forum</Link>
              <span className="forum-bc-sep">›</span>
              <Link to={`/forum/${slug}`}>{meta.title}</Link>
              <span className="forum-bc-sep">›</span>
              <span>{breadcrumbLeaf}</span>
            </nav>
            <div className="forum-patient-head">
              <span className="forum-pill-patient">Patient question</span>
              <span className="forum-patient-posted">
                Posted {formatShortAgo(detail.createdAt)}
                <span className="forum-patient-views" aria-label={`${detail.viewCount ?? 0} views`}>
                  · <FiEye aria-hidden /> {(detail.viewCount ?? 0).toLocaleString()} views
                </span>
              </span>
            </div>
            <h1 className="forum-detail-title forum-detail-title--body">{detail.body}</h1>
            <div className="forum-patient-profile">
              <div className="forum-patient-avatar" aria-hidden>
                P
              </div>
              <div>
                <div className="forum-patient-id">Reference: {detail.patientAnonId}</div>
                <div className="forum-patient-meta">
                  {detail.category} · Submitted via Ask Question
                </div>
              </div>
            </div>
            <div className="forum-patient-actions">
              <div className="forum-patient-left">
                <button
                  type="button"
                  className={`forum-link-btn${saved ? ' is-saved' : ''}`}
                  onClick={onToggleSave}
                  aria-pressed={saved}
                >
                  {saved ? <FaBookmark aria-hidden /> : <FiBookmark aria-hidden />}
                  {saved ? 'Saved' : 'Save question'}
                </button>
                <button type="button" className="forum-link-btn" onClick={onShare}>
                  <FiShare2 aria-hidden /> Share
                </button>
              </div>
              <button type="button" className="forum-report" onClick={() => setReportOpen(true)}>
                <FiFlag aria-hidden /> Report concern
              </button>
            </div>
          </article>

          {reportOpen ? (
            <div
              className="forum-modal-backdrop"
              role="presentation"
              onClick={() => !reportSubmitting && setReportOpen(false)}
            >
              <div
                className="forum-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="forum-report-title"
                onClick={(ev) => ev.stopPropagation()}
              >
                <h2 id="forum-report-title">Report a concern</h2>
                <p className="forum-modal-desc">
                  Tell us what is wrong with this public discussion (for example, unsafe advice, spam, or harassment). This
                  is reviewed by our team; it is not a medical emergency line.
                </p>
                <form onSubmit={onSubmitReport}>
                  <textarea
                    value={reportText}
                    onChange={(ev) => setReportText(ev.target.value)}
                    placeholder="Describe the issue…"
                    maxLength={2000}
                    aria-label="Report details"
                  />
                  <p className="forum-modal-hint">Minimum 10 characters. Maximum 2,000.</p>
                  <div className="forum-modal-actions">
                    <button
                      type="button"
                      className="forum-modal-btn forum-modal-btn--ghost"
                      disabled={reportSubmitting}
                      onClick={() => setReportOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="forum-modal-btn forum-modal-btn--primary"
                      disabled={reportSubmitting || reportText.trim().length < 10}
                    >
                      {reportSubmitting ? 'Sending…' : 'Submit report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {detail.answers.map((ans) => (
            <DoctorAnswerCard
              key={ans.id}
              answerId={ans.id}
              createdAt={ans.createdAt}
              answerHtml={ans.answerHtml}
              questionCategory={detail.category}
              doctor={ans.doctor}
            />
          ))}

          <div className="forum-disclaimer" style={{ marginTop: 16 }}>
            <span className="forum-info-icon" aria-hidden />
            {EDU_DISCLAIMER}
          </div>
        </div>

        <aside className="forum-detail-aside">
          <div className="forum-related-card">
            <h2 className="forum-related-h">Related questions patients asked</h2>
            {detail.related.length === 0 ? (
              <p style={{ fontSize: 14, color: '#64748b' }}>More discussions will appear as doctors answer new questions.</p>
            ) : (
              <ul className="forum-related-list">
                {detail.related.map((r) => (
                  <li key={r.slug}>
                    <Link to={forumQuestionPath(slug, r.slug)} className="forum-related-link">
                      {r.title}
                    </Link>
                    <div className="forum-related-meta">
                      <span>
                        <FiMessageCircle aria-hidden /> {r.answerCount}{' '}
                        {r.answerCount === 1 ? 'reply' : 'replies'}
                      </span>
                      <span>
                        <FiEye aria-hidden /> {(r.viewCount ?? 0).toLocaleString()} views
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/forum/${slug}`} className="forum-related-all">
              View all in {meta.title} <FiArrowRight aria-hidden />
            </Link>
          </div>

          <div className="forum-follow-card">
            <div className="forum-follow-icons" aria-hidden>
              <FiMessageCircle />
              <FiMessageCircle />
            </div>
            <h3 className="forum-follow-title">Have a follow-up question?</h3>
            <p className="forum-follow-text">Ask for clarification or get a second opinion from our medical experts.</p>
            <Link to="/forum/ask" className="forum-follow-btn">
              Ask follow-up
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
