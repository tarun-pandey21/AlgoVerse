import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, Route, Square, Target, CalendarDays, Flag, Lightbulb, BookOpen, CheckCircle2, Code2, Trash2, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge, { DifficultyBadge } from '../components/Badge';
import Markdown, { InlineMarkdown } from '../components/ai/Markdown';
import AINotice, { AIFootnote, AIAccessNotice } from '../components/ai/AINotice';
import useAIStatus from '../hooks/useAIStatus';
import useCodeLanguage from '../hooks/useCodeLanguage';
import { buildRoadmap } from '../services/aiApi';
import { useLearningProgress } from '../context/LearningProgressContext';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import topics from '../data/topics';
import practiceProblems, { getPracticeProblem } from '../data/practice';
import { getLanguage } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import { scopedKey } from '../lib/scopedStorage';
import { useProgressData } from '../components/DataStatusBanner';
import '../components/ai/AI.css';
import './AIRoadmap.css';

const STORAGE_BASE = 'algoverse.ai.roadmap.v1';
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PRIORITY_TONE = { high: 'hard', medium: 'medium', low: 'easy' };

function loadSaved(STORAGE_KEY) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.data?.weeks) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

export default function AIRoadmap() {
  const { user } = useAuth();
  const storageKey = scopedKey(STORAGE_BASE, user?.id);
  const { status, refresh } = useAIStatus();
  const { language } = useCodeLanguage();
  const { getTopicStats } = useLearningProgress();
  const { stats } = usePracticeProgress();

  // Real progress from this browser: lessons read and problems solved.
  const snapshot = useMemo(() => {
    const completed = topics.filter((t) => getTopicStats(t.id).completed);
    const inProgress = topics.filter((t) => getTopicStats(t.id).started && !getTopicStats(t.id).completed);
    const solvedIds = [...stats.solved];
    // Topics with attempted-but-unsolved problems are likely weak spots.
    const struggling = new Set([...stats.attempted].filter((id) => !stats.solved.has(id)).map((id) => getPracticeProblem(id)?.topic));
    const suggestedWeak = topics.filter((t) => struggling.has(t.id)).map((t) => t.name);
    const suggestedLevel = completed.length >= 10 || stats.solvedCount >= 20 ? 'Advanced' : completed.length >= 4 || stats.solvedCount >= 8 ? 'Intermediate' : 'Beginner';
    return { completed, inProgress, solvedIds, suggestedWeak, suggestedLevel };
  }, [getTopicStats, stats]);

  const saved = useRef(loadSaved(storageKey)).current;
  const [skillLevel, setSkillLevel] = useState(saved?.request?.skillLevel ?? snapshot.suggestedLevel);
  const [targetDifficulty, setTargetDifficulty] = useState(saved?.request?.targetDifficulty ?? 'Medium');
  const [weeks, setWeeks] = useState(saved?.request?.weeks ?? 4);
  const [hoursPerWeek, setHoursPerWeek] = useState(saved?.request?.hoursPerWeek ?? 6);
  const [weakAreas, setWeakAreas] = useState(() => saved?.request?.weakAreas ?? snapshot.suggestedWeak);
  const [goals, setGoals] = useState(saved?.request?.goals ?? '');
  const [result, setResult] = useState(saved); // { data, model, request, createdAt }
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const ready = status.state === 'ready';
  // Only build from real, fully loaded progress (never from empty placeholders).
  const progressData = useProgressData();
  const weakSeeded = useRef(Boolean(saved?.request?.weakAreas));
  useEffect(() => {
    if (progressData.ready && !weakSeeded.current) {
      weakSeeded.current = true;
      setWeakAreas(snapshot.suggestedWeak);
      setSkillLevel(snapshot.suggestedLevel);
    }
  }, [progressData.ready, snapshot]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleWeak = (name) => setWeakAreas((list) => (list.includes(name) ? list.filter((n) => n !== name) : [...list, name]));

  const generate = async () => {
    if (!ready || pending || !progressData.ready) return;
    setError(null);
    setPending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const request = {
      skillLevel,
      targetDifficulty,
      weeks,
      hoursPerWeek,
      language,
      goals: goals.trim(),
      weakAreas,
      completedTopics: snapshot.completed.map((t) => t.name),
      inProgressTopics: snapshot.inProgress.map((t) => t.name),
      solvedProblemIds: snapshot.solvedIds,
    };
    const response = await buildRoadmap(request, controller.signal);
    abortRef.current = null;
    setPending(false);
    if (response.ok) {
      if (!Array.isArray(response.data.weeks) || response.data.weeks.length === 0) {
        setError({ kind: 'error', message: 'Claude returned a roadmap without any weeks. Please try again.' });
        return;
      }
      const next = { data: response.data, model: response.model, request, createdAt: new Date().toISOString() };
      setResult(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    } else if (response.kind !== 'aborted') {
      setError(response);
      if (response.kind === 'unavailable' || response.kind === 'not_configured') refresh();
    }
  };

  const clear = () => {
    setResult(null);
    localStorage.removeItem(storageKey);
  };

  const data = result?.data;

  return (
    <div className="page roadmap-page">
      <PageHeader
        eyebrow="AI Tools"
        title="AI Learning Roadmap"
        description="A personalized week-by-week plan built from your real lesson progress, solved problems, weak areas and goals."
      />

      {status.state === 'not_configured' && <AINotice kind="not_configured" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      {status.state === 'unavailable' && <AINotice kind="unavailable" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      <AIAccessNotice status={status} />

      <div className="roadmap-setup">
        <section className="card card--padded">
          <h2 className="ai-section-title">
            <Target size={17} /> Your plan settings
          </h2>
          <form
            className="ai-form"
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <div className="ai-form__row">
              <div className="ai-field">
                <span className="ai-field__label" id="level-label">
                  Skill level
                </span>
                <div className="ai-chips" role="group" aria-labelledby="level-label">
                  {LEVELS.map((l) => (
                    <button key={l} type="button" className="ai-chip" aria-pressed={skillLevel === l} onClick={() => setSkillLevel(l)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ai-field">
                <span className="ai-field__label" id="target-label">
                  Target difficulty
                </span>
                <div className="ai-chips" role="group" aria-labelledby="target-label">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} type="button" className="ai-chip" aria-pressed={targetDifficulty === d} onClick={() => setTargetDifficulty(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ai-form__row">
              <label className="ai-field">
                <span className="ai-field__label">Length</span>
                <select className="select" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} week{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ai-field">
                <span className="ai-field__label">Hours per week</span>
                <select className="select" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Number(e.target.value))}>
                  {[2, 4, 6, 8, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      About {n} hours
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ai-field">
              <span className="ai-field__label" id="weak-label">
                Weak areas
              </span>
              <span className="ai-field__hint">
                {snapshot.suggestedWeak.length
                  ? 'Pre-selected from topics where you have unsolved attempts. Adjust as you like.'
                  : 'Select topics you find hard.'}
              </span>
              <div className="ai-chips" role="group" aria-labelledby="weak-label">
                {topics.map((t) => (
                  <button key={t.id} type="button" className="ai-chip" aria-pressed={weakAreas.includes(t.name)} onClick={() => toggleWeak(t.name)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="ai-field">
              <span className="ai-field__label">Goals (optional)</span>
              <textarea
                className="ai-textarea"
                rows={2}
                maxLength={500}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Prepare for internship interviews in two months"
              />
            </label>
            <div className="roadmap__actions">
              {result && !pending && (
                <Button variant="ghost" icon={Trash2} onClick={clear}>
                  Clear plan
                </Button>
              )}
              {pending ? (
                <Button variant="secondary" icon={Square} onClick={() => abortRef.current?.abort()}>
                  Cancel
                </Button>
              ) : (
                <Button type="submit" icon={Route} disabled={!ready || !progressData.ready} title={progressData.ready ? undefined : 'Waiting for your progress to load'}>
                  {result ? 'Rebuild my roadmap' : 'Build my roadmap'}
                </Button>
              )}
            </div>
          </form>
        </section>

        <aside className="card card--padded roadmap-snapshot" aria-label="Progress shared with Claude">
          <h2 className="ai-section-title">
            <CheckCircle2 size={17} /> What Claude will see
          </h2>
          {!progressData.ready && (
            <p className="ai-field__hint" role="status">
              {progressData.error ? 'Your progress didn’t load, so a roadmap can’t be built yet (see the message above).' : 'Loading your progress…'}
            </p>
          )}
          {progressData.ready && (
          <dl className="snapshot">
            <div>
              <dt>Lessons completed</dt>
              <dd>{snapshot.completed.length ? snapshot.completed.map((t) => t.name).join(', ') : 'None yet'}</dd>
            </div>
            <div>
              <dt>Lessons in progress</dt>
              <dd>{snapshot.inProgress.length ? snapshot.inProgress.map((t) => t.name).join(', ') : 'None'}</dd>
            </div>
            <div>
              <dt>Problems solved</dt>
              <dd>
                {stats.solvedCount} of {practiceProblems.length}
                {stats.byDifficulty.some((d) => d.solved) && (
                  <> ({stats.byDifficulty.map((d) => `${d.level} ${d.solved}`).join(' · ')})</>
                )}
              </dd>
            </div>
            <div>
              <dt>Code language</dt>
              <dd>{getLanguage(language).label}</dd>
            </div>
          </dl>
          )}
          <p className="ai-field__hint">Only this summary is sent. Your code, name and other profile details are not.</p>
        </aside>
      </div>

      {error && <AINotice kind={error.kind} message={error.message} onRetry={error.kind === 'rate_limited' ? undefined : generate} />}

      {pending ? (
        <div className="card ai-loading" role="status">
          <span className="ai-spinner" />
          Claude is planning your {weeks}-week roadmap…
        </div>
      ) : data ? (
        <section className="roadmap" aria-label="Your roadmap">
          <div className="card card--padded roadmap__summary">
            <h2 className="ai-section-title">
              <MapIcon size={17} /> Your {data.weeks.length}-week roadmap
            </h2>
            {data.summary && <Markdown text={data.summary} />}
            {data.focusAreas?.length > 0 && (
              <div className="focus-areas">
                {data.focusAreas.map((f, i) => (
                  <div key={i} className="focus">
                    <div className="focus__head">
                      <strong>{f.topic}</strong>
                      <Badge tone={PRIORITY_TONE[f.priority] ?? 'neutral'}>{f.priority} priority</Badge>
                    </div>
                    <p>
                      <InlineMarkdown text={f.reason} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ol className="weeks">
            {data.weeks.map((week, i) => (
              <li key={i} className="card week">
                <div className="week__marker">
                  <CalendarDays size={15} />
                  Week {week.week ?? i + 1}
                </div>
                <h3 className="week__title">
                  <InlineMarkdown text={week.title} />
                </h3>
                {week.topics?.length > 0 && (
                  <div className="week__topics">
                    {week.topics.map((t) => {
                      const topic = topics.find((x) => x.name.toLowerCase() === String(t).toLowerCase());
                      return topic ? (
                        <Link key={t} to={`/learn/${topic.id}`} className="week__topic">
                          <BookOpen size={12} /> {t}
                        </Link>
                      ) : (
                        <span key={t} className="week__topic week__topic--plain">
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}
                {week.goals?.length > 0 && (
                  <ul className="ai-list">
                    {week.goals.map((g, j) => (
                      <li key={j}>
                        <InlineMarkdown text={g} />
                      </li>
                    ))}
                  </ul>
                )}
                {week.practice?.length > 0 && (
                  <div className="week__practice">
                    <p className="week__label">
                      <Code2 size={14} /> Practice
                    </p>
                    <ul>
                      {week.practice.map((p, j) => {
                        const linked = p.problemId && getPracticeProblem(p.problemId);
                        return (
                          <li key={j}>
                            {linked ? (
                              <Link to={`/practice/${linked.id}`} className="week__problem">
                                {linked.title}
                              </Link>
                            ) : (
                              <span className="week__problem week__problem--external">
                                {p.title} <ExternalLink size={11} aria-label="Not in the AlgoVerse library" />
                              </span>
                            )}
                            {DIFFICULTIES.includes(p.difficulty) && <DifficultyBadge level={linked?.difficulty ?? p.difficulty} />}
                            {p.why && (
                              <span className="week__why">
                                <InlineMarkdown text={p.why} />
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {week.milestone && (
                  <p className="week__milestone">
                    <Flag size={14} />
                    <span>
                      <InlineMarkdown text={week.milestone} />
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ol>

          {data.tips?.length > 0 && (
            <div className="card card--padded">
              <h2 className="ai-section-title">
                <Lightbulb size={17} /> Tips
              </h2>
              <ul className="ai-list">
                {data.tips.map((t, i) => (
                  <li key={i}>
                    <InlineMarkdown text={t} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AIFootnote model={result.model}>
            Generated by Claude
            {result.createdAt ? ` on ${new Date(result.createdAt).toLocaleDateString()}` : ''}. Rebuild it as you make progress. Problems marked with an
            arrow icon are not in the AlgoVerse library.
          </AIFootnote>
        </section>
      ) : (
        !error && (
          <div className="card ai-empty">
            <span className="icon-tile icon-tile--lg tone-amber">
              <MapIcon size={24} />
            </span>
            <p className="ai-empty__title">No roadmap yet</p>
            <p>Check your settings above, then build your roadmap. It is saved in this browser so you can come back to it.</p>
          </div>
        )
      )}
    </div>
  );
}
