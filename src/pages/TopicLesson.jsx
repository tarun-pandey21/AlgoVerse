import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  RotateCcw,
  ChevronsUpDown,
  ChevronsDownUp,
  Trophy,
  BarChart3,
  BookOpen,
  Bot,
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import ProgressRing from '../components/ProgressRing';
import LessonSection from '../components/lesson/LessonSection';
import SectionContent from '../components/lesson/SectionContent';
import RichText from '../components/lesson/RichText';
import VisualizerPanel from '../components/visualizer/VisualizerPanel';
import LanguageSelector from '../components/lesson/LanguageSelector';
import LESSON_SECTIONS, { SECTION_KEYS } from '../data/lessonSections';
import topics, { getTopicById, getTopicIndex } from '../data/topics';
import lessons from '../data/lessons';
import { useLearningProgress } from '../context/LearningProgressContext';
import NotFound from './NotFound';
import './TopicLesson.css';

/** Route wrapper: remounts the lesson view when the topic changes. */
export default function TopicLesson() {
  const { topicId } = useParams();
  const topic = getTopicById(topicId);
  const lesson = lessons[topicId];
  if (!topic || !lesson) return <NotFound />;
  return <LessonView key={topic.id} topic={topic} lesson={lesson} />;
}

function scrollToSection(key) {
  // Wait a frame so a just-opened section has rendered before scrolling
  requestAnimationFrame(() =>
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  );
}

