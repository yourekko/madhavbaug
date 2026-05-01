import { API_BASE_URL } from './api';

export type ForumStats = Record<string, { answered: number; open: number }>;

export type HomeFeedResponse = {
  generatedAt: string;
  quickAnswer: {
    questionSlug: string | null;
    categorySlug: string | null;
    category: string;
    questionTitle: string;
    answerSnippet: string | null;
    reviewedBy: {
      name: string;
      titles: string;
      experienceYears: number | null;
    } | null;
    reviewedAt: string;
  } | null;
  trending: Array<{
    id: string;
    category: string;
    categorySlug: string | null;
    questionSlug: string | null;
    title: string;
    /** Full patient question (use for display; `title` may be a shorter stored heading). */
    body?: string;
    excerpt: string;
    views: number;
    answers: number;
    status: 'answered' | 'pending';
    createdAt: string;
  }>;
  recentlyAnswered: Array<{
    id: string;
    category: string;
    categorySlug: string | null;
    questionSlug: string | null;
    title: string;
    body?: string;
    excerpt: string;
    views: number;
    answeredAt: string;
    doctor: {
      name: string;
      titles: string;
    } | null;
  }>;
};

export type ForumListItem = {
  slug: string;
  title: string;
  /** Full question text for list cards. */
  body?: string;
  snippet: string;
  category: string;
  tag: string;
  createdAt: string;
  doctorCount: number;
  answerCount: number;
  viewCount: number;
};

export type ForumListResponse = {
  items: ForumListItem[];
  total: number;
  page: number;
  limit: number;
};

export type ForumAnswerBlock = {
  id: string;
  answerHtml: string;
  createdAt: string;
  doctor: {
    name: string;
    titles: string;
    experienceYears: number | null;
    photoUrl: string | null;
  };
};

export type ForumDetailResponse = {
  slug: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  viewCount: number;
  patientAnonId: string;
  answers: ForumAnswerBlock[];
  related: { slug: string; title: string; answerCount: number; viewCount: number }[];
};

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchForumStats(): Promise<ForumStats> {
  const res = await fetch(`${API_BASE_URL}/public/forum/stats`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error('Could not load forum stats.');
  return body as ForumStats;
}

export async function fetchHomeFeed(): Promise<HomeFeedResponse> {
  const res = await fetch(`${API_BASE_URL}/public/forum/home-feed`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error('Could not load home feed.');
  return body as HomeFeedResponse;
}

export async function fetchForumQuestionList(
  categorySlug: string,
  opts: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: 'answered' | 'open';
    sort?: 'latest' | 'views';
  },
): Promise<ForumListResponse> {
  const q = new URLSearchParams();
  if (opts.page != null) q.set('page', String(opts.page));
  if (opts.limit != null) q.set('limit', String(opts.limit));
  if (opts.search?.trim()) q.set('search', opts.search.trim());
  if (opts.filter) q.set('filter', opts.filter);
  if (opts.sort === 'views') q.set('sort', 'views');
  const res = await fetch(`${API_BASE_URL}/public/forum/${categorySlug}/questions?${q.toString()}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error('Could not load forum questions.');
  return body as ForumListResponse;
}

export async function fetchForumQuestionDetail(
  categorySlug: string,
  questionSlug: string,
): Promise<ForumDetailResponse | null> {
  const res = await fetch(
    `${API_BASE_URL}/public/forum/${categorySlug}/questions/${encodeURIComponent(questionSlug)}`,
  );
  if (res.status === 404) return null;
  const body = await parseJson(res);
  if (!res.ok) throw new Error('Could not load this discussion.');
  return body as ForumDetailResponse;
}

export async function submitForumReport(
  categorySlug: string,
  questionSlug: string,
  message: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/public/forum/${categorySlug}/questions/${encodeURIComponent(questionSlug)}/report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim() }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    const err = body as { message?: string | string[] } | null;
    const msg = Array.isArray(err?.message) ? err.message[0] : err?.message;
    throw new Error(msg ?? 'Could not send report.');
  }
}
