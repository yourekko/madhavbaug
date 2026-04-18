const STORAGE_KEY = 'mb_forum_saved_questions_v1';

export type SavedForumQuestion = {
  categorySlug: string;
  questionSlug: string;
  title: string;
  savedAt: string;
};

function readAll(): SavedForumQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedForumQuestion[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedForumQuestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
}

function keyOf(categorySlug: string, questionSlug: string) {
  return `${categorySlug}::${questionSlug}`;
}

export function isForumQuestionSaved(categorySlug: string, questionSlug: string): boolean {
  const k = keyOf(categorySlug, questionSlug);
  return readAll().some((x) => keyOf(x.categorySlug, x.questionSlug) === k);
}

/** Returns true if now saved, false if removed. */
export function toggleForumSaved(categorySlug: string, questionSlug: string, title: string): boolean {
  const k = keyOf(categorySlug, questionSlug);
  const list = readAll();
  const idx = list.findIndex((x) => keyOf(x.categorySlug, x.questionSlug) === k);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeAll(list);
    return false;
  }
  list.unshift({
    categorySlug,
    questionSlug,
    title: title.slice(0, 300),
    savedAt: new Date().toISOString(),
  });
  writeAll(list);
  return true;
}

export function listSavedForumQuestions(): SavedForumQuestion[] {
  return readAll();
}
