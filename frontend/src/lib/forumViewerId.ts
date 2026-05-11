const STORAGE_KEY = 'mb_forum_viewer_id';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function newViewerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const s = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s()}${s()}-${s()}-4${s().slice(0, 3)}-${((8 + Math.random() * 4) | 0).toString(16)}${s().slice(0, 3)}-${s()}${s()}${s()}`;
}

/** Stable per-browser id for forum view deduplication (sent as `X-Forum-Viewer-Id`). */
export function getOrCreateForumViewerId(): string {
  if (typeof window === 'undefined') return newViewerId();
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (existing && UUID_V4_RE.test(existing)) return existing.toLowerCase();
    const id = newViewerId().toLowerCase();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return newViewerId().toLowerCase();
  }
}
