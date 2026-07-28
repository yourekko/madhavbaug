import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaChevronDown,
  FaCircleCheck,
  FaClock,
  FaCommentDots,
  FaEye,
  FaHeartPulse,
  FaLeaf,
  FaLock,
  FaPhone,
  FaShieldHeart,
  FaStethoscope,
  FaWeightScale,
} from 'react-icons/fa6';
import { MdBloodtype } from 'react-icons/md';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { useAuthModal } from '../context/AuthModalContext';
import { useSession } from '../context/SessionContext';
import { fetchForumStats, fetchHomeFeed, type HomeFeedResponse } from '../lib/forumPublicApi';
import { fetchPublicPageSeo, type PublicPageSeo } from '../lib/publicSeoApi';
import { forumPathForCategoryLabel } from '../lib/forumCategorySlug';
import { forumQuestionPath } from '../lib/questionSlug';
import {
  DEFAULT_FORUM_SLUG,
  FORUM_NAV_ITEMS,
  type ForumCategorySlug,
} from '../data/forumData';
import { seoConfig } from '../seo/seoConfig';
import { seoPublicPath } from '../seo/seoPaths';

const TOPIC_CARD_META: Record<
  ForumCategorySlug,
  { shortTitle: string; description: string; icon: ReactNode }
> = {
  'diabetes-management': {
    shortTitle: 'Diabetes Management',
    description: 'Blood sugar control, diet plans, lifestyle modifications',
    icon: <MdBloodtype />,
  },
  'heart-disease-heart-blockage': {
    shortTitle: 'Heart Disease & Blockage',
    description: 'Cardiac care, cholesterol, heart disease prevention',
    icon: <FaHeartPulse />,
  },
  'hypertension-high-blood-pressure': {
    shortTitle: 'Hypertension',
    description: 'Hypertension management, BP control strategies',
    icon: <FaCircleCheck />,
  },
  'obesity-metabolic-health': {
    shortTitle: 'Obesity & Metabolic Health',
    description: 'Obesity treatment, healthy weight loss, metabolism',
    icon: <FaWeightScale />,
  },
  'lifestyle-disorders-preventive': {
    shortTitle: 'Lifestyle & Prevention',
    description: 'Daily routines, stress management, preventive health',
    icon: <FaLeaf />,
  },
};

type TrendTab = 'latest' | 'mostViewed' | 'doctorAnswered';

type TrendItem = {
  id: string;
  category: string;
  status: 'answered' | 'pending';
  title: string;
  /** Full question copy (preferred for display). */
  body: string;
  excerpt: string;
  views: number;
  answers: number;
  createdAt: string;
  questionHref: string;
};

type RecentItem = HomeFeedResponse['recentlyAnswered'][number];

function formatDaysAgo(n: number) {
  if (n <= 0) return 'today';
  if (n === 1) return '1 day ago';
  return `${n} days ago`;
}

