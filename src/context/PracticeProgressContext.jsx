import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import practiceProblems, { DIFFICULTIES, PRACTICE_TOPICS } from '../data/practice';
import useDataScope from '../hooks/useDataScope';
import * as deviceStore from '../services/practiceStore';
import { fetchPractice, resetPracticeData, fetchDraft, saveDraftRow, deleteDraftRow } from '../services/db/practiceRepo';

/**
 * Coding Practice progress, derived only from the learner's real judged
 * submissions (no sample data).
 *
 *   Signed in → Supabase. Submissions are recorded by the API server after
 *               Judge0 returns a verdict; solved/attempted come from
 *               `problem_progress`; streaks and activity from the user's
 *               accepted submission timestamps (local calendar days).
 *   Otherwise → this browser's localStorage (services/practiceStore.js).
 *
 * status: 'loading' | 'ready' | 'error'
 */

const PracticeProgressContext = createContext(null);

/** Local calendar day key, e.g. "2026-11-13". */
export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Current and longest streak of consecutive days with at least one accepted submission. */
export function computeStreaks(acceptedDays, today = new Date()) {
  if (!acceptedDays.size) return { current: 0, longest: 0 };
  const sorted = [...acceptedDays].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expected = dayKey(addDays(new Date(`${sorted[i - 1]}T12:00:00`), 1));
    run = sorted[i] === expected ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // The current streak is still alive if the last solve was today or yesterday
  let cursor = acceptedDays.has(dayKey(today)) ? today : addDays(today, -1);
  let current = 0;
  while (acceptedDays.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

/**
 * Build every statistic from normalised inputs:
 *   history  – submissions [{ id, problemId, language, verdict, passed, total, submittedAt }]
 *   accepted – accepted submissions [{ problemId, submittedAt }] (all of them)
 *   solved / attempted – Sets of problem ids
 *   submissionCount / acceptedCount – totals
 */
function buildStats({ history, accepted, solved, attempted, submissionCount, acceptedCount }) {
  const acceptedDays = new Set();
  const solvedByDay = new Map();
  accepted.forEach((s) => {
    const day = dayKey(s.submittedAt);
    acceptedDays.add(day);
    if (!solvedByDay.has(day)) solvedByDay.set(day, new Set());
    solvedByDay.get(day).add(s.problemId);
  });

  const lastActivity = new Map();
  history.forEach((s) => lastActivity.set(s.problemId, s));

  const total = practiceProblems.length;
  const streaks = computeStreaks(acceptedDays);
  const today = new Date();

  const byDifficulty = DIFFICULTIES.map((level) => {
    const inLevel = practiceProblems.filter((p) => p.difficulty === level);
    return { level, solved: inLevel.filter((p) => solved.has(p.id)).length, total: inLevel.length };
  });
  const byTopic = PRACTICE_TOPICS.map((t) => {
    const inTopic = practiceProblems.filter((p) => p.topic === t.id);
    return { ...t, solved: inTopic.filter((p) => solved.has(p.id)).length, total: inTopic.length };
  });

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      solved: solvedByDay.get(dayKey(date))?.size ?? 0,
      isToday: i === 6,
    };
  });

  const recent = [...lastActivity.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const knownSolved = practiceProblems.filter((p) => solved.has(p.id)).length;

  return {
    total,
    solvedCount: knownSolved,
    attemptedCount: [...attempted].filter((id) => !solved.has(id)).length,
    submissionCount,
    acceptedCount,
    accuracy: submissionCount ? Math.round((acceptedCount / submissionCount) * 100) : null,
    percent: Math.round((knownSolved / total) * 100),
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    lastActiveDay: acceptedDays.size ? [...acceptedDays].sort().at(-1) : null,
    solvedToday: solvedByDay.get(dayKey(today))?.size ?? 0,
    solvedThisWeek: weeklyActivity.reduce((sum, d) => sum + d.solved, 0),
    byDifficulty,
    byTopic,
    weeklyActivity,
    recent,
    solved,
    attempted,
  };
}

function deviceData() {
  const history = deviceStore.loadSubmissions();
  const accepted = history.filter((s) => s.verdict === 'accepted');
  return {
    history,
    accepted,
    solved: new Set(accepted.map((s) => s.problemId)),
    attempted: new Set(history.map((s) => s.problemId)),
    submissionCount: history.length,
    acceptedCount: accepted.length,
  };
}

