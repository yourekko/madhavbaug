import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiRequest } from '../../lib/api';

export type HubSeoPage = {
  slug: string;
  pageType: string;
  label: string;
  publicPath: string;
  publicUrl: string;
  isCustom: boolean;
  title: string;
  metaDescription: string;
  robots: string;
  focusKeyword: string;
  keywords: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string;
  updatedAt: string | null;
  defaults: {
    title: string;
    metaDescription: string;
    focusKeyword: string;
    keywords: string;
  };
};

export type QuestionSeoRow = {
  questionId: string;
  forumSlug: string | null;
  category: string;
  categorySlug: string | null;
  questionPreview: string;
  answerCount: number;
  doctorName: string | null;
  publicPath: string | null;
  publicUrl: string | null;
  inSitemap: boolean;
  autoTitle: string;
  autoDescription: string;
  seo: {
    title: string;
    metaDescription: string | null;
    robots: string;
    focusKeyword?: string | null;
    keywords?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    canonicalUrl?: string | null;
    internalLinks?: string[];
    updatedAt: string | null;
    isCustom: boolean;
  };
};

type SeoForm = {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  robots: string;
  internalLinks: string;
};

type Props = {
  token: string;
  onError: (msg: string | null) => void;
};

function charHint(len: number, idealMin: number, idealMax: number, hardMax: number) {
  const tone = len === 0 ? 'empty' : len < idealMin ? 'short' : len <= idealMax ? 'good' : len <= hardMax ? 'long' : 'over';
  return { len, tone, label: `${len}/${hardMax}` };
}

