import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import topics from '../data/topics';
import { SECTION_KEYS, SECTIONS_PER_TOPIC } from '../data/lessonSections';
import useDataScope from '../hooks/useDataScope';
import { fetchLearning, addSections, removeSections, recordVisit as saveVisit, resetLearning } from '../services/db/learningRepo';

/**
 * Tracks which lesson sections the learner has read.
 *
 *   Signed in → Supabase `section_progress` + `topic_progress` (own rows only).
 *   Otherwise → this browser's localStorage.
 *
 * Shape: { [topicId]: { read: ['introduction', …], visitedAt, completedAt } }
 *
 * There is NO sample/demo progress: a new learner starts at 0. A topic is
 * "completed" when every section is read. Everything else (percentages, next
 * lesson, last completed lesson) is derived from this one object.
 *
 * status: 'loading' | 'ready' | 'error'
 */

// v1 could contain the sample learner's seeded progress, so it is not read.
const STORAGE_KEY = 'algoverse.learning.v2';
const LEGACY_KEYS = ['algoverse.learning.v1'];

function loadDeviceProgress() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveDeviceProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable: progress stays in memory for this visit */
  }
}

const LearningProgressContext = createContext(null);

export function LearningProgressProvider({ children }) {
  const { mode, userId } = useDataScope();
  const scope = mode === 'account' ? `account:${userId}` : mode;
  const [state, setState] = useState({ status: 'loading', progress: {}, error: null, scope: null });
  const [writeError, setWriteError] = useState(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  // Lesson visits that happen while the saved session is still being restored
  // are queued and recorded once we know whose data this is.
  const queuedVisits = useRef(new Set());

  const load = useCallback(async () => {
    if (mode === 'pending') return setState({ status: 'loading', progress: {}, error: null, scope });
    if (mode === 'device') return setState({ status: 'ready', progress: loadDeviceProgress(), error: null, scope });
    setState({ status: 'loading', progress: {}, error: null, scope });
    try {
      const progress = await fetchLearning(userId);
      if (scopeRef.current === scope) setState({ status: 'ready', progress, error: null, scope });
    } catch (error) {
      if (scopeRef.current === scope) setState({ status: 'error', progress: {}, error: error.message, scope });
    }
    return undefined;
  }, [mode, userId, scope]);

  useEffect(() => {
    setWriteError(null);
    load();
  }, [load]);

  /**
   * Optimistically apply a change, then persist it. In account mode a failed
   * write is reported and the real state is reloaded from the database.
   */
  const change = useCallback(
    (topicId, updater, persist) => {
      setState((s) => {
        const entry = s.progress[topicId] ?? { read: [] };
        const nextEntry = updater(entry);
        if (nextEntry.read.length >= SECTIONS_PER_TOPIC && entry.read.length < SECTIONS_PER_TOPIC) nextEntry.completedAt = Date.now();
        if (nextEntry.read.length < SECTIONS_PER_TOPIC) delete nextEntry.completedAt;
        const progress = { ...s.progress, [topicId]: nextEntry };
        if (mode === 'device') saveDeviceProgress(progress);
        return { ...s, progress };
      });
      if (mode === 'account' && persist) {
        persist().catch((error) => {
          if (scopeRef.current !== scope) return;
          setWriteError(`Your lesson progress was not saved: ${error.message}`);
          load();
        });
      }
    },
    [mode, scope, load],
  );

  const setSectionRead = useCallback(
    (topicId, sectionKey, isRead) =>
      change(
        topicId,
        (entry) => {
          const read = new Set(entry.read);
          if (isRead) read.add(sectionKey);
          else read.delete(sectionKey);
          return { ...entry, read: SECTION_KEYS.filter((k) => read.has(k)) };
        },
        () => (isRead ? addSections(userId, topicId, [sectionKey]) : removeSections(userId, topicId, [sectionKey])),
      ),
    [change, userId],
  );

  const markTopicComplete = useCallback(
    (topicId) => change(topicId, (entry) => ({ ...entry, read: [...SECTION_KEYS] }), () => addSections(userId, topicId, [...SECTION_KEYS])),
    [change, userId],
  );

  const resetTopic = useCallback(
    (topicId) => change(topicId, (entry) => ({ ...entry, read: [] }), () => removeSections(userId, topicId)),
    [change, userId],
  );

  const recordVisit = useCallback(
    (topicId) => {
      if (mode === 'pending' || state.status === 'loading') {
        queuedVisits.current.add(topicId); // recorded once this user's progress has loaded
        return;
      }
      change(topicId, (entry) => ({ ...entry, visitedAt: Date.now() }), () => saveVisit(userId, topicId));
    },
    [change, userId, mode, state.status],
  );

  // Flush queued visits once this scope's progress has loaded.
  useEffect(() => {
    if (state.status !== 'ready' || state.scope !== scope || !queuedVisits.current.size) return;
    const topicsVisited = [...queuedVisits.current];
    queuedVisits.current.clear();
    topicsVisited.forEach((topicId) =>
      change(topicId, (entry) => ({ ...entry, visitedAt: Date.now() }), () => saveVisit(userId, topicId)),
    );
  }, [state.status, state.scope, scope, change, userId]);

  /** Clear all lesson progress. Resolves when done; rejects if the database refuses. */
  const resetAllProgress = useCallback(async () => {
    if (mode === 'account') {
      await resetLearning(userId);
      setState((s) => ({ ...s, progress: {} }));
      return;
    }
    saveDeviceProgress({});
    setState((s) => ({ ...s, progress: {} }));
  }, [mode, userId]);

  const { progress } = state;

  /** { read, total, percent, completed, started } for one topic. */
  const getTopicStats = useCallback(
    (topicId) => {
      const read = progress[topicId]?.read?.length ?? 0;
      return {
        read,
        total: SECTIONS_PER_TOPIC,
        percent: Math.round((read / SECTIONS_PER_TOPIC) * 100),
        completed: read >= SECTIONS_PER_TOPIC,
        started: read > 0,
      };
    },
    [progress],
  );

  const isSectionRead = useCallback((topicId, sectionKey) => Boolean(progress[topicId]?.read?.includes(sectionKey)), [progress]);

  /** Totals across the whole curriculum. */
  const summary = useMemo(() => {
    const totalSections = topics.length * SECTIONS_PER_TOPIC;
    let readSections = 0;
    let completedTopics = 0;
    let startedTopics = 0;
    topics.forEach((t) => {
      const read = progress[t.id]?.read?.length ?? 0;
      readSections += read;
      if (read >= SECTIONS_PER_TOPIC) completedTopics += 1;
      else if (read > 0) startedTopics += 1;
    });
    return {
      totalTopics: topics.length,
      completedTopics,
      inProgressTopics: startedTopics,
      readSections,
      totalSections,
      percent: Math.round((readSections / totalSections) * 100),
    };
  }, [progress]);

  /**
   * What to study next: the most recently visited unfinished topic, otherwise
   * the first started-but-unfinished topic, otherwise the first one not started.
   */
  const nextLesson = useMemo(() => {
    const unfinished = topics.filter((t) => (progress[t.id]?.read?.length ?? 0) < SECTIONS_PER_TOPIC);
    if (!unfinished.length) return null;
    const visited = unfinished.filter((t) => progress[t.id]?.visitedAt).sort((a, b) => progress[b.id].visitedAt - progress[a.id].visitedAt);
    const started = unfinished.filter((t) => (progress[t.id]?.read?.length ?? 0) > 0);
    const topic = visited[0] ?? started[0] ?? unfinished[0];
    const read = progress[topic.id]?.read ?? [];
    return {
      topic,
      lessonNumber: topics.indexOf(topic) + 1,
      nextSection: SECTION_KEYS.find((k) => !read.includes(k)),
      percent: Math.round((read.length / SECTIONS_PER_TOPIC) * 100),
      visitedAt: progress[topic.id]?.visitedAt ?? null,
    };
  }, [progress]);

  /** The most recently completed topic, if any: { topic, completedAt }. */
  const lastCompleted = useMemo(() => {
    const done = topics
      .filter((t) => (progress[t.id]?.read?.length ?? 0) >= SECTIONS_PER_TOPIC && progress[t.id]?.completedAt)
      .sort((a, b) => progress[b.id].completedAt - progress[a.id].completedAt);
    return done[0] ? { topic: done[0], completedAt: progress[done[0].id].completedAt } : null;
  }, [progress]);

  const value = {
    progress,
    status: state.status,
    error: state.error,
    source: mode === 'account' ? 'account' : 'device',
    reload: load,
    writeError,
    clearWriteError: () => setWriteError(null),
    summary,
    nextLesson,
    lastCompleted,
    getTopicStats,
    isSectionRead,
    setSectionRead,
    markTopicComplete,
    resetTopic,
    recordVisit,
    resetAllProgress,
  };

  return <LearningProgressContext.Provider value={value}>{children}</LearningProgressContext.Provider>;
}

export function useLearningProgress() {
  const context = useContext(LearningProgressContext);
  if (!context) throw new Error('useLearningProgress must be used inside <LearningProgressProvider>');
  return context;
}

/** 'completed' | 'in-progress' | 'not-started' */
export function getTopicStatus(stats) {
  if (stats.completed) return 'completed';
  if (stats.started) return 'in-progress';
  return 'not-started';
}