function accountData({ submissions, accepted, progress }) {
  return {
    history: submissions,
    accepted,
    solved: new Set(progress.filter((p) => p.status === 'solved').map((p) => p.problem_id)),
    attempted: new Set(progress.map((p) => p.problem_id)),
    submissionCount: progress.reduce((sum, p) => sum + (p.attempts ?? 0), 0),
    acceptedCount: progress.reduce((sum, p) => sum + (p.accepted_count ?? 0), 0),
  };
}

const EMPTY = { history: [], accepted: [], solved: new Set(), attempted: new Set(), submissionCount: 0, acceptedCount: 0 };

export function PracticeProgressProvider({ children }) {
  const { mode, userId } = useDataScope();
  const scope = mode === 'account' ? `account:${userId}` : mode;
  const [state, setState] = useState({ status: 'loading', data: EMPTY, error: null, scope: null });
  const [writeError, setWriteError] = useState(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (mode === 'pending') return setState({ status: 'loading', data: EMPTY, error: null, scope });
      if (mode === 'device') return setState({ status: 'ready', data: deviceData(), error: null, scope });
      if (!quiet) setState({ status: 'loading', data: EMPTY, error: null, scope });
      try {
        const rows = await fetchPractice(userId);
        if (scopeRef.current === scope) setState({ status: 'ready', data: accountData(rows), error: null, scope });
      } catch (error) {
        if (scopeRef.current !== scope) return undefined;
        if (quiet) setWriteError(`Couldn't refresh your practice history: ${error.message}`);
        else setState({ status: 'error', data: EMPTY, error: error.message, scope });
      }
      return undefined;
    },
    [mode, userId, scope],
  );

  useEffect(() => {
    setWriteError(null);
    load();
  }, [load]);

  /**
   * Record a judged submission.
   *   device  – stored in localStorage.
   *   account – the API server already saved it (server response
   *             `persistence.saved`); we just reload the user's rows.
   */
  const recordSubmission = useCallback(
    async ({ problemId, language, verdict, passed, total }, persistence) => {
      if (mode === 'account') {
        if (persistence?.saved) await load({ quiet: true });
        return;
      }
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        problemId,
        language,
        verdict,
        passed,
        total,
        submittedAt: new Date().toISOString(),
      };
      const history = [...deviceStore.loadSubmissions(), entry];
      deviceStore.saveSubmissions(history);
      setState((s) => ({ ...s, data: deviceData() }));
    },
    [mode, load],
  );

  /** Delete all submissions, progress and drafts. Rejects if the database refuses. */
  const resetPractice = useCallback(async () => {
    if (mode === 'account') {
      await resetPracticeData(userId);
      await load({ quiet: true });
      return;
    }
    deviceStore.clearSubmissions();
    deviceStore.clearDrafts();
    setState((s) => ({ ...s, data: EMPTY }));
  }, [mode, userId, load]);

  /* -------- code drafts (per problem + language) -------- */
  const drafts = useMemo(
    () => ({
      /** Resolves to the saved code, or null. Rejects on database errors. */
      load: async (problemId, language) =>
        mode === 'account' ? fetchDraft(userId, problemId, language) : deviceStore.loadDraft(problemId, language),
      save: async (problemId, language, code) =>
        mode === 'account' ? saveDraftRow(userId, problemId, language, code) : deviceStore.saveDraft(problemId, language, code),
      remove: async (problemId, language) =>
        mode === 'account' ? deleteDraftRow(userId, problemId, language) : deviceStore.deleteDraft(problemId, language),
      ready: mode !== 'pending',
      source: mode === 'account' ? 'account' : 'device',
    }),
    [mode, userId],
  );

  const stats = useMemo(() => buildStats(state.data), [state.data]);
  const submissions = state.data.history;

  /** 'solved' | 'attempted' | 'todo' */
  const getProblemStatus = useCallback(
    (problemId) => (stats.solved.has(problemId) ? 'solved' : stats.attempted.has(problemId) ? 'attempted' : 'todo'),
    [stats],
  );

  const getSubmissionsFor = useCallback((problemId) => submissions.filter((s) => s.problemId === problemId).reverse(), [submissions]);

  const value = {
    submissions,
    stats,
    status: state.status,
    error: state.error,
    source: mode === 'account' ? 'account' : 'device',
    reload: load,
    writeError,
    clearWriteError: () => setWriteError(null),
    setWriteError,
    recordSubmission,
    resetPractice,
    getProblemStatus,
    getSubmissionsFor,
    drafts,
  };
  return <PracticeProgressContext.Provider value={value}>{children}</PracticeProgressContext.Provider>;
}

export function usePracticeProgress() {
  const context = useContext(PracticeProgressContext);
  if (!context) throw new Error('usePracticeProgress must be used inside <PracticeProgressProvider>');
  return context;
}