function scoreSeo(form: SeoForm): { score: number; checks: { ok: boolean; label: string }[] } {
  const titleLen = form.title.trim().length;
  const descLen = form.metaDescription.trim().length;
  const focus = form.focusKeyword.trim().toLowerCase();
  const titleL = form.title.toLowerCase();
  const descL = form.metaDescription.toLowerCase();

  const checks = [
    { ok: titleLen >= 30 && titleLen <= 60, label: 'Title length 30–60 characters' },
    { ok: descLen >= 120 && descLen <= 160, label: 'Meta description 120–160 characters' },
    { ok: Boolean(focus), label: 'Focus keyword set' },
    { ok: !focus || titleL.includes(focus), label: 'Focus keyword in title' },
    { ok: !focus || descL.includes(focus), label: 'Focus keyword in meta description' },
    { ok: form.keywords.trim().split(',').filter(Boolean).length >= 2, label: 'At least 2 keywords' },
    {
      ok: form.internalLinks
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .every((x) => x.startsWith('/forum/')),
      label: 'Internal links are /forum/… paths (if any)',
    },
    { ok: Boolean(form.robots.trim()), label: 'Robots directive set' },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}

function emptyForm(): SeoForm {
  return {
    title: '',
    metaDescription: '',
    focusKeyword: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    robots: 'index,follow',
    internalLinks: '',
  };
}

function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayUrl = url.replace(/^https?:\/\//, '');
  return (
    <div className="admin-serp-preview" aria-label="Google-style search preview">
      <div className="admin-serp-url">{displayUrl || 'madhavbaug.org/forum/…'}</div>
      <div className="admin-serp-title">{title.trim() || 'Page title preview'}</div>
      <div className="admin-serp-desc">{description.trim() || 'Meta description preview appears here.'}</div>
    </div>
  );
}

export function AdminSeoWorkspace({ token, onError }: Props) {
  const [tab, setTab] = useState<'hubs' | 'qa'>('hubs');
  const [hubs, setHubs] = useState<HubSeoPage[]>([]);
  const [qaRows, setQaRows] = useState<QuestionSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedHubSlug, setSelectedHubSlug] = useState<string>('home');
  const [selectedQaId, setSelectedQaId] = useState<string | null>(null);
  const [qaSearch, setQaSearch] = useState('');
  const [qaFilter, setQaFilter] = useState<'all' | 'custom' | 'auto' | 'missing-kw'>('all');
  const [form, setForm] = useState<SeoForm>(emptyForm());

  const load = async () => {
    setLoading(true);
    try {
      onError(null);
      const [hubList, questions] = await Promise.all([
        apiRequest<HubSeoPage[]>('/admin/seo/hubs', {}, token),
        apiRequest<QuestionSeoRow[]>('/admin/seo/questions', {}, token),
      ]);
      setHubs(hubList);
      setQaRows(questions);
      if (!hubList.some((h) => h.slug === selectedHubSlug) && hubList[0]) {
        setSelectedHubSlug(hubList[0].slug);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not load SEO data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (tab === 'qa' && !selectedQaId && qaRows[0]) {
      setSelectedQaId(qaRows[0].questionId);
    }
  }, [tab, selectedQaId, qaRows]);

  const selectedHub = hubs.find((h) => h.slug === selectedHubSlug) ?? null;
  const selectedQa = qaRows.find((r) => r.questionId === selectedQaId) ?? null;

  useEffect(() => {
    if (tab !== 'hubs' || !selectedHub) return;
    setForm({
      title: selectedHub.title,
      metaDescription: selectedHub.metaDescription,
      focusKeyword: selectedHub.focusKeyword,
      keywords: selectedHub.keywords,
      ogTitle: selectedHub.ogTitle ?? '',
      ogDescription: selectedHub.ogDescription ?? '',
      robots: selectedHub.robots || 'index,follow',
      internalLinks: '',
    });
  }, [tab, selectedHubSlug, selectedHub?.updatedAt, selectedHub?.title]);

  useEffect(() => {
    if (tab !== 'qa' || !selectedQa) return;
    setForm({
      title: selectedQa.seo.title,
      metaDescription: selectedQa.seo.metaDescription ?? '',
      focusKeyword: selectedQa.seo.focusKeyword ?? '',
      keywords: selectedQa.seo.keywords ?? '',
      ogTitle: selectedQa.seo.ogTitle ?? '',
      ogDescription: selectedQa.seo.ogDescription ?? '',
      robots: selectedQa.seo.robots || 'index,follow',
      internalLinks: (selectedQa.seo.internalLinks ?? []).join('\n'),
    });
  }, [tab, selectedQaId, selectedQa?.seo.updatedAt, selectedQa?.seo.title]);

  const filteredQa = useMemo(() => {
    const q = qaSearch.trim().toLowerCase();
    return qaRows.filter((row) => {
      if (qaFilter === 'custom' && !row.seo.isCustom) return false;
      if (qaFilter === 'auto' && row.seo.isCustom) return false;
      if (qaFilter === 'missing-kw' && row.seo.focusKeyword?.trim()) return false;
      if (!q) return true;
      return (
        row.questionPreview.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        (row.doctorName ?? '').toLowerCase().includes(q) ||
        (row.seo.title ?? '').toLowerCase().includes(q)
      );
    });
  }, [qaRows, qaSearch, qaFilter]);

  const { score, checks } = useMemo(() => scoreSeo(form), [form]);
  const titleHint = charHint(form.title.length, 30, 60, 180);
  const descHint = charHint(form.metaDescription.length, 120, 160, 320);
  const previewUrl =
    tab === 'hubs'
      ? selectedHub?.publicUrl ?? 'https://madhavbaug.org/forum'
      : selectedQa?.publicUrl ?? 'https://madhavbaug.org/forum';

  function patchForm(partial: Partial<SeoForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  async function saveHub() {
    if (!selectedHub) return;
    setSaving(true);
    try {
      onError(null);
      await apiRequest(
        `/admin/seo/pages/${selectedHub.slug}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            pageType: selectedHub.pageType,
            title: form.title.trim(),
            metaDescription: form.metaDescription.trim(),
            focusKeyword: form.focusKeyword.trim(),
            keywords: form.keywords.trim(),
            ogTitle: form.ogTitle.trim(),
            ogDescription: form.ogDescription.trim(),
            robots: form.robots.trim() || 'index,follow',
            canonicalUrl: selectedHub.canonicalUrl,
          }),
        },
        token,
      );
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save hub SEO.');
    } finally {
      setSaving(false);
    }
  }

  async function saveQa() {
    if (!selectedQa) return;
    setSaving(true);
    try {
      onError(null);
      const internalLinks = form.internalLinks
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter((x) => x.startsWith('/forum/'));
      await apiRequest(
        `/admin/seo/questions/${selectedQa.questionId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title.trim(),
            metaDescription: form.metaDescription.trim(),
            focusKeyword: form.focusKeyword.trim(),
            keywords: form.keywords.trim(),
            ogTitle: form.ogTitle.trim(),
            ogDescription: form.ogDescription.trim(),
            robots: form.robots.trim() || 'index,follow',
            internalLinks,
          }),
        },
        token,
      );
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save Q&A SEO.');
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    if (tab === 'hubs' && selectedHub) {
      setForm({
        title: selectedHub.defaults.title,
        metaDescription: selectedHub.defaults.metaDescription,
        focusKeyword: selectedHub.defaults.focusKeyword,
        keywords: selectedHub.defaults.keywords,
        ogTitle: '',
        ogDescription: '',
        robots: 'index,follow',
        internalLinks: '',
      });
      return;
    }
    if (tab === 'qa' && selectedQa) {
      setForm({
        title: selectedQa.autoTitle,
        metaDescription: selectedQa.autoDescription,
        focusKeyword: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        robots: 'index,follow',
        internalLinks: '',
      });
    }
  }

  if (loading) {
    return (
      <section className="admin-panel">
        <p className="admin-panel-lead">Loading SEO workspace…</p>
      </section>
    );
  }

  return (
    <div className="admin-seo-workspace">
      <section className="admin-panel admin-panel--seo">
        <div className="admin-seo-workspace-head">
          <div>
            <h2 className="admin-panel-title">SEO workspace</h2>
            <p className="admin-panel-lead">
              Built for SEO editors: SERP preview, focus keyword checks, Open Graph, robots, and internal linking across
              hub pages and every published answer.
            </p>
          </div>
          <div className="admin-seo-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'hubs'}
              className={`admin-seo-tab${tab === 'hubs' ? ' is-active' : ''}`}
              onClick={() => setTab('hubs')}
            >
              Hub pages ({hubs.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'qa'}
              className={`admin-seo-tab${tab === 'qa' ? ' is-active' : ''}`}
              onClick={() => setTab('qa')}
            >
              Q&amp;A answers ({qaRows.length})
            </button>
          </div>
        </div>
        <p className="admin-panel-lead">
          Live sitemap:{' '}
          <a href={`${API_BASE_URL}/public/forum/sitemap.xml`} target="_blank" rel="noreferrer">
            sitemap.xml
          </a>
        </p>
      </section>

      <div className="admin-seo-layout">
        <aside className="admin-seo-list admin-panel">
          {tab === 'hubs' ? (
            <ul className="admin-seo-nav">
              {hubs.map((hub) => (
                <li key={hub.slug}>
                  <button
                    type="button"
                    className={`admin-seo-nav-item${selectedHubSlug === hub.slug ? ' is-active' : ''}`}
                    onClick={() => setSelectedHubSlug(hub.slug)}
                  >
                    <strong>{hub.label}</strong>
                    <span>{hub.isCustom ? 'Custom' : 'Defaults'} · {hub.publicPath}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="admin-seo-list-tools">
                <input
                  className="admin-input"
                  placeholder="Search questions, category, doctor…"
                  value={qaSearch}
                  onChange={(e) => setQaSearch(e.target.value)}
                />
                <select
                  className="admin-select"
                  value={qaFilter}
                  onChange={(e) => setQaFilter(e.target.value as typeof qaFilter)}
                >
                  <option value="all">All answers</option>
                  <option value="custom">Custom SEO only</option>
                  <option value="auto">Auto SEO only</option>
                  <option value="missing-kw">Missing focus keyword</option>
                </select>
              </div>
              <ul className="admin-seo-nav">
                {filteredQa.length === 0 ? (
                  <li className="admin-td-muted" style={{ padding: 12 }}>
                    No matching Q&amp;A pages.
                  </li>
                ) : (
                  filteredQa.map((row) => (
                    <li key={row.questionId}>
                      <button
                        type="button"
                        className={`admin-seo-nav-item${selectedQaId === row.questionId ? ' is-active' : ''}`}
                        onClick={() => setSelectedQaId(row.questionId)}
                      >
                        <strong>{row.questionPreview}</strong>
                        <span>
                          {row.seo.isCustom ? 'Custom' : 'Auto'}
                          {row.seo.focusKeyword ? ` · ${row.seo.focusKeyword}` : ' · no focus kw'}
                          {row.inSitemap ? ' · sitemap' : ''}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </aside>

        <section className="admin-panel admin-seo-editor">
          {(tab === 'hubs' && !selectedHub) || (tab === 'qa' && !selectedQa) ? (
            <p className="admin-panel-lead">
              {tab === 'qa' ? 'Select a published answer on the left to edit its SEO.' : 'Select a hub page.'}
            </p>
          ) : (
            <>
              <div className="admin-seo-editor-top">
                <div>
                  <h3 className="admin-panel-title" style={{ marginBottom: 4 }}>
                    {tab === 'hubs' ? selectedHub!.label : 'Q&A page SEO'}
                  </h3>
                  <p className="admin-td-muted">
                    {tab === 'hubs' ? (
                      <a href={selectedHub!.publicUrl} target="_blank" rel="noreferrer">
                        {selectedHub!.publicUrl}
                      </a>
                    ) : selectedQa!.publicUrl ? (
                      <a href={selectedQa!.publicUrl} target="_blank" rel="noreferrer">
                        {selectedQa!.publicUrl}
                      </a>
                    ) : (
                      'URL pending forum slug'
                    )}
                  </p>
                </div>
                <div className={`admin-seo-score admin-seo-score--${score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low'}`}>
                  <strong>{score}</strong>
                  <span>SEO score</span>
                </div>
              </div>

              <SerpPreview title={form.title} description={form.metaDescription} url={previewUrl} />

              <div className="admin-seo-checklist">
                {checks.map((c) => (
                  <span key={c.label} className={`admin-seo-check${c.ok ? ' is-ok' : ''}`}>
                    {c.ok ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>

              <div className="admin-seo-fields">
                <label className="admin-field">
                  <span className="admin-field-label">
                    SEO title <em className={`admin-char-hint admin-char-hint--${titleHint.tone}`}>{titleHint.label}</em>
                  </span>
                  <input
                    className="admin-input"
                    value={form.title}
                    maxLength={180}
                    onChange={(e) => patchForm({ title: e.target.value })}
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-field-label">
                    Meta description{' '}
                    <em className={`admin-char-hint admin-char-hint--${descHint.tone}`}>{descHint.label}</em>
                  </span>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    maxLength={320}
                    value={form.metaDescription}
                    onChange={(e) => patchForm({ metaDescription: e.target.value })}
                  />
                </label>

                <div className="admin-seo-grid-2">
                  <label className="admin-field">
                    <span className="admin-field-label">Focus keyword</span>
                    <input
                      className="admin-input"
                      value={form.focusKeyword}
                      maxLength={120}
                      placeholder="e.g. diabetes diet"
                      onChange={(e) => patchForm({ focusKeyword: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Robots</span>
                    <select
                      className="admin-select"
                      value={form.robots}
                      onChange={(e) => patchForm({ robots: e.target.value })}
                    >
                      <option value="index,follow">index, follow</option>
                      <option value="noindex,follow">noindex, follow</option>
                      <option value="index,nofollow">index, nofollow</option>
                      <option value="noindex,nofollow">noindex, nofollow</option>
                    </select>
                  </label>
                </div>

                <label className="admin-field">
                  <span className="admin-field-label">Keywords (comma-separated)</span>
                  <input
                    className="admin-input"
                    value={form.keywords}
                    maxLength={500}
                    onChange={(e) => patchForm({ keywords: e.target.value })}
                  />
                </label>

                <div className="admin-seo-grid-2">
                  <label className="admin-field">
                    <span className="admin-field-label">OG title (optional)</span>
                    <input
                      className="admin-input"
                      value={form.ogTitle}
                      maxLength={180}
                      placeholder="Defaults to SEO title"
                      onChange={(e) => patchForm({ ogTitle: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">OG description (optional)</span>
                    <input
                      className="admin-input"
                      value={form.ogDescription}
                      maxLength={320}
                      placeholder="Defaults to meta description"
                      onChange={(e) => patchForm({ ogDescription: e.target.value })}
                    />
                  </label>
                </div>

                {tab === 'qa' ? (
                  <label className="admin-field">
                    <span className="admin-field-label">Internal links (one /forum/… path per line)</span>
                    <textarea
                      className="admin-textarea"
                      rows={4}
                      value={form.internalLinks}
                      placeholder={'/forum/diabetes-management/some-question-slug\n/forum/heart-disease-heart-blockage'}
                      onChange={(e) => patchForm({ internalLinks: e.target.value })}
                    />
                  </label>
                ) : null}
              </div>

              <div className="admin-seo-actions">
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={saving}
                  onClick={() => (tab === 'hubs' ? saveHub() : saveQa()).catch(() => undefined)}
                >
                  {saving ? 'Saving…' : 'Save SEO'}
                </button>
                <button type="button" className="admin-btn-secondary" disabled={saving} onClick={resetToDefaults}>
                  Reset to auto / defaults
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
