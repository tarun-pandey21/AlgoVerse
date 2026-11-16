import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  CheckCircle2,
  CircleDot,
  Circle,
  ListChecks,
  Flame,
  TrendingUp,
  Zap,
  ArrowRight,
  History,
  Sparkles,
  Target,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import FilterTabs from '../components/FilterTabs';
import ProgressBar from '../components/ProgressBar';
import { DifficultyBadge } from '../components/Badge';
import practiceProblems, {
  DIFFICULTIES,
  DIFFICULTY_RANK,
  PRACTICE_TOPICS,
  topicName,
  getDailyProblem,
  getPracticeProblem,
} from '../data/practice';
import { getLanguage } from '../data/languages';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { useLearningProgress } from '../context/LearningProgressContext';
import './PracticeProblems.css';

const STATUS_ICON = {
  solved: { icon: CheckCircle2, label: 'Solved', className: 'status--solved' },
  attempted: { icon: CircleDot, label: 'Attempted', className: 'status--attempted' },
  todo: { icon: Circle, label: 'Not attempted', className: 'status--todo' },
};

const SORTS = {
  default: { label: 'Recommended order', compare: (a, b) => a.order - b.order },
  title: { label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
  easy: { label: 'Difficulty: easy first', compare: (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.order - b.order },
  hard: { label: 'Difficulty: hard first', compare: (a, b) => DIFFICULTY_RANK[b.difficulty] - DIFFICULTY_RANK[a.difficulty] || a.order - b.order },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Any status' },
  { value: 'todo', label: 'Not attempted' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'solved', label: 'Solved' },
];

const VERDICT_TEXT = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  compilation_error: 'Compilation Error',
  runtime_error: 'Runtime Error',
  time_limit_exceeded: 'Time Limit Exceeded',
  internal_error: 'Execution Error',
};

function matches(problem, query) {
  if (!query) return true;
  const text = [problem.title, problem.summary, topicName(problem.topic), problem.difficulty, ...problem.tags].join(' ').toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => text.includes(word));
}

