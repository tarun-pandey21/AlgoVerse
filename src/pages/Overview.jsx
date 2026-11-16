import { ArrowRight, Sparkles, BookOpen, CheckCircle2, ListChecks, Flame, TrendingUp, PlayCircle, Code2, Bot, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import TopicCard from '../components/TopicCard';
import DailyChallenge from '../components/DailyChallenge';
import TopicProgressList from '../components/TopicProgressList';
import ProgressRing from '../components/ProgressRing';
import ActivityChart from '../components/ActivityChart';
import AIFeatureCard from '../components/AIFeatureCard';
import ProgressBar from '../components/ProgressBar';
import topics from '../data/topics';
import { getSectionTitle } from '../data/lessonSections';
import { useLearningProgress, getTopicStatus } from '../context/LearningProgressContext';
import aiFeatures from '../data/aiFeatures';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { useUser, firstNameOf } from '../context/UserContext';
import { useProgressData, DeviceDataNotice } from '../components/DataStatusBanner';
import useAIStatus from '../hooks/useAIStatus';
import './Overview.css';

function formatDate(ms) {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Placeholder for personal sections while data loads or if it failed to load. */
function PendingData({ loading, error }) {
  return (
    <div className="card card--padded pending-data" role={error ? 'alert' : 'status'}>
      {error ? <AlertTriangle size={18} /> : <Loader2 size={18} className="spin" />}
      <p>{error ? 'Your statistics can’t be shown because your progress didn’t load (see the message above).' : loading ? 'Loading your statistics…' : ''}</p>
    </div>
  );
}

/** First-visit guide: shown while the learner has no activity at all. */
function GettingStarted() {
  const steps = [
    { icon: BookOpen, title: 'Read your first lesson', text: 'Start with Fundamentals and mark sections as read.', to: '/learn/fundamentals', label: 'Open lesson' },
    { icon: Code2, title: 'Solve a practice problem', text: 'Submit a solution. Accepted answers count toward your streak.', to: '/practice', label: 'Browse problems' },
    { icon: Bot, title: 'Ask the AI Tutor', text: 'Stuck on a concept? Get a step-by-step explanation.', to: '/ai-tutor', label: 'Ask a question' },
  ];
  return (
    <section className="card card--padded getting-started" aria-label="Get started">
      <h2 className="panel-title">Get started</h2>
      <p className="muted">
        You don’t have any activity yet. Your statistics below start at zero and fill in as you learn and practise.
      </p>
      <ol className="getting-started__steps">
        {steps.map(({ icon: Icon, title, text, to, label }, i) => (
          <li key={title}>
            <span className="icon-tile tone-indigo">
              <Icon size={18} />
            </span>
            <div>
              <p className="getting-started__title">
                {i + 1}. {title}
              </p>
              <p className="muted">{text}</p>
            </div>
            <Button to={to} variant="soft" size="sm">
              {label}
            </Button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Dashboard home page:
 * A. Welcome  B. Stats  C. Continue Learning  D. Daily Challenge
 * E. Learning Progress  F. AI Assistant
 */
export default function Overview() {
  const { profile } = useUser();
  const firstName = firstNameOf(profile.name);
  const { summary, nextLesson, lastCompleted, getTopicStats } = useLearningProgress();
  const data = useProgressData();
  const { status: aiStatus } = useAIStatus();

  // Continue Learning shows 9 topics: in-progress first, then not started, then completed
  const statusOrder = { 'in-progress': 0, 'not-started': 1, completed: 2 };
  const featuredTopics = [...topics]
    .sort((a, b) => statusOrder[getTopicStatus(getTopicStats(a.id))] - statusOrder[getTopicStatus(getTopicStats(b.id))])
    .slice(0, 9);
  const { stats: practice } = usePracticeProgress();
  const weeklyActivity = practice.weeklyActivity;
  const problemsLeft = practice.total - practice.solvedCount;
  const isNewLearner = data.ready && summary.readSections === 0 && practice.submissionCount === 0;

  return (
    <div className="page">
      <DeviceDataNotice />
      {/* A. Welcome */}
      <section className="welcome card">
        <div className="welcome__text">
          <p className="welcome__eyebrow">
            <Sparkles size={14} strokeWidth={2.5} />
            {getGreeting()}
          </p>
          <h1 className="welcome__title">{firstName ? `Welcome back, ${firstName} 👋` : 'Welcome back!'}</h1>
          <p className="welcome__intro">
            AlgoVerse helps you learn Data Structures &amp; Algorithms through structured lessons, hands-on
            practice and an AI tutor powered by Claude.{' '}
            {data.ready &&
              (practice.currentStreak > 0
                ? `You’re on a ${practice.currentStreak}-day solving streak. Keep it going!`
                : 'Solve a problem today to start a solving streak.')}
          </p>
          <div className="welcome__actions">
            <Button to="/learn" size="lg" icon={BookOpen}>
              Start Learning
            </Button>
            <Button to="/ai-tutor" size="lg" variant="secondary" icon={Sparkles}>
              Ask AI Tutor
            </Button>
          </div>
        </div>

        {data.ready && nextLesson && (
          <div className="welcome__next">
            <p className="welcome__next-label">{nextLesson.percent > 0 || nextLesson.visitedAt ? 'Pick up where you left off' : 'Start here'}</p>
            <div className="welcome__next-topic">
              <span className={`icon-tile tone-${nextLesson.topic.tone}`}>
                <nextLesson.topic.icon size={20} />
              </span>
              <div>
                <p className="welcome__next-meta">
                  Lesson {nextLesson.lessonNumber} of {topics.length} · Up next: {getSectionTitle(nextLesson.nextSection)}
                </p>
                <p className="welcome__next-title">{nextLesson.topic.name}</p>
              </div>
            </div>
            <ProgressBar value={nextLesson.percent} label="Topic progress" />
            <Button
              to={`/learn/${nextLesson.topic.id}#${nextLesson.nextSection}`}
              variant="soft"
              icon={PlayCircle}
              fullWidth
            >
              {nextLesson.percent > 0 ? 'Resume Lesson' : 'Start Lesson'}
            </Button>
          </div>
        )}
      </section>

      {isNewLearner && <GettingStarted />}

      {/* B. Statistics */}
      {!data.ready ? (
        <PendingData loading={data.loading} error={data.error} />
      ) : (
      <section className="grid-stats" aria-label="Your statistics">
        <StatCard
          label="Problems Solved"
          value={practice.solvedCount}
          icon={CheckCircle2}
          tone="green"
          helper={practice.solvedCount ? `+${practice.solvedThisWeek} this week` : 'Submit a solution to get started'}
        />
        <StatCard
          label="Total Problems"
          value={practice.total}
          icon={ListChecks}
          tone="blue"
          helper={`${problemsLeft} left to solve`}
        />
        <StatCard
          label="Solving Streak"
          value={practice.currentStreak}
          suffix={practice.currentStreak === 1 ? 'day' : 'days'}
          icon={Flame}
          tone="orange"
          helper={`Best: ${practice.longestStreak} ${practice.longestStreak === 1 ? 'day' : 'days'}`}
        />
        <StatCard
          label="Overall Progress"
          value={`${summary.percent}%`}
          icon={TrendingUp}
          tone="indigo"
          progress={summary.percent}
          helper={`${summary.completedTopics} of ${summary.totalTopics} topics completed`}
        />
      </section>
      )}

      {/* C. Continue Learning */}
      <section className="section">
        <SectionHeader
          title="Continue Learning"
          description={`Pick up where you left off, or start one of ${topics.length} core topics.`}
          actionLabel="All topics"
          actionTo="/learn"
        />
        <div className="grid-cards">
          {featuredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </section>

      {/* D. Daily Coding Challenge */}
      <section className="section">
        <SectionHeader
          title="Daily Coding Challenge"
          description="One hand-picked problem every day to keep your skills sharp."
          actionLabel="Browse problems"
          actionTo="/practice"
        />
        <DailyChallenge />
      </section>

      {/* E. Learning Progress */}
      <section className="section">
        <SectionHeader
          title="Learning Progress"
          description="How far you've come in each topic."
          actionLabel="Detailed progress"
          actionTo="/progress"
        />
        {!data.ready ? (
          <PendingData loading={data.loading} error={data.error} />
        ) : (
        <div className="progress-grid">
          <div className="card card--padded">
            <h3 className="panel-title">Topic-wise progress</h3>
            <TopicProgressList topics={topics} />
          </div>

          <div className="progress-grid__side">
            <div className="card card--padded overall">
              <h3 className="panel-title">Overall completion</h3>
              <div className="overall__body">
                <ProgressRing value={summary.percent} caption="complete" />
                <dl className="overall__stats">
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
              </div>
              <p className="overall__last">
                {lastCompleted
                  ? <>Last completed: <strong>{lastCompleted.topic.name}</strong> on {formatDate(lastCompleted.completedAt)}</>
                  : 'No topics completed yet.'}
              </p>
            </div>

            <div className="card card--padded">
              <h3 className="panel-title">This week</h3>
              <ActivityChart data={weeklyActivity} />
            </div>
          </div>
        </div>
        )}
      </section>

      {/* F. AI Assistant */}
      <section className="section">
        <SectionHeader
          title="Your AI Learning Assistant"
          description="Claude-powered tools that explain, review and plan with you. Your API key stays on the server."
        />
        <div className="ai-grid">
          {aiFeatures.map((feature) => (
            <AIFeatureCard key={feature.id} feature={feature} aiState={aiStatus.state} />
          ))}
        </div>
        <div className="ai-banner">
          <p>
            <strong>Want a personal study plan?</strong> The AI Roadmap builds one from your real progress.
          </p>
          <Button to="/ai-roadmap" variant="secondary" size="sm" iconRight={ArrowRight}>
            Build my roadmap
          </Button>
        </div>
      </section>
    </div>
  );
}
