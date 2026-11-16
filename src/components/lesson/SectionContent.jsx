import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Info, CircleDot, Circle, Code2 } from 'lucide-react';
import RichText from './RichText';
import CodeBlock from './CodeBlock';
import LanguageSelector from './LanguageSelector';
import useCodeLanguage from '../../hooks/useCodeLanguage';
import { getLanguage } from '../../data/languages';
import Button from '../Button';
import { DifficultyBadge } from '../Badge';
import { getPracticeProblem } from '../../data/practice';
import { usePracticeProgress } from '../../context/PracticeProgressContext';
import './SectionContent.css';

/* Each lesson section has its own small renderer. SectionContent picks the right one by key. */

function Introduction({ lesson }) {
  return (
    <div className="prose">
      {lesson.introduction.map((p) => (
        <p key={p}>
          <RichText text={p} />
        </p>
      ))}
    </div>
  );
}

/** Language-specific tips that switch with the selected code language. */
function LanguageNotes({ notes }) {
  const { language } = useCodeLanguage();
  const items = notes[language] ?? [];
  if (!items.length) return null;
  return (
    <aside className="lang-notes" aria-label={`${getLanguage(language).label} notes`}>
      <div className="lang-notes__head">
        <p className="lang-notes__title">
          <span className={`lang-dot lang-dot--${language}`} aria-hidden="true" />
          In {getLanguage(language).label}
        </p>
        <LanguageSelector size="sm" label="Language for these notes" />
      </div>
      <ul className="bullet-list">
        {items.map((item) => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Concepts({ lesson }) {
  return (
    <div className="concepts">
      {lesson.concepts.map((concept) => (
        <div key={concept.heading} className="concept">
          <h4>{concept.heading}</h4>
          <div className="prose">
            {concept.paragraphs.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </div>
          {concept.points && (
            <ul className="bullet-list">
              {concept.points.map((point) => (
                <li key={point}>
                  <RichText text={point} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {lesson.languageNotes && <LanguageNotes notes={lesson.languageNotes} />}
    </div>
  );
}

function Applications({ lesson }) {
  return (
    <div className="applications">
      {lesson.applications.map((app, i) => (
        <div key={app.title} className="application">
          <span className="application__index">{String(i + 1).padStart(2, '0')}</span>
          <h4>{app.title}</h4>
          <p>
            <RichText text={app.description} />
          </p>
        </div>
      ))}
    </div>
  );
}

function Terminology({ lesson }) {
  return (
    <dl className="terms">
      {lesson.terminology.map(({ term, definition }) => (
        <div key={term} className="term">
          <dt>{term}</dt>
          <dd>
            <RichText text={definition} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CodeExamples({ lesson }) {
  return (
    <div>
      <div className="code-language-bar">
        <p>
          Every example is available in <strong>Java</strong>, <strong>C++</strong> and <strong>Python</strong>. The
          explanation is the same; only the code changes. Your choice is saved and used on every lesson.
        </p>
        <LanguageSelector />
      </div>
      {lesson.examples.map((example) => (
        <CodeBlock key={example.title} example={example} />
      ))}
    </div>
  );
}

function Algorithm({ lesson }) {
  const { title, steps, dryRun } = lesson.algorithm;
  return (
    <div className="algorithm">
      <h4>{title}</h4>
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step}>
            <span className="steps__number">{i + 1}</span>
            <p>
              <RichText text={step} />
            </p>
          </li>
        ))}
      </ol>
      {dryRun && (
        <div className="dry-run">
          <p className="dry-run__title">{dryRun.title}</p>
          <ol>
            {dryRun.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Wraps Big-O values like "O(n log n)" in a styled chip. */
function ComplexityCell({ value }) {
  if (/^O\(/.test(value) && value.length < 24) return <code className="big-o">{value}</code>;
  return <RichText text={value} />;
}

function Complexity({ lesson }) {
  const { columns, rows, note } = lesson.complexity;
  return (
    <div className="complexity">
      <div className="table-scroll">
        <table className="complexity-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join('|')}>
                {row.map((cell, i) => (
                  <td key={i}>{i === 0 ? <strong>{cell}</strong> : <ComplexityCell value={cell} />}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <p className="callout">
          <Info size={16} />
          <span>
            <RichText text={note} />
          </span>
        </p>
      )}
    </div>
  );
}

function Mistakes({ lesson }) {
  return (
    <ul className="mistakes">
      {lesson.mistakes.map(({ mistake, fix }) => (
        <li key={mistake} className="mistake">
          <p className="mistake__problem">
            <XCircle size={17} />
            <span>
              <RichText text={mistake} />
            </span>
          </p>
          <p className="mistake__fix">
            <CheckCircle2 size={17} />
            <span>
              <RichText text={fix} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function Takeaways({ lesson }) {
  return (
    <ul className="takeaways">
      {lesson.takeaways.map((t) => (
        <li key={t}>
          <CheckCircle2 size={18} />
          <span>
            <RichText text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const STATUS = {
  solved: { icon: CheckCircle2, className: 'status--solved', label: 'Solved' },
  attempted: { icon: CircleDot, className: 'status--attempted', label: 'Attempted' },
  todo: { icon: Circle, className: 'status--todo', label: 'Not attempted' },
};

function Practice({ lesson, topic }) {
  const { getProblemStatus } = usePracticeProgress();
  const problems = lesson.practice.map(getPracticeProblem).filter(Boolean);
  return (
    <div className="practice-list">
      <p className="prose-lead">Put this lesson into practice with these related problems. Each one opens in the code editor:</p>
      <ul>
        {problems.map((p) => {
          const status = STATUS[getProblemStatus(p.id)];
          const StatusIcon = status.icon;
          return (
            <li key={p.id}>
              <Link to={`/practice/${p.id}`} className="practice-item">
                <span className={status.className} title={status.label}>
                  <StatusIcon size={18} />
                </span>
                <span className="practice-item__title">{p.title}</span>
                <DifficultyBadge level={p.difficulty} />
                <ArrowRight size={16} className="practice-item__arrow" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Button to={`/practice?topic=${topic.id}`} variant="secondary" size="sm" icon={Code2}>
        All {topic.name} problems
      </Button>
    </div>
  );
}

const RENDERERS = {
  introduction: Introduction,
  concepts: Concepts,
  applications: Applications,
  terminology: Terminology,
  code: CodeExamples,
  algorithm: Algorithm,
  complexity: Complexity,
  mistakes: Mistakes,
  takeaways: Takeaways,
  practice: Practice,
};

export default function SectionContent({ sectionKey, lesson, topic }) {
  const Renderer = RENDERERS[sectionKey];
  return Renderer ? <Renderer lesson={lesson} topic={topic} /> : null;
}