function daysAgoFromIso(dateIso: string) {
  const d = new Date(dateIso).getTime();
  if (Number.isNaN(d)) return 0;
  const diff = Date.now() - d;
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function getCategoryTagClass(category: string): '' | 'blue' | 'orange' | 'red' {
  const c = category.toLowerCase();
  if (c.includes('blood')) return 'blue';
  if (c.includes('weight') || c.includes('lifestyle')) return 'orange';
  if (c.includes('heart')) return 'red';
  return '';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { openAuth } = useAuthModal();
  const { user } = useSession();
  const isDoctor = user?.role === 'doctor';
  const [trendTab, setTrendTab] = useState<TrendTab>('latest');
  const [heroQuestion, setHeroQuestion] = useState('');
  const [heroQError, setHeroQError] = useState(false);
  const [homeFeed, setHomeFeed] = useState<HomeFeedResponse | null>(null);
  const [homeFeedFailed, setHomeFeedFailed] = useState(false);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [pageSeo, setPageSeo] = useState<PublicPageSeo | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchHomeFeed(), fetchForumStats(), fetchPublicPageSeo('home')]).then((results) => {
      if (!alive) return;
      const [feedResult, statsResult, seoResult] = results;
      if (feedResult.status === 'fulfilled') {
        setHomeFeed(feedResult.value);
        setHomeFeedFailed(false);
      } else {
        setHomeFeedFailed(true);
      }
      if (statsResult.status === 'fulfilled') {
        const merged: Record<string, number> = {};
        for (const [slug, counts] of Object.entries(statsResult.value)) {
          // Match category pages: show published (answered) question count only.
          merged[slug] = counts.answered;
        }
        setTopicCounts(merged);
      }
      if (seoResult.status === 'fulfilled') setPageSeo(seoResult.value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const trendSubtitle = useMemo(() => {
    if (trendTab === 'latest') return 'Newest questions from the community';
    if (trendTab === 'mostViewed') return 'Most viewed health questions this week';
    return 'Questions with verified doctor responses';
  }, [trendTab]);

  const trendingItems = useMemo<TrendItem[]>(() => {
    if (!homeFeed) return [];
    return homeFeed.trending.map((item) => ({
      id: item.id,
      category: item.category,
      status: item.status,
      title: item.title,
      body: item.body ?? item.excerpt,
      excerpt: item.excerpt,
      views: item.views,
      answers: item.answers,
      createdAt: item.createdAt,
      questionHref:
        item.questionSlug && item.categorySlug
          ? forumQuestionPath(item.categorySlug, item.questionSlug)
          : '/forum/ask',
    }));
  }, [homeFeed]);

  const orderedTrending = useMemo(() => {
    const list = [...trendingItems];
    if (trendTab === 'latest') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (trendTab === 'mostViewed') {
      return list.sort((a, b) => b.views - a.views);
    }
    return list.filter((q) => q.status === 'answered');
  }, [trendTab, trendingItems]);

  const quickAnswer = homeFeed?.quickAnswer ?? null;
  const recentItems = useMemo<RecentItem[]>(
    () => homeFeed?.recentlyAnswered ?? [],
    [homeFeed],
  );

  function openAuthFromHero() {
    const q = heroQuestion.trim();
    if (!q) {
      setHeroQError(true);
      return;
    }
    setHeroQError(false);
    openAuth({
      defaultTab: 'signup',
      variant: 'ask',
      onSuccess: () => navigate('/forum/ask', { state: { draftQuestion: q } }),
    });
  }

  return (
    <>
      <Seo
        title={pageSeo?.title || 'Ask Doctors Health Questions — Diabetes, Heart, BP & More'}
        description={pageSeo?.metaDescription || seoConfig.defaultDescription}
        canonicalPath={seoPublicPath('/forum')}
        keywords={pageSeo?.keywords || 'health forum India, ask doctor online, diabetes questions, heart health advice, medical Q&A, Madhavbaug'}
        ogTitle={pageSeo?.ogTitle || undefined}
        ogDescription={pageSeo?.ogDescription || undefined}
        robots={pageSeo?.robots}
      />
      <Reveal as="section" className="hero hero-reveal">
        <div className="content-wrap">
          <h2>Ask a Health Question</h2>
          <p>Get medically verified answers from experienced Ayurvedic doctors</p>
          <div className={`search-box ${heroQError ? 'search-box-error' : ''}`}>
            <input
              placeholder="Type your health question here..."
              value={heroQuestion}
              onChange={(e) => {
                setHeroQuestion(e.target.value);
                if (heroQError) setHeroQError(false);
              }}
              aria-invalid={heroQError}
              aria-describedby={heroQError ? 'hero-q-error' : undefined}
            />
            <button type="button" className="search-cta" onClick={openAuthFromHero}>
              Ask Question
            </button>
          </div>
          {heroQError && (
            <p id="hero-q-error" className="hero-q-error" role="alert">
              Please enter your question first, then continue.
            </p>
          )}
          <div className="hero-note">
            <span>
              <FaCircleCheck /> Doctor-Reviewed Information
            </span>
            <span>
              <FaStethoscope /> Your identity stays private
            </span>
            <span>
              <FaLock /> Sign in to submit your question
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section section-topics reveal-stagger-topics">
        <div className="content-wrap">
          <div className="section-head section-head-reveal">
            <h3>Browse by Health Topics</h3>
            <Link to={`/forum/${DEFAULT_FORUM_SLUG}`}>View All Categories</Link>
          </div>
          <div className="topic-grid">
            {FORUM_NAV_ITEMS.map((item) => {
              const meta = TOPIC_CARD_META[item.slug];
              const count = topicCounts[item.slug];
              return (
                <Link key={item.slug} to={`/forum/${item.slug}`} className="topic-card">
                  <div className="topic-icon">{meta.icon}</div>
                  <h4>{meta.shortTitle}</h4>
                  <p>{meta.description}</p>
                  <div className="topic-meta">
                    <span>
                      {typeof count === 'number'
                        ? `${count.toLocaleString()} answered`
                        : 'Browse questions'}
                    </span>
                    <FaArrowRight />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section section-qa">
        <div className="content-wrap">
          <div className="quick-answer qa-reveal-inner">
            <h3>
              <span className="qa-icon">?</span> Quick Medical Answer
            </h3>
            <p className="qa-sub">Medically verified • From published doctor replies</p>
            <div className="qa-body">
              {!quickAnswer ? (
                <>
                  <h4>
                    {!homeFeed && !homeFeedFailed
                      ? 'Loading reviewed answer…'
                      : 'No reviewed answer is published yet.'}
                  </h4>
                  <p>
                    Once a doctor publishes an answer on the forum, a featured reply will appear here. You can also{' '}
                    <Link to="/forum/ask">ask a question</Link> for a personal response.
                  </p>
                </>
              ) : (
                <>
                  <p className="qa-title">Direct Answer</p>
                  <h4>{quickAnswer.answerSnippet}</h4>
                  <div className="reviewer">
                    <span className="doc-avatar" />
                    <div>
                      <strong>Reviewed by {quickAnswer.reviewedBy?.name ?? 'Verified Doctor'}</strong>
                      <p>{quickAnswer.reviewedBy?.titles ?? 'Medical reviewer'}</p>
                    </div>
                    <small>
                      Reviewed on
                      <br />
                      {new Date(quickAnswer.reviewedAt).toLocaleDateString()}
                    </small>
                  </div>
                </>
              )}
            </div>
            <div className="qa-footer">
              <span>
                <FaStethoscope /> Based on clinical principles
              </span>
              <span>
                <FaShieldHeart /> Evidence indicator
              </span>
              {quickAnswer?.questionSlug && quickAnswer?.categorySlug ? (
                <Link to={forumQuestionPath(quickAnswer.categorySlug, quickAnswer.questionSlug)}>
                  Expand full explanation <FaChevronDown />
                </Link>
              ) : (
                <Link to="/forum/ask">
                  Ask a related question <FaChevronDown />
                </Link>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section trend-section">
        <div className="content-wrap">
          <div className="section-head trend-head trend-head-reveal">
            <div>
              <h3>Trending Questions</h3>
              <p className="trend-sub">{trendSubtitle}</p>
            </div>
            <div className="tabs" role="tablist" aria-label="Trending filters">
              {(
                [
                  ['latest', 'Latest'],
                  ['mostViewed', 'Most Viewed'],
                  ['doctorAnswered', 'Doctor Answered'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={trendTab === key}
                  className={trendTab === key ? 'active' : ''}
                  onClick={() => setTrendTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="trend-list" key={trendTab}>
            {orderedTrending.map((item, index) => (
              <article key={item.id} className="trend-card" style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="trend-top">
                  <Link
                    to={forumPathForCategoryLabel(item.category)}
                    className={`tag tag-link ${getCategoryTagClass(item.category)}`.trim()}
                  >
                    {item.category}
                  </Link>
                  {item.status === 'answered' ? (
                    <span className="status">
                      <FaCircleCheck aria-hidden /> Doctor Answered
                    </span>
                  ) : (
                    <span className="status pending">Pending Answer</span>
                  )}
                </div>
                <h4 className="trend-q-body">{item.body || item.title}</h4>
                <div className="trend-bottom">
                  <span className="trend-stats">
                    <FaEye aria-hidden /> {item.views.toLocaleString()} views
                    <FaCommentDots aria-hidden /> {item.answers} {item.answers === 1 ? 'answer' : 'answers'}
                    <FaClock aria-hidden /> {formatDaysAgo(daysAgoFromIso(item.createdAt))}
                  </span>
                  {item.status === 'pending' ? (
                    isDoctor ? (
                      <Link to="/forum/doctor/panel" className="answer-btn answer-btn-link">
                        Answer Question
                      </Link>
                    ) : (
                      <Link to={item.questionHref} className="answer-btn answer-btn-link">
                        View Question
                      </Link>
                    )
                  ) : (
                    <Link to={item.questionHref} className="answer-btn answer-btn-link">
                      Read Full Answer
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {!homeFeedFailed && homeFeed && orderedTrending.length === 0 && (
              <article className="trend-card">
                <h4>No community questions yet</h4>
                <p>Once patients post questions, trending discussions will appear here automatically.</p>
              </article>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section lightband reveal-stagger-experts">
        <div className="content-wrap">
          <h3 className="center-title title-reveal">Our Medical Experts</h3>
          <p className="muted" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 1.5rem' }}>
            Questions are answered by licensed Madhavbaug clinicians. Names and credentials appear on each published
            reply — placeholder doctor cards are not shown here.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link to={`/forum/${DEFAULT_FORUM_SLUG}`}>
              Browse doctor answers <FaArrowRight />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section section-recent reveal-stagger-recent">
        <div className="content-wrap">
          <div className="section-head recent-head-reveal">
            <h3>Recently Answered</h3>
            <Link to={`/forum/${DEFAULT_FORUM_SLUG}`}>
              View All Answers <FaArrowRight />
            </Link>
          </div>
          <p className="muted">Latest doctor-verified responses</p>
          <div className="recent-grid">
            {recentItems.map((r, idx) => (
              <article className="recent-card" key={idx}>
                <div className="recent-top">
                  <span className={`doc-avatar a${(idx % 3) + 1}`} />
                  <div>
                    <strong>{r.doctor?.name ?? 'Verified doctor'}</strong>
                    <p>{`${r.doctor?.titles ?? 'Medical reviewer'} • ${formatDaysAgo(daysAgoFromIso(r.answeredAt))}`}</p>
                  </div>
                  <span className="verified">Verified</span>
                </div>
                <h4 className="trend-q-body">{r.body ?? r.title}</h4>
                <div className="recent-bottom">
                  <span>
                    <Link to={forumPathForCategoryLabel(r.category)} className="tag-link">
                      {r.category}
                    </Link>{' '}
                    • <FaEye /> {r.views.toLocaleString()}
                  </span>
                  <Link
                    to={
                      r.questionSlug && r.categorySlug
                        ? forumQuestionPath(r.categorySlug, r.questionSlug)
                        : forumPathForCategoryLabel(r.category)
                    }
                  >
                    Read Full Answer
                  </Link>
                </div>
              </article>
            ))}
            {!homeFeedFailed && homeFeed && recentItems.length === 0 && (
              <article className="recent-card">
                <h4>No doctor answers yet</h4>
                <p>Recently answered discussions will show up here once responses are published.</p>
              </article>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="disclaimer">
        <div className="content-wrap disclaimer-inner">
          <h4>Medical Disclaimer</h4>
          <p>
            The information provided on this forum is for educational purposes only and should not be considered as medical advice. Always consult with qualified healthcare professionals before making any health decisions or starting new treatments.
          </p>
          <div className="disc-points">
            <span>
              <FaCircleCheck /> Doctor-reviewed content
            </span>
            <span>
              <FaCircleCheck /> Evidence-based information
            </span>
            <span>
              <FaCircleCheck /> Not a substitute for professional care
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="cta">
        <div className="content-wrap center cta-inner">
          <h3>Need Personalized Medical Guidance?</h3>
          <p>Book a confidential consultation with our experienced Ayurvedic doctors</p>
          <div className="cta-actions">
            <button type="button" className="primary">
              Book Consultation Now
            </button>
            <button type="button" className="secondary">
              Learn More
            </button>
          </div>
          <div className="cta-points">
            <span>
              <FaShieldHeart /> Safe & Confidential
            </span>
            <span>
              <FaStethoscope /> Experienced Doctors
            </span>
            <span>
              <FaPhone /> Quick Response
            </span>
          </div>
        </div>
      </Reveal>
    </>
  );
}
