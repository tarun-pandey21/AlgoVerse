import { useMemo, useState } from 'react';
import { Search, X, PlayCircle, BookOpen, Code2, MousePointerClick, Layers } from 'lucide-react';
import Button from '../components/Button';
import FilterTabs from '../components/FilterTabs';
import TopicCard from '../components/TopicCard';
import ProgressRing from '../components/ProgressRing';
import ProgressBar from '../components/ProgressBar';
import topics, { LEVELS } from '../data/topics';
import { getSectionTitle } from '../data/lessonSections';
import { useLearningProgress, getTopicStatus } from '../context/LearningProgressContext';
import './LearnDSA.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

/** Case-insensitive match on name, description, level and keywords. */
function matchesQuery(topic, query) {
  if (!query) return true;
  const haystack = [topic.name, topic.description, topic.level, ...topic.keywords].join(' ').toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/**
 * Learn DSA homepage: overall progress, level overview, and a searchable,
 * filterable catalogue of all 16 topics.
 */
export default function LearnDSA() {
  const { summary, nextLesson, getTopicStats } = useLearningProgress();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      topics.filter(
        (t) =>
          matchesQuery(t, query.trim()) &&
          (level === 'all' || t.level === level) &&
          (status === 'all' || getTopicStatus(getTopicStats(t.id)) === status)
      ),
    [query, level, status, getTopicStats]
  );

  const isFiltering = query.trim() !== '' || level !== 'all' || status !== 'all';
  const clearFilters = () => {
    setQuery('');
    setLevel('all');
    setStatus('all');
  };

  const levelTabs = [
    { key: 'all', label: 'All levels', count: topics.length },
    ...LEVELS.map((l) => ({ key: l.id, label: l.title, count: topics.filter((t) => t.level === l.id).length })),
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="learn-hero card">
        <div className="learn-hero__text">
          <p className="learn-hero__eyebrow">Learn DSA</p>
          <h1 className="learn-hero__title">Master Data Structures &amp; Algorithms</h1>
          <p className="learn-hero__intro">
            A structured path from programming fundamentals to dynamic programming. Every lesson explains the concept
            in plain language, then backs it up with runnable Java code, step-by-step walkthroughs, complexity analysis
            and practice problems.
          </p>
          <ul className="learn-hero__features">
            <li>
              <Layers size={15} /> {topics.length} topics
            </li>
            <li>
              <Code2 size={15} /> Java examples
            </li>
            <li>
              <MousePointerClick size={15} /> Interactive visualizations
            </li>
          </ul>
          <div className="learn-hero__actions">
            {nextLesson ? (
              <Button to={`/learn/${nextLesson.topic.id}#${nextLesson.nextSection}`} size="lg" icon={PlayCircle}>
                {nextLesson.percent > 0 ? `Continue: ${nextLesson.topic.name}` : `Start: ${nextLesson.topic.name}`}
              </Button>
            ) : (
              <Button to="/progress" size="lg" icon={PlayCircle}>
                Review your progress
              </Button>
            )}
            <Button to={`/learn/${topics[0].id}`} size="lg" variant="secondary" icon={BookOpen}>
              Lesson 1
            </Button>
          </div>
        </div>

        <div className="learn-hero__progress">
          <ProgressRing value={summary.percent} size={148} stroke={13} caption="overall" />
          <dl className="learn-hero__stats">
            <div>
              <dt>Topics completed</dt>
              <dd>
                {summary.completedTopics}/{summary.totalTopics}
              </dd>
            </div>
            <div>
              <dt>In progress</dt>
              <dd>{summary.inProgressTopics}</dd>
            </div>
            <div>
              <dt>Sections read</dt>
              <dd>
                {summary.readSections}/{summary.totalSections}
              </dd>
            </div>
          </dl>
          {nextLesson && (
            <p className="learn-hero__next">
              Up next: <strong>{nextLesson.topic.name}</strong> · {getSectionTitle(nextLesson.nextSection)}
            </p>
          )}
        </div>
      </section>

      {/* Level overview */}
      <section className="level-grid" aria-label="Levels">
        {LEVELS.map((lvl) => {
          const levelTopics = topics.filter((t) => t.level === lvl.id);
          const stats = levelTopics.map((t) => getTopicStats(t.id));
          const done = stats.filter((s) => s.completed).length;
          const percent = Math.round(stats.reduce((sum, s) => sum + s.percent, 0) / levelTopics.length);
          const active = level === lvl.id;
          return (
            <button
              key={lvl.id}
              className={`level-card card ${active ? 'level-card--active' : ''}`}
              onClick={() => setLevel(active ? 'all' : lvl.id)}
              aria-pressed={active}
            >
              <div className="level-card__top">
                <span className={`level-card__badge level-card__badge--${lvl.id.toLowerCase()}`}>{lvl.title}</span>
                <span className="level-card__count">
                  {done}/{levelTopics.length} done
                </span>
              </div>
              <p className="level-card__description">{lvl.description}</p>
              <ProgressBar value={percent} size="sm" label={`${lvl.title} progress`} />
              <span className="level-card__topics">{levelTopics.map((t) => t.name).join(' · ')}</span>
            </button>
          );
        })}
      </section>

      {/* Search + filters */}
      <section className="section">
        <div className="learn-toolbar">
          <label className="search-input">
            <Search size={17} />
            <span className="sr-only">Search topics</span>
            <input
              type="search"
              placeholder="Search topics, e.g. “binary search” or “stack”"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <FilterTabs ariaLabel="Filter by level" tabs={levelTabs} active={level} onChange={setLevel} />

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <p className="empty-state__title">No topics match your filters</p>
            <p className="muted">Try a different search term, or clear the filters.</p>
            <Button variant="secondary" size="sm" icon={X} onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : isFiltering ? (
          <>
            <div className="learn-results-bar">
              <p className="muted">
                {filtered.length} topic{filtered.length === 1 ? '' : 's'} found
              </p>
              <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
            <div className="grid-cards">
              {filtered.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </>
        ) : (
          LEVELS.map((lvl) => (
            <div key={lvl.id} className="level-group">
              <div className="level-group__head">
                <h2>{lvl.title}</h2>
                <p>{lvl.description}</p>
              </div>
              <div className="grid-cards">
                {topics
                  .filter((t) => t.level === lvl.id)
                  .map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
