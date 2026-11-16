/**
 * Persistence for Coding Practice data.
 *
 * Today this uses localStorage. Every read/write goes through this module, so
 * moving to a backend database later only means replacing these functions
 * with API calls (e.g. GET/POST /api/submissions); the components and the
 * PracticeProgressContext don't need to change.
 *
 * Stored data:
 *   submissions: [{ id, problemId, language, verdict, passed, total, submittedAt }]
 *   drafts:      { [problemId]: { [language]: code } }
 */

const SUBMISSIONS_KEY = 'algoverse.practice.submissions.v1';
const DRAFTS_KEY = 'algoverse.practice.drafts.v1';
const MAX_SUBMISSIONS = 1000; // keep localStorage small

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable: keep working in memory */
  }
}

/* ------------------------------------------------------------ submissions */

export function loadSubmissions() {
  const list = read(SUBMISSIONS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveSubmissions(submissions) {
  write(SUBMISSIONS_KEY, submissions.slice(-MAX_SUBMISSIONS));
}

export function clearSubmissions() {
  try {
    localStorage.removeItem(SUBMISSIONS_KEY);
  } catch {
    /* ignore */
  }
}

/* ----------------------------------------------------------------- drafts */

export function loadDraft(problemId, language) {
  return read(DRAFTS_KEY, {})?.[problemId]?.[language] ?? null;
}

export function saveDraft(problemId, language, code) {
  const drafts = read(DRAFTS_KEY, {});
  drafts[problemId] = { ...(drafts[problemId] ?? {}), [language]: code };
  write(DRAFTS_KEY, drafts);
}

export function deleteDraft(problemId, language) {
  const drafts = read(DRAFTS_KEY, {});
  if (drafts[problemId]) {
    delete drafts[problemId][language];
    write(DRAFTS_KEY, drafts);
  }
}

export function clearDrafts() {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch {
    /* ignore */
  }
}
