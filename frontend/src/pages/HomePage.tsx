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
import { useAuthModal } from '../context/AuthModalContext';
import { useSession } from '../context/SessionContext';
import { seoConfig } from '../seo/seoConfig';
import { seoPublicPath } from '../seo/seoPaths';
import { Reveal } from '../components/Reveal';
import { fetchForumStats, fetchHomeFeed, type HomeFeedResponse } from '../lib/forumPublicApi';
import { forumPathForCategoryLabel } from '../lib/forumCategorySlug';
import { forumQuestionPath } from '../lib/questionSlug';
import {
  DEFAULT_FORUM_SLUG,
  FORUM_NAV_ITEMS,
  type ForumCategorySlug,
} from '../data/forumData';

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

const experts = [
  ['Dr. Rajesh Sharma', 'MD Ayurveda, Diabetes Specialist', '15+ Years Experience', 'BAMS, MD (Ayurveda)', 'Senior Consultant', '342 Answers'],
  ['Dr. Amit Patel', 'MD Ayurveda, Cardiac Care', '12+ Years Experience', 'BAMS, MD (Kayachikitsa)', 'Lead Physician', '278 Answers'],
  ['Dr. Priya Mehta', 'MD Ayurveda, Metabolic Health', '10+ Years Experience', 'BAMS, MD (Panchakarma)', 'Specialist Consultant', '195 Answers'],
] as const;

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

const FALLBACK_TRENDING: TrendItem[] = [
  {
    id: 'diabetes',
    category: 'Diabetes',
    status: 'answered',
    title: 'Can Ayurveda cure Type 2 Diabetes completely?',
    body: 'I am 45 years old with Type 2 Diabetes for the past 3 years. Can I switch to Ayurvedic treatment and achieve complete cure?',
    excerpt:
      'I am 45 years old with Type 2 Diabetes for the past 3 years. Can I switch to Ayurvedic treatment and achieve complete cure?',
    views: 2847,
    answers: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    questionHref: '/forum/ask',
  },
  {
    id: 'bp',
    category: 'Blood Pressure',
    status: 'answered',
    title: 'What lifestyle changes help reduce high blood pressure naturally?',
    body: 'My BP readings are 150/95. Doctor suggested medication but I want to try natural methods first.',
    excerpt:
      'My BP readings are 150/95. Doctor suggested medication but I want to try natural methods first.',
    views: 1923,
    answers: 2,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    questionHref: '/forum/ask',
  },
  {
    id: 'weight',
    category: 'Weight Management',
    status: 'answered',
    title: 'Best Ayurvedic herbs for weight loss and metabolism boost?',
    body: 'I am overweight with slow metabolism. Which Ayurvedic herbs are scientifically proven to help with weight management and are safe for long-term use?',
    excerpt:
      'I am overweight with slow metabolism. Which Ayurvedic herbs are scientifically proven to help with weight management and are safe for long-term use?',
    views: 1654,
    answers: 4,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    questionHref: '/forum/ask',
  },
  {
    id: 'heart',
    category: 'Heart Health',
    status: 'pending',
    title: 'Can Ayurveda help with high cholesterol levels?',
    body: 'My cholesterol is 240 mg/dL. Are there effective Ayurvedic treatments to lower cholesterol without side effects?',
    excerpt:
      'My cholesterol is 240 mg/dL. Are there effective Ayurvedic treatments to lower cholesterol without side effects?',
    views: 892,
    answers: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    questionHref: '/forum/ask',
  },
];

