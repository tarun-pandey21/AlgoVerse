import { Link } from 'react-router-dom';
import { CheckCircle2, BookOpen, Flame, Trophy, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import TopicProgressList from '../components/TopicProgressList';
import ActivityChart from '../components/ActivityChart';
import ProgressBar from '../components/ProgressBar';
import ProgressRing from '../components/ProgressRing';
import topics from '../data/topics';
import { useLearningProgress } from '../context/LearningProgressContext';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { getPracticeProblem } from '../data/practice';
import { getLanguage } from '../data/languages';
import { useProgressData, DeviceDataNotice } from '../components/DataStatusBanner';
import './MyProgress.css';

const VERDICT_TEXT = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  compilation_error: 'Compilation Error',
  runtime_error: 'Runtime Error',
  time_limit_exceeded: 'Time Limit Exceeded',
  internal_error: 'Execution Error',
};

function timeAgo(iso) {
  const seconds = Math.round((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

export default function MyProgress() {
  const { summary, lastCompleted, nextLesson } = useLearningProgress();
  const { stats, submissions } = usePracticeProgress();
  const data = useProgressData();
  const solvedPercent = stats.percent;
  const recentSubmissions = [...submissions].reverse().slice(0, 8);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analytics"
        title="My Progress"
        description="A complete picture of your learning: lessons, problems, streaks and recent activity."
      />
      <DeviceDataNotice />

      {!data.ready ? (
        <div className="card card--padded pending-data" role={data.error ? 'alert' : 'status'}>
          {data.error ? <AlertTriangle size={18} /> : <Loader2 size={18} className="spin" />}
          <p>{data.error ? 'Your progress can’t be shown because it didn’t load (see the message above).' : 'Loading your progress…'}</p>
        </div>
      ) : (
      <>

      <section className="grid-stats" aria-label="Progress summary">
        <StatCard
          label="Topics Completed"
          value={summary.completedTopics}
          suffix={`/ ${summary.totalTopics}`}
          icon={BookOpen}
          tone="indigo"
          progress={summary.percent}
        />
        <StatCard
          label="Problems Solved"
          value={stats.solvedCount}
          suffix={`/ ${stats.total}`}
          icon={CheckCircle2}
          tone="green"
          progress={solvedPercent}
        />
        <StatCard label="Solving Streak" value={stats.currentStreak} suffix={stats.currentStreak === 1 ? 'day' : 'days'} icon={Flame} tone="orange" helper="Solve one problem a day to keep it alive" />
        <StatCard label="Longest Streak" value={stats.longestStreak} suffix={stats.longestStreak === 1 ? 'day' : 'days'} icon={Trophy} tone="amber" helper={stats.accuracy === null ? 'Your personal best' : `Submission accuracy: ${stats.accuracy}%`} />
      </section>

      <section className="card card--padded lesson-activity">
        <h2 className="panel-title">Lessons</h2>
        <p>
          {lastCompleted ? (
            <>
              Last completed: <Link to={`/learn/${lastCompleted.topic.id}`} className="inline-link">{lastCompleted.topic.name}</Link> on{' '}
              {new Date(lastCompleted.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </>
          ) : (
            'No topics completed yet.'
          )}
          {nextLesson?.visitedAt && (
            <>
              {' '}· Last opened: <Link to={`/learn/${nextLesson.topic.id}`} className="inline-link">{nextLesson.topic.name}</Link> ({timeAgo(new Date(nextLesson.visitedAt).toISOString())})
            </>
          )}
        </p>
      </section>

      <div className="progress-page-grid">
        <section className="card card--padded">
          <h2 className="panel-title">Topic-wise progress</h2>
          <TopicProgressList topics={topics} />
        </section>

        <div className="progress-page-grid__side">
          <section className="card card--padded">
            <h2 className="panel-title">Problems by difficulty</h2>
            <div className="difficulty">
              <ProgressRing value={solvedPercent} size={120} stroke={10} caption="solved" />
              <ul className="difficulty__list">
                {stats.byDifficulty.map((d) => ({ ...d, tone: DIFFICULTY_TONE[d.level] })).map((d) => (
                  <li key={d.level}>
                    <div className="difficulty__labels">
                      <span className={`difficulty__dot difficulty__dot--${d.tone}`} />
                      <span className="difficulty__level">{d.level}</span>
                      <span className="difficulty__count">
                        {d.solved}
                        <span>/{d.total}</span>
                      </span>
                    </div>
                    <ProgressBar value={(d.solved / d.total) * 100} tone={d.tone} size="sm" label={`${d.level} problems`} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card card--padded">
            <h2 className="panel-title">Weekly activity</h2>
            <ActivityChart data={stats.weeklyActivity} />
          </section>
        </div>
      </div>

      <section className="card card--padded">
        <h2 className="panel-title">Recent submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="muted">
            No submissions yet. Head to <Link to="/practice" className="inline-link">Practice Problems</Link> and submit
            a solution. Your history will appear here.
          </p>
        ) : (
          <ul className="timeline">
            {recentSubmissions.map((s) => {
              const problem = getPracticeProblem(s.problemId);
              const accepted = s.verdict === 'accepted';
              const Icon = accepted ? CheckCircle2 : XCircle;
              return (
                <li key={s.id} className="timeline__item">
                  <span className={`icon-tile icon-tile--sm tone-${accepted ? 'green' : 'rose'}`}>
                    <Icon size={16} />
                  </span>
                  <div className="timeline__body">
                    <p className="timeline__title">
                      <Link to={`/practice/${s.problemId}`}>{problem?.title ?? s.problemId}</Link>
                    </p>
                    <p className="timeline__meta">
                      {VERDICT_TEXT[s.verdict]} · {getLanguage(s.language).label} · {s.passed}/{s.total} tests passed
                    </p>
                  </div>
                  <span className="timeline__time">{timeAgo(s.submittedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </>
      )}
    </div>
  );
}
