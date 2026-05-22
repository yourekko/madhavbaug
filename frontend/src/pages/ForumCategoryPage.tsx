import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FaArrowRight, FaComments, FaStethoscope } from 'react-icons/fa6';
import {
  FiBookmark,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiEye,
  FiLayers,
  FiMessageCircle,
  FiSearch,
  FiShare2,
  FiUser,
} from 'react-icons/fi';
import { Seo } from '../components/Seo';
import {
  CATEGORY_META,
  DEFAULT_FORUM_SLUG,
  HELPFUL_RESOURCE_LINKS,
  isForumCategorySlug,
  RELATED_TOPIC_LINKS,
  type ForumCategorySlug,
} from '../data/forumData';
import { fetchForumQuestionList, fetchForumStats, type ForumListItem, type ForumStats } from '../lib/forumPublicApi';
import { forumQuestionPath } from '../lib/questionSlug';
import { forumCategoryKeywords } from '../seo/forumQuestionSeo';
import { forumCategoryJsonLd } from '../seo/jsonLd';
import { seoPublicPath } from '../seo/seoPaths';
import { formatShortAgo } from '../lib/formatShortAgo';
import '../Forum.css';

export function ForumCategoryPage() {
  const { categorySlug } = useParams();
  if (!categorySlug || !isForumCategorySlug(categorySlug)) {
    return <Navigate to={`/forum/${DEFAULT_FORUM_SLUG}`} replace />;
  }
  const slug: ForumCategorySlug = categorySlug;
  const meta = CATEGORY_META[slug];

  const [filter, setFilter] = useState<'latest' | 'viewed' | 'reviewed' | 'open'>('latest');
  const [q, setQ] = useState('');
  const searchQuery = useDeferredValue(q);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [stats, setStats] = useState<ForumStats | null>(null);
  const [items, setItems] = useState<ForumListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiFilter = filter === 'open' ? 'open' : 'answered';
  const apiSort = filter === 'viewed' ? 'views' : 'latest';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchForumStats().catch(() => ({} as ForumStats)),
        fetchForumQuestionList(slug, {
          page,
          limit: perPage,
          search: searchQuery,
          filter: apiFilter,
          sort: apiFilter === 'open' ? 'latest' : apiSort,
        }),
      ]);
      setStats(statsRes);
      setItems(listRes.items);
      setTotal(listRes.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [slug, page, searchQuery, apiFilter, apiSort]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const answeredCount = stats?.[slug]?.answered ?? meta.answeredCount;

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const topicRows = useMemo(() => RELATED_TOPIC_LINKS[slug], [slug]);

  return (
    <div className="forum-page">
      <Seo
        title={meta.pageTitle}
        description={meta.description}
        canonicalPath={seoPublicPath(`/forum/${slug}`)}
        keywords={forumCategoryKeywords(slug)}
        jsonLd={forumCategoryJsonLd(slug, meta.pageTitle, meta.description)}
      />
      <section className="forum-hero">
        <div className="forum-hero-inner">
          <nav className="forum-breadcrumb" aria-label="Breadcrumb">
            <Link to="/forum">Home</Link>
            <span className="forum-bc-sep">›</span>
            <Link to={`/forum/${slug}`}>Forum</Link>
            <span className="forum-bc-sep">›</span>
            <span>{meta.title}</span>
          </nav>
          <div className="forum-hero-grid">
            <div>
              <h1 className="forum-hero-title">{meta.pageTitle}</h1>
              <p className="forum-hero-desc">{meta.description}</p>
            </div>
            <div className="forum-stat-card">
              <div className="forum-stat-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.5 2 6 4.5 6 8c0 4 6 12 6 12s6-8 6-12c0-3.5-2.5-6-6-6z" />
                  <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="forum-stat-num">{answeredCount.toLocaleString()}</div>
              <div className="forum-stat-label">Questions answered (live)</div>
            </div>
          </div>
        </div>
      </section>

      <div className="forum-shell">
        <div className="forum-toolbar">
          <div className="forum-filters">
            {(
              [
                ['latest', 'Latest'],
                ['viewed', 'Most viewed'],
                ['reviewed', 'Doctor reviewed'],
                ['open', 'Needs answer'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`forum-pill ${filter === key ? 'is-active' : ''}`}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="forum-search">
            <FiSearch aria-hidden className="forum-search-icon" />
            <input
              type="search"
              placeholder={`Search ${meta.title.toLowerCase()} questions…`}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        {error ? (
          <p className="forum-api-error" style={{ color: '#b91c1c', margin: '0 0 16px' }}>
            {error}
          </p>
        ) : null}

        <div className="forum-layout">
          <div className="forum-main">
            {loading ? (
              <p className="forum-loading" style={{ color: '#64748b' }}>
                Loading questions…
              </p>
            ) : items.length === 0 ? (
              <div className="forum-empty-state">
                <div className="forum-empty-state-inner">
                  <div className="forum-empty-icon-wrap" aria-hidden>
                    <FaComments className="forum-empty-icon forum-empty-icon-back" />
                    <FaStethoscope className="forum-empty-icon forum-empty-icon-front" />
                  </div>
                  <h2 className="forum-empty-title">
                    {filter === 'open'
                      ? 'No open threads in this topic yet'
                      : 'Be the first published discussion here'}
                  </h2>
                  <p className="forum-empty-desc">
                    {filter === 'open'
                      ? 'When patients ask in this category and are waiting for a doctor, their questions will show under “Needs answer”.'
                      : 'Ask your health question and our verified doctors will post a reply. Once it’s published, it appears here for everyone — with view counts so the community can see what others are reading.'}
                  </p>
                  <div className="forum-empty-actions">
                    <Link to="/forum/ask" className="forum-empty-btn forum-empty-btn-primary">
                      Ask a question <FaArrowRight aria-hidden />
                    </Link>
                    {filter === 'open' ? (
                      <button
                        type="button"
                        className="forum-empty-btn forum-empty-btn-ghost"
                        onClick={() => {
                          setFilter('latest');
                          setPage(1);
                        }}
                      >
                        Show answered threads
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="forum-empty-btn forum-empty-btn-ghost"
                        onClick={() => {
                          setFilter('open');
                          setPage(1);
                        }}
                      >
                        See questions awaiting a doctor
                      </button>
                    )}
                  </div>
                  <p className="forum-empty-foot">
                    Tip: choose <strong>{meta.title}</strong> as the topic when you submit so your thread is grouped correctly.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="forum-card-list">
                {items.map((item) => (
                  <li key={item.slug} className="forum-q-card">
                    <div className="forum-q-card-top">
                      <div className="forum-q-meta">
                        <span className="forum-q-tag">{item.tag}</span>
                        <span className="forum-q-time">
                          <FiClock aria-hidden /> {formatShortAgo(item.createdAt)}
                        </span>
                      </div>
                      <span className="forum-q-badge">
                        <FiCheck aria-hidden />{' '}
                        {filter === 'open' ? 'Awaiting doctor' : 'Doctor answered'}
                      </span>
                    </div>
                    <Link to={forumQuestionPath(slug, item.slug)} className="forum-q-title forum-q-title--full">
                      {item.body || item.title}
                    </Link>
                    <div className="forum-q-footer">
                      <div className="forum-q-stats">
                        <span>
                          <FiMessageCircle aria-hidden />{' '}
                          {item.doctorCount} doctor{item.doctorCount !== 1 ? 's' : ''} · {item.answerCount}{' '}
                          repl{item.answerCount !== 1 ? 'ies' : 'y'}
                        </span>
                        <span>
                          <FiEye aria-hidden /> {(item.viewCount ?? 0).toLocaleString()} view
                          {(item.viewCount ?? 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="forum-q-actions">
                        <button type="button" className="forum-link-btn">
                          <FiBookmark aria-hidden /> Save
                        </button>
                        <button type="button" className="forum-link-btn">
                          <FiShare2 aria-hidden /> Share
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!loading && totalPages > 1 && (
              <nav className="forum-pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="forum-page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`forum-page-btn ${page === n ? 'is-active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="forum-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </nav>
            )}
          </div>

          <aside className="forum-aside">
            <div className="forum-cta-card">
              <div className="forum-cta-icon">?</div>
              <h3 className="forum-cta-title">Didn’t find your question?</h3>
              <p className="forum-cta-text">Ask our panel and get a verified medical perspective.</p>
              <Link to="/forum/ask" className="forum-cta-btn">
                Ask now
              </Link>
              <ul className="forum-cta-bullets">
                <li>
                  <FiCheck aria-hidden /> Free medical consultation
                </li>
                <li>
                  <FiCheck aria-hidden /> Expert verified answers
                </li>
                <li>
                  <FiCheck aria-hidden /> 100% confidential
                </li>
              </ul>
            </div>

            <div className="forum-side-card">
              <h4 className="forum-side-h">
                <FiLayers aria-hidden /> Related topics
              </h4>
              <ul className="forum-topic-list">
                {topicRows.map((row) => (
                  <li key={`${row.slug}-${row.label}`}>
                    <Link to={`/forum/${row.slug}`} className="forum-topic-row">
                      <div>
                        <div className="forum-topic-name">{row.label}</div>
                        <div className="forum-topic-count">
                          {(stats?.[row.slug]?.answered ?? 0).toLocaleString()} answered
                        </div>
                      </div>
                      <FiChevronRight aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="forum-side-card">
              <h4 className="forum-side-h">
                <FiUser aria-hidden /> Expert panel
              </h4>
              <ul className="forum-experts">
                {[
                  { name: 'Dr. Anjali Deshmukh', role: 'Endocrinologist', years: '18+ years' },
                  { name: 'Dr. Rohan Mehta', role: 'Diabetologist', years: '14+ years' },
                  { name: 'Dr. Priya Kulkarni', role: 'Lifestyle medicine', years: '11+ years' },
                ].map((ex) => (
                  <li key={ex.name} className="forum-expert-row">
                    <div className="forum-expert-avatar" aria-hidden />
                    <div>
                      <div className="forum-expert-name">{ex.name}</div>
                      <div className="forum-expert-role">{ex.role}</div>
                      <div className="forum-expert-years">{ex.years}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="forum-resources-card">
              <h4 className="forum-resources-h">
                <span className="forum-doc-icon" aria-hidden />
                Helpful resources
              </h4>
              <ul className="forum-resources-links">
                {HELPFUL_RESOURCE_LINKS[slug].map((r) => (
                  <li key={r.label}>
                    <Link to={`/forum/${r.slug}`}>{r.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