function timeAgo(iso) {
  const seconds = Math.round((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Picks unsolved problems that fit what the learner is studying:
 * unfinished attempts first, then topics from lessons they've read,
 * favouring easier problems while they're getting started.
 */
function useRecommendations(getProblemStatus, solvedCount) {
  const { getTopicStats } = useLearningProgress();
  return useMemo(() => {
    const scored = practiceProblems
      .filter((p) => getProblemStatus(p.id) !== 'solved')
      .map((p) => {
        const lesson = getTopicStats(p.topic);
        const status = getProblemStatus(p.id);
        let score = 0;
        let reason;
        if (status === 'attempted') {
          score += 4;
          reason = 'You’ve attempted this. Finish it off!';
        } else if (lesson.completed) {
          score += 3;
          reason = `You completed the ${topicName(p.topic)} lesson`;
        } else if (lesson.started) {
          score += 2;
          reason = `Builds on the ${topicName(p.topic)} lesson you’re studying`;
        } else {
          reason = p.difficulty === 'Easy' ? 'A good warm-up problem' : `Try something new: ${topicName(p.topic)}`;
        }
        score -= DIFFICULTY_RANK[p.difficulty] * (solvedCount < 5 ? 1.5 : 0.5);
        return { problem: p, score, reason };
      })
      .sort((a, b) => b.score - a.score || a.problem.order - b.problem.order);

    // Prefer variety: one problem per topic where possible
    const picked = [];
    const topicsUsed = new Set();
    for (const item of scored) {
      if (picked.length === 4) break;
      if (!topicsUsed.has(item.problem.topic)) {
        picked.push(item);
        topicsUsed.add(item.problem.topic);
      }
    }
    for (const item of scored) {
      if (picked.length === 4) break;
      if (!picked.includes(item)) picked.push(item);
    }
    return picked;
  }, [getProblemStatus, getTopicStats, solvedCount]);
}

export default function PracticeProblems() {
  const { stats, getProblemStatus } = usePracticeProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('default');
  const topic = searchParams.get('topic') || 'all';
  const daily = getDailyProblem();
  const recommendations = useRecommendations(getProblemStatus, stats.solvedCount);

  // Lessons link here with ?topic=…; jump straight to the library
  useEffect(() => {
    if (searchParams.get('topic')) {
      requestAnimationFrame(() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTopic = (value) => setSearchParams(value === 'all' ? {} : { topic: value }, { replace: true });

  const filtered = useMemo(
    () =>
      practiceProblems
        .filter(
          (p) =>
            matches(p, query.trim()) &&
            (difficulty === 'All' || p.difficulty === difficulty) &&
            (topic === 'all' || p.topic === topic) &&
            (status === 'all' || getProblemStatus(p.id) === status)
        )
        .sort(SORTS[sort].compare),
    [query, difficulty, topic, status, sort, getProblemStatus]
  );

  const hasFilters = query || difficulty !== 'All' || topic !== 'all' || status !== 'all';
  const clearFilters = () => {
    setQuery('');
    setDifficulty('All');
    setStatus('all');
    setTopic('all');
  };

  const difficultyTabs = [
    { key: 'All', label: 'All', count: practiceProblems.length },
    ...DIFFICULTIES.map((d) => ({ key: d, label: d, count: practiceProblems.filter((p) => p.difficulty === d).length })),
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Coding Practice"
        title="Practice Problems"
        description="Solve hand-picked DSA problems in Java, C++ or Python. Run your code on sample tests, then submit it against hidden test cases."
        actions={
          <Button to={`/practice/${daily.id}`} icon={Zap}>
            Problem of the day
          </Button>
        }
      />

      {/* ---------------- Overview ---------------- */}
      <section className="practice-stats" aria-label="Practice statistics">
        <StatCard label="Total Problems" value={stats.total} icon={ListChecks} tone="blue" helper={`${PRACTICE_TOPICS.length} topics, 3 difficulty levels`} />
        <StatCard label="Solved" value={stats.solvedCount} icon={CheckCircle2} tone="green" helper={stats.solvedCount ? `${stats.solvedThisWeek} this week` : 'Submit a correct solution to count it'} />
        <StatCard label="Attempted" value={stats.attemptedCount} icon={CircleDot} tone="amber" helper="Submitted but not solved yet" />
        <StatCard label="Solving Streak" value={stats.currentStreak} suffix={stats.currentStreak === 1 ? 'day' : 'days'} icon={Flame} tone="orange" helper={`Best: ${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`} />
        <StatCard
          label="Overall Progress"
          value={`${stats.percent}%`}
          icon={TrendingUp}
          tone="indigo"
          progress={stats.percent}
          helper={stats.accuracy === null ? 'No submissions yet' : `${stats.accuracy}% accuracy · ${stats.submissionCount} submissions`}
        />
      </section>

      <div className="practice-overview">
        {/* Recently attempted */}
        <section className="card card--padded practice-panel">
          <h2 className="practice-panel__title">
            <History size={17} /> Recently attempted
          </h2>
          {stats.recent.length === 0 ? (
            <div className="practice-empty">
              <p>No submissions yet.</p>
              <p className="muted">Pick a recommended problem to get started. Your attempts will appear here.</p>
            </div>
          ) : (
            <ul className="recent-list">
              {stats.recent.slice(0, 5).map((s) => {
                const p = getPracticeProblem(s.problemId);
                if (!p) return null;
                const accepted = s.verdict === 'accepted';
                return (
                  <li key={s.problemId}>
                    <Link to={`/practice/${p.id}`} className="recent-item">
                      {accepted ? <CheckCircle2 size={17} className="status--solved" /> : <CircleDot size={17} className="status--attempted" />}
                      <span className="recent-item__body">
                        <span className="recent-item__title">{p.title}</span>
                        <span className="recent-item__meta">
                          <span className={accepted ? 'verdict-text--ok' : 'verdict-text--bad'}>{VERDICT_TEXT[s.verdict]}</span> ·{' '}
                          {getLanguage(s.language).label} · {s.passed}/{s.total} tests
                        </span>
                      </span>
                      <time dateTime={s.submittedAt}>{timeAgo(s.submittedAt)}</time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recommended */}
        <section className="card card--padded practice-panel">
          <h2 className="practice-panel__title">
            <Sparkles size={17} /> Recommended for you
          </h2>
          {recommendations.length === 0 ? (
            <div className="practice-empty">
              <p>You’ve solved every problem. Amazing work!</p>
            </div>
          ) : (
            <ul className="recommend-list">
              {recommendations.map(({ problem, reason }) => (
                <li key={problem.id}>
                  <Link to={`/practice/${problem.id}`} className="recommend-item">
                    <span className="recommend-item__body">
                      <span className="recommend-item__title">{problem.title}</span>
                      <span className="recommend-item__reason">{reason}</span>
                    </span>
                    <DifficultyBadge level={problem.difficulty} />
                    <ArrowRight size={16} className="recommend-item__arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Progress breakdown */}
      <section className="card card--padded practice-progress" aria-label="Progress by difficulty and topic">
        <div>
          <h2 className="practice-panel__title">
            <Target size={17} /> By difficulty
          </h2>
          <ul className="breakdown">
            {stats.byDifficulty.map((d) => (
              <li key={d.level}>
                <div className="breakdown__labels">
                  <span className={`breakdown__dot breakdown__dot--${d.level.toLowerCase()}`} />
                  <span className="breakdown__name">{d.level}</span>
                  <span className="breakdown__count">
                    {d.solved}
                    <span>/{d.total}</span>
                  </span>
                </div>
                <ProgressBar
                  value={(d.solved / d.total) * 100}
                  size="sm"
                  tone={{ Easy: 'success', Medium: 'warning', Hard: 'danger' }[d.level]}
                  label={`${d.level} problems solved`}
                />
              </li>
            ))}
          </ul>
          <p className="practice-accuracy">
            Accuracy:{' '}
            <strong>{stats.accuracy === null ? '–' : `${stats.accuracy}%`}</strong>
            <span className="muted"> ({stats.acceptedCount} accepted of {stats.submissionCount} submissions)</span>
          </p>
        </div>
        <div>
          <h2 className="practice-panel__title">By topic</h2>
          <ul className="topic-breakdown">
            {stats.byTopic.map((t) => (
              <li key={t.id}>
                <button className={`topic-breakdown__row ${topic === t.id ? 'is-active' : ''}`} onClick={() => setTopic(topic === t.id ? 'all' : t.id)} title={`Show ${t.name} problems`}>
                  <span className="topic-breakdown__name">{t.name}</span>
                  <ProgressBar value={(t.solved / t.total) * 100} size="sm" tone={t.solved === t.total ? 'success' : 'primary'} label={`${t.name} solved`} />
                  <span className="topic-breakdown__count">
                    {t.solved}/{t.total}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Library ---------------- */}
      <section className="section" id="library" aria-label="Problem library">
        <div className="library-head">
          <div>
            <h2 className="library-head__title">Problem library</h2>
            <p className="muted">Every problem includes examples, hints and starter code in Java, C++ and Python.</p>
          </div>
        </div>

        <div className="library-filters">
          <label className="search-input">
            <Search size={17} />
            <span className="sr-only">Search problems</span>
            <input type="search" placeholder="Search by title, topic or technique…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">
            <option value="all">All topics</option>
            {PRACTICE_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.count})
              </option>
            ))}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort problems">
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
        <FilterTabs ariaLabel="Filter by difficulty" tabs={difficultyTabs} active={difficulty} onChange={setDifficulty} />

        <div className="card library-table">
          <div className="library-table__head" aria-hidden="true">
            <span className="col-status">Status</span>
            <span>Problem</span>
            <span className="col-topic">Topic</span>
            <span>Difficulty</span>
          </div>
          {filtered.length > 0 ? (
            <ul>
              {filtered.map((p) => {
                const s = STATUS_ICON[getProblemStatus(p.id)];
                const StatusIcon = s.icon;
                return (
                  <li key={p.id}>
                    <Link to={`/practice/${p.id}`} className="library-row">
                      <span className={`library-row__status ${s.className}`} title={s.label}>
                        <StatusIcon size={18} />
                        <span className="sr-only">{s.label}</span>
                      </span>
                      <span className="library-row__main">
                        <span className="library-row__title">{p.title}</span>
                        <span className="library-row__summary">{p.summary}</span>
                      </span>
                      <span className="library-row__topic col-topic">{topicName(p.topic)}</span>
                      <span>
                        <DifficultyBadge level={p.difficulty} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No problems match your filters</p>
              <p className="muted">Try a different search term, topic or difficulty.</p>
            </div>
          )}
        </div>

        <div className="library-footer">
          <p className="muted">
            Showing {filtered.length} of {practiceProblems.length} problems
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
