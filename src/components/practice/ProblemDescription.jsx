import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleDot } from 'lucide-react';
import Badge, { DifficultyBadge } from '../Badge';
import Button from '../Button';
import RichText from '../lesson/RichText';
import { describeInputFormat, describeOutputFormat } from '../../data/practice/io';
import { topicName } from '../../data/practice';

const STATUS_BADGE = {
  solved: { tone: 'success', icon: CheckCircle2, label: 'Solved' },
  attempted: { tone: 'warning', icon: CircleDot, label: 'Attempted' },
};

/** Shows stdin/stdout text, marking empty lines so they aren't invisible. */
function IoBlock({ label, text }) {
  return (
    <div className="io-block">
      <p className="io-block__label">{label}</p>
      <pre>{text === '' ? <span className="io-block__empty">(empty)</span> : text}</pre>
    </div>
  );
}

/**
 * Left side of the workspace: everything needed to understand the problem.
 */
export default function ProblemDescription({ problem, status, neighbors }) {
  const [hintsShown, setHintsShown] = useState(0);
  const badge = STATUS_BADGE[status];

  return (
    <article className="problem-desc">
      <header className="problem-desc__head">
        <h1>{problem.title}</h1>
        <div className="problem-desc__badges">
          <DifficultyBadge level={problem.difficulty} />
          <Badge tone="primary">{topicName(problem.topic)}</Badge>
          {badge && (
            <Badge tone={badge.tone} icon={badge.icon}>
              {badge.label}
            </Badge>
          )}
          {problem.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </header>

      <section className="problem-desc__section prose">
        {problem.description.map((p) => (
          <p key={p}>
            <RichText text={p} />
          </p>
        ))}
      </section>

      <section className="plain-words" aria-label="Explanation in plain words">
        <p className="plain-words__title">
          <Lightbulb size={16} /> In plain words
        </p>
        <p>
          <RichText text={problem.explanation} />
        </p>
      </section>

      <section className="problem-desc__section">
        <h2>Input format</h2>
        <ol className="format-list">
          {describeInputFormat(problem.signature).map((line) => (
            <li key={line}>
              <RichText text={line.charAt(0).toUpperCase() + line.slice(1)} />
            </li>
          ))}
        </ol>
        <h2>Output format</h2>
        <p className="format-text">
          <RichText text={describeOutputFormat(problem.signature)} />
        </p>
        <p className="format-note">
          The starter code already reads the input and prints your result, so you only need to write the{' '}
          <code className="inline-code">Solution</code> method.
        </p>
      </section>

      <section className="problem-desc__section">
        <h2>Constraints</h2>
        <ul className="constraint-list">
          {problem.constraints.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="problem-desc__section">
        <h2>Examples</h2>
        {problem.examples.map((ex, i) => (
          <div key={ex.stdin} className="example-card">
            <p className="example-card__title">Example {i + 1}</p>
            <dl>
              <dt>Input</dt>
              <dd>
                {ex.argsText.map((line) => (
                  <code key={line}>{line}</code>
                ))}
              </dd>
              <dt>Output</dt>
              <dd>
                <code>{ex.expectedText}</code>
              </dd>
              {ex.note && (
                <>
                  <dt>Why</dt>
                  <dd className="example-card__note">
                    <RichText text={ex.note} />
                  </dd>
                </>
              )}
            </dl>
            <div className="io-pair">
              <IoBlock label="Program reads (stdin)" text={ex.stdin.replace(/\n$/, '')} />
              <IoBlock label="Program prints (stdout)" text={ex.stdout} />
            </div>
          </div>
        ))}
      </section>

      {problem.sampleTests.length > 0 && (
        <section className="problem-desc__section">
          <h2>Additional test cases</h2>
          <p className="muted small">
            <strong>Run</strong> checks your code against the {problem.visibleTestCount} test cases on this page.{' '}
            <strong>Submit</strong> also runs hidden test cases, including edge cases and large inputs.
          </p>
          {problem.sampleTests.map((test) => (
            <details key={test.stdin} className="sample-test">
              <summary>
                Test case {test.index + 1}
                <span className="sample-test__preview">{test.argsText.join(', ').slice(0, 70)}</span>
              </summary>
              <div className="io-pair">
                <IoBlock label="Input (stdin)" text={test.stdin.replace(/\n$/, '')} />
                <IoBlock label="Expected output" text={test.stdout} />
              </div>
            </details>
          ))}
        </section>
      )}

      <section className="problem-desc__section">
        <h2>Hints</h2>
        <ol className="hint-list">
          {problem.hints.slice(0, hintsShown).map((hint, i) => (
            <li key={hint}>
              <Lightbulb size={16} />
              <span>
                <strong>Hint {i + 1}.</strong> <RichText text={hint} />
              </span>
            </li>
          ))}
        </ol>
        {hintsShown < problem.hints.length ? (
          <Button variant="soft" size="sm" icon={Lightbulb} onClick={() => setHintsShown((n) => n + 1)}>
            Reveal hint {hintsShown + 1} of {problem.hints.length}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setHintsShown(0)}>
            Hide hints
          </Button>
        )}
      </section>

      <section className="problem-desc__section problem-desc__learn">
        <BookOpen size={16} />
        <span>
          Need a refresher? <Link to={`/learn/${problem.topic}`}>Review the {topicName(problem.topic)} lesson</Link>.
        </span>
      </section>

      <nav className="problem-desc__nav" aria-label="Problem navigation">
        {neighbors.previous ? (
          <Link to={`/practice/${neighbors.previous.id}`} className="problem-nav-link">
            <span>
              <ArrowLeft size={14} /> Previous
            </span>
            <strong>{neighbors.previous.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {neighbors.next && (
          <Link to={`/practice/${neighbors.next.id}`} className="problem-nav-link problem-nav-link--next">
            <span>
              Next <ArrowRight size={14} />
            </span>
            <strong>{neighbors.next.title}</strong>
          </Link>
        )}
      </nav>
    </article>
  );
}