function LessonView({ topic, lesson }) {
  const { hash } = useLocation();
  const {
    getTopicStats,
    isSectionRead,
    setSectionRead,
    markTopicComplete,
    resetTopic,
    recordVisit,
  } = useLearningProgress();

  const stats = getTopicStats(topic.id);
  const index = getTopicIndex(topic.id);
  const prevTopic = topics[index - 1];
  const nextTopic = topics[index + 1];
  const Icon = topic.icon;

  // Open the section from the URL hash, else the first unread one
  const [openSections, setOpenSections] = useState(() => {
    const fromHash = hash.replace('#', '');
    if (SECTION_KEYS.includes(fromHash)) return new Set([fromHash]);
    const firstUnread = SECTION_KEYS.find((k) => !isSectionRead(topic.id, k));
    return new Set([firstUnread ?? 'introduction']);
  });

  // Record the visit (drives "pick up where you left off") and honour the hash
  useEffect(() => {
    recordVisit(topic.id);
    const fromHash = hash.replace('#', '');
    if (SECTION_KEYS.includes(fromHash)) scrollToSection(fromHash);
    // Run once per lesson
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  const toggleSection = useCallback((key) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const openAndScroll = (key) => {
    setOpenSections((current) => new Set(current).add(key));
    scrollToSection(key);
  };

  /** Mark a section read, close it, and move on to the next unread section. */
  const continueFrom = (key) => {
    setSectionRead(topic.id, key, true);
    const after = SECTION_KEYS.slice(SECTION_KEYS.indexOf(key) + 1);
    const nextKey = after.find((k) => !isSectionRead(topic.id, k)) ?? after[0];
    setOpenSections((current) => {
      const next = new Set(current);
      next.delete(key);
      if (nextKey) next.add(nextKey);
      return next;
    });
    if (nextKey) scrollToSection(nextKey);
    else requestAnimationFrame(() => document.getElementById('lesson-complete')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const allOpen = openSections.size === SECTION_KEYS.length;
  const toggleAll = () => setOpenSections(allOpen ? new Set() : new Set(SECTION_KEYS));

  const completeTopic = () => {
    markTopicComplete(topic.id);
    requestAnimationFrame(() => document.getElementById('lesson-complete')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const completionButton = stats.completed ? (
    <Button variant="ghost" icon={RotateCcw} onClick={() => resetTopic(topic.id)}>
      Reset progress
    </Button>
  ) : (
    <Button icon={CheckCircle2} onClick={completeTopic}>
      Mark as Completed
    </Button>
  );

  return (
    <div className="page lesson-page">
      <Link to="/learn" className="back-link">
        <ArrowLeft size={16} /> All topics
      </Link>

      {/* Hero */}
      <header className="lesson-hero card">
        <div className="lesson-hero__main">
          <span className={`icon-tile icon-tile--lg tone-${topic.tone}`}>
            <Icon size={26} />
          </span>
          <div className="lesson-hero__text">
            <div className="lesson-hero__badges">
              <Badge tone="primary">
                Lesson {index + 1} of {topics.length}
              </Badge>
              <Badge>{topic.level}</Badge>
              <Badge icon={Clock}>{topic.readingTime} min read</Badge>
              {stats.completed && (
                <Badge tone="success" icon={CheckCircle2}>
                  Completed
                </Badge>
              )}
            </div>
            <h1 className="lesson-hero__title">{topic.name}</h1>
            <p className="lesson-hero__summary">
              <RichText text={lesson.summary} />
            </p>
          </div>
        </div>

        <div className="lesson-hero__progress">
          <div className="lesson-hero__progress-text">
            <span>
              <strong>{stats.read}</strong> of {stats.total} sections read
            </span>
            <span>{stats.percent}%</span>
          </div>
          <ProgressBar value={stats.percent} tone={stats.completed ? 'success' : 'primary'} label="Lesson progress" />
        </div>

        <div className="lesson-hero__actions">
          {completionButton}
          <Button variant="secondary" icon={allOpen ? ChevronsDownUp : ChevronsUpDown} onClick={toggleAll}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </Button>
          <Button variant="ghost" icon={Bot} to={`/ai-tutor?topic=${topic.id}`}>
            Ask AI Tutor
          </Button>
        </div>
      </header>

      <div className="lesson-layout">
        {/* Sections */}
        <div className="lesson-sections">
          {LESSON_SECTIONS.map((section, i) => (
            <div key={section.key} className="lesson-sections__item">
              <LessonSection
                section={section}
                index={i}
                isOpen={openSections.has(section.key)}
                isRead={isSectionRead(topic.id, section.key)}
                isLast={i === LESSON_SECTIONS.length - 1}
                onToggle={() => toggleSection(section.key)}
                onToggleRead={() => setSectionRead(topic.id, section.key, !isSectionRead(topic.id, section.key))}
                onContinue={() => continueFrom(section.key)}
              >
                <SectionContent sectionKey={section.key} lesson={lesson} topic={topic} />
              </LessonSection>

              {/* Visualizations sit right after the concept explanation */}
              {section.key === 'concepts' && lesson.visualizers && <VisualizerPanel visualizers={lesson.visualizers} />}
            </div>
          ))}

          {/* Completion */}
          <div id="lesson-complete" className={`lesson-complete card ${stats.completed ? 'lesson-complete--done' : ''}`}>
            {stats.completed ? (
              <>
                <span className="icon-tile icon-tile--lg tone-green">
                  <Trophy size={26} />
                </span>
                <div className="lesson-complete__text">
                  <h3>You&apos;ve completed {topic.name}!</h3>
                  <p>
                    {nextTopic
                      ? `Next up is ${nextTopic.name}. Keep the momentum going.`
                      : 'That was the final lesson. You have worked through the whole curriculum!'}
                  </p>
                </div>
                {nextTopic ? (
                  <Button to={`/learn/${nextTopic.id}`} iconRight={ArrowRight}>
                    Next lesson
                  </Button>
                ) : (
                  <Button to="/progress" icon={BarChart3}>
                    View my progress
                  </Button>
                )}
              </>
            ) : (
              <>
                <span className="icon-tile icon-tile--lg tone-indigo">
                  <CheckCircle2 size={26} />
                </span>
                <div className="lesson-complete__text">
                  <h3>Finished this lesson?</h3>
                  <p>
                    You&apos;ve read {stats.read} of {stats.total} sections. Mark the topic as completed to record it in
                    your progress.
                  </p>
                </div>
                <Button icon={CheckCircle2} onClick={completeTopic}>
                  Mark as Completed
                </Button>
              </>
            )}
          </div>

          {/* Previous / next lesson */}
          <nav className="lesson-nav" aria-label="Lesson navigation">
            {prevTopic ? (
              <Link to={`/learn/${prevTopic.id}`} className="lesson-nav__link card">
                <span className="lesson-nav__label">
                  <ArrowLeft size={15} /> Previous lesson
                </span>
                <span className="lesson-nav__name">{prevTopic.name}</span>
              </Link>
            ) : (
              <Link to="/learn" className="lesson-nav__link card">
                <span className="lesson-nav__label">
                  <ArrowLeft size={15} /> Back to
                </span>
                <span className="lesson-nav__name">All topics</span>
              </Link>
            )}
            {nextTopic ? (
              <Link to={`/learn/${nextTopic.id}`} className="lesson-nav__link lesson-nav__link--next card">
                <span className="lesson-nav__label">
                  Next lesson <ArrowRight size={15} />
                </span>
                <span className="lesson-nav__name">{nextTopic.name}</span>
              </Link>
            ) : (
              <Link to="/progress" className="lesson-nav__link lesson-nav__link--next card">
                <span className="lesson-nav__label">
                  Finished <ArrowRight size={15} />
                </span>
                <span className="lesson-nav__name">View my progress</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar: progress + table of contents */}
        <aside className="lesson-aside">
          <div className="card lesson-aside__card">
            <div className="lesson-aside__progress">
              <ProgressRing value={stats.percent} size={96} stroke={9}>
                <span className="lesson-aside__percent">{stats.percent}%</span>
              </ProgressRing>
              <div>
                <p className="lesson-aside__title">Your progress</p>
                <p className="lesson-aside__meta">
                  {stats.read}/{stats.total} sections
                </p>
              </div>
            </div>

            <p className="lesson-aside__heading">On this page</p>
            <ol className="toc">
              {LESSON_SECTIONS.map((section) => {
                const read = isSectionRead(topic.id, section.key);
                const open = openSections.has(section.key);
                return (
                  <li key={section.key}>
                    <button
                      className={`toc__item ${open ? 'toc__item--open' : ''} ${read ? 'toc__item--read' : ''}`}
                      onClick={() => openAndScroll(section.key)}
                    >
                      {read ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      <span>{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {stats.completed ? (
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => resetTopic(topic.id)} fullWidth>
                Reset progress
              </Button>
            ) : (
              <Button size="sm" icon={CheckCircle2} onClick={completeTopic} fullWidth>
                Mark as Completed
              </Button>
            )}
          </div>

          <div className="card lesson-aside__card lesson-aside__lang">
            <p className="lesson-aside__heading">Code language</p>
            <LanguageSelector />
            <p className="lesson-aside__meta">Saved for every lesson.</p>
          </div>

          <Link to="/learn" className="lesson-aside__all">
            <BookOpen size={15} /> Browse all {topics.length} topics
          </Link>
        </aside>
      </div>
    </div>
  );
}