const FALLBACK_RECENT: RecentItem[] = [
  {
    id: 'r1',
    category: 'Diabetes',
    categorySlug: 'diabetes-management',
    questionSlug: null,
    title: 'Is fasting beneficial for diabetes management?',
    body: 'Is intermittent fasting safe and beneficial for managing Type 2 diabetes, and what precautions should I take?',
    excerpt:
      'Intermittent fasting can help improve insulin sensitivity when done correctly under medical supervision. Treatment effectiveness varies depending on age, lifestyle, and medical reports...',
    views: 456,
    answeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    doctor: { name: 'Dr. Rajesh Sharma', titles: 'MD Ayurveda' },
  },
  {
    id: 'r2',
    category: 'Weight Management',
    categorySlug: 'obesity-metabolic-health',
    questionSlug: null,
    title: 'Which yoga asanas are best for weight loss?',
    body: 'Which yoga asanas are most effective for weight loss when combined with Ayurvedic diet, and how often should they be practiced?',
    excerpt:
      'Surya Namaskar, Dhanurasana, and Bhujangasana are effective for metabolism boost. Personalized assessment is recommended before starting any treatment...',
    views: 328,
    answeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    doctor: { name: 'Dr. Priya Mehta', titles: 'MD Ayurveda' },
  },
  {
    id: 'r3',
    category: 'Blood Pressure',
    categorySlug: 'hypertension-high-blood-pressure',
    questionSlug: null,
    title: 'Can stress cause high blood pressure?',
    body: 'Can chronic work stress alone cause sustained high blood pressure, and what Ayurvedic approaches help manage stress-related hypertension?',
    excerpt:
      'Chronic stress significantly impacts cardiovascular health and can elevate blood pressure. Ayurvedic stress management through meditation and pranayama shows effectiveness...',
    views: 612,
    answeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    doctor: { name: 'Dr. Amit Patel', titles: 'MD Ayurveda' },
  },
  {
    id: 'r4',
    category: 'Heart Health',
    categorySlug: 'heart-disease-heart-blockage',
    questionSlug: null,
    title: 'What is the ideal diet for heart patients?',
    body: 'What is an ideal Ayurvedic diet pattern for someone recovering from mild heart blockage, including foods to emphasize and avoid?',
    excerpt:
      'Heart-healthy diet in Ayurveda focuses on light, easily digestible foods with minimal salt and saturated fats. Individual health conditions must be evaluated...',
    views: 789,
    answeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    doctor: { name: 'Dr. Rajesh Sharma', titles: 'MD Ayurveda' },
  },
];

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

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchHomeFeed(), fetchForumStats()]).then((results) => {
      if (!alive) return;
      const [feedResult, statsResult] = results;
      if (feedResult.status === 'fulfilled') {
        setHomeFeed(feedResult.value);
        setHomeFeedFailed(false);
      } else {
        setHomeFeedFailed(true);
      }
      if (statsResult.status === 'fulfilled') {
        const merged: Record<string, number> = {};
        for (const [slug, counts] of Object.entries(statsResult.value)) {
          merged[slug] = counts.answered + counts.open;
        }
        setTopicCounts(merged);
      }
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
    if (homeFeedFailed) return FALLBACK_TRENDING;
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

  const quickAnswer = homeFeedFailed ? null : homeFeed?.quickAnswer ?? null;
  const recentItems = useMemo<RecentItem[]>(
    () => (homeFeedFailed ? FALLBACK_RECENT : homeFeed?.recentlyAnswered ?? []),
    [homeFeed, homeFeedFailed],
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
        title="Ask Doctors Health Questions — Diabetes, Heart, BP & More"
        description={seoConfig.defaultDescription}
        canonicalPath={seoPublicPath('/forum')}
        keywords="health forum India, ask doctor online, diabetes questions, heart health advice, medical Q&A, Madhavbaug"
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
                        ? `${count.toLocaleString()} Questions`
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
            <p className="qa-sub">Medically verified • Structured for voice assistants</p>
            <div className="qa-body">
              <p className="qa-title">Direct Answer</p>
              <h4>
                {quickAnswer?.answerSnippet ||
                  (!homeFeed && !homeFeedFailed
                    ? 'Loading reviewed answer...'
                    : 'No reviewed answer is published yet. Ask a question to start the discussion.') ||
                  'Ayurveda may help manage diabetes by improving metabolism and insulin sensitivity under medical supervision.'}
              </h4>
              <p className="qa-title">Explanation</p>
              <p>
                Treatment effectiveness varies depending on age, lifestyle, and medical reports. Ayurvedic approaches focus on balancing doshas.
              </p>
              <p className="qa-title warning">Suitability</p>
              <p>
                Personalized assessment is recommended before starting any treatment. Individual conditions and current
                medications should be evaluated by qualified practitioners.
              </p>
              <div className="reviewer">
                <span className="doc-avatar" />
                <div>
                  <strong>Reviewed by {quickAnswer?.reviewedBy?.name ?? 'Verified Doctor'}</strong>
                  <p>
                    {quickAnswer?.reviewedBy?.titles ??
                      'MD Ayurveda, 15+ years experience'}
                  </p>
                </div>
                <small>
                  Reviewed on
                  <br />
                  {new Date(quickAnswer?.reviewedAt ?? Date.now()).toLocaleDateString()}
                </small>
              </div>
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
          <div className="expert-grid">
            {experts.map((e, idx) => (
              <article className="expert-card" key={e[0]}>
                <div className={`expert-avatar a${idx + 1}`} />
                <h4>{e[0]}</h4>
                <p className="sub">{e[1]}</p>
                <span className="pill">{e[2]}</span>
                <p>{e[3]}</p>
                <p>{e[4]}</p>
                <p>{e[5]}</p>
                <div className="badge">Reviewed Answer Badge</div>
              </article>
            ))}
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
