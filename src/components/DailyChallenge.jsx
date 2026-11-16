import { useEffect, useState } from 'react';
import { Zap, Clock, ArrowRight, Timer, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import Badge, { DifficultyBadge } from './Badge';
import RichText from './lesson/RichText';
import { getDailyProblem, topicName, ESTIMATED_MINUTES } from '../data/practice';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import './DailyChallenge.css';

/** "5h 12m" until local midnight, when the next challenge unlocks. */
function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const minutes = Math.floor((midnight - now) / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Today's featured problem from the practice library (rotates daily). */
export default function DailyChallenge() {
  const problem = getDailyProblem();
  const example = problem.examples[0];
  const { getProblemStatus } = usePracticeProgress();
  const solved = getProblemStatus(problem.id) === 'solved';
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight);

  // Refresh the countdown once a minute
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeUntilMidnight()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <article className="challenge card">
      <div className="challenge__content">
        <div className="challenge__eyebrow">
          <span className="challenge__label">
            <Zap size={14} strokeWidth={2.5} />
            Today&apos;s Challenge
          </span>
          <span className="challenge__timer">
            <Timer size={14} />
            New challenge in {timeLeft}
          </span>
        </div>

        <h3 className="challenge__title">{problem.title}</h3>

        <div className="challenge__badges">
          <DifficultyBadge level={problem.difficulty} />
          <Badge tone="primary">{topicName(problem.topic)}</Badge>
          {problem.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          {solved && (
            <Badge tone="success" icon={CheckCircle2}>
              Solved
            </Badge>
          )}
        </div>

        <p className="challenge__description">
          <RichText text={problem.description[0]} />
        </p>

        <div className="challenge__footer">
          <div className="challenge__meta">
            <span>
              <Clock size={15} /> ~{ESTIMATED_MINUTES[problem.difficulty]} min
            </span>
            <span>Java · C++ · Python</span>
          </div>
          <Button to={`/practice/${problem.id}`} iconRight={ArrowRight}>
            {solved ? 'Solve Again' : 'Start Challenge'}
          </Button>
        </div>
      </div>

      {/* Example panel: the problem's first worked example */}
      {example && (
        <div className="challenge__example" aria-label="Example">
          <div className="challenge__example-bar">
            <span />
            <span />
            <span />
            <p>example 1</p>
          </div>
          <pre className="challenge__code">
            <span className="code-comment">{'// Input'}</span>
            {'\n'}
            {example.argsText.join('\n')}
            {'\n\n'}
            <span className="code-comment">{'// Output'}</span>
            {'\n'}
            <span className="code-accent">{example.expectedText}</span>
            {example.note && (
              <>
                {'\n\n'}
                <span className="code-comment">{'// Why'}</span>
                {'\n'}
                {example.note}
              </>
            )}
          </pre>
        </div>
      )}
    </article>
  );
}
