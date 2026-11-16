import { useEffect, useRef, useState } from 'react';
import { Wand2, Square, Lightbulb, Eye, EyeOff, Bot, ListChecks, FlaskConical, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge, { DifficultyBadge } from '../components/Badge';
import LanguageSelector from '../components/lesson/LanguageSelector';
import Markdown, { InlineMarkdown } from '../components/ai/Markdown';
import AINotice, { AIFootnote, AIAccessNotice } from '../components/ai/AINotice';
import useAIStatus from '../hooks/useAIStatus';
import useCodeLanguage from '../hooks/useCodeLanguage';
import { generateQuestions } from '../services/aiApi';
import topics from '../data/topics';
import { getLanguage } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import { scopedKey } from '../lib/scopedStorage';
import '../components/ai/AI.css';
import './AIQuestions.css';

const STORAGE_BASE = 'algoverse.ai.questions.v1';
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function loadSaved(STORAGE_KEY) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.questions)) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

function QuestionCard({ question, index, language }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [showApproach, setShowApproach] = useState(false);
  const hints = Array.isArray(question.hints) ? question.hints : [];
  const examples = Array.isArray(question.examples) ? question.examples : [];
  const constraints = Array.isArray(question.constraints) ? question.constraints : [];
  const tutorPrompt = `I'm working on this practice problem and want a hint (not the full solution yet):\n\n${question.title}\n${question.statement}`.slice(0, 1800);

  return (
    <article className="card question">
      <header className="question__head">
        <span className="question__number">{index + 1}</span>
        <h2 className="question__title">
          <InlineMarkdown text={question.title} />
        </h2>
        <div className="question__badges">
          {DIFFICULTIES.includes(question.difficulty) && <DifficultyBadge level={question.difficulty} />}
          {question.topic && <Badge tone="primary">{question.topic}</Badge>}
        </div>
      </header>

      <Markdown text={question.statement ?? ''} />

      {question.signature && <Markdown text={`\`\`\`${language}\n${question.signature.replace(/^```\w*\n?|```\s*$/g, '')}\n\`\`\``} />}

      {examples.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <FlaskConical size={16} /> Examples
          </h3>
          <div className="question__examples">
            {examples.map((ex, i) => (
              <div key={i} className="example">
                <p className="example__label">Example {i + 1}</p>
                <p>
                  <span className="example__key">Input:</span> <code className="example__code">{ex.input}</code>
                </p>
                <p>
                  <span className="example__key">Output:</span> <code className="example__code">{ex.output}</code>
                </p>
                {ex.explanation && (
                  <p className="example__explain">
                    <InlineMarkdown text={ex.explanation} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {constraints.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <ListChecks size={16} /> Constraints
          </h3>
          <ul className="ai-list">
            {constraints.map((c, i) => (
              <li key={i}>
                <InlineMarkdown text={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hints.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <Lightbulb size={16} /> Hints
          </h3>
          {hintsShown > 0 && (
            <ol className="question__hints">
              {hints.slice(0, hintsShown).map((h, i) => (
                <li key={i}>
                  <InlineMarkdown text={h} />
                </li>
              ))}
            </ol>
          )}
          {hintsShown < hints.length && (
            <Button variant="soft" size="sm" icon={Lightbulb} onClick={() => setHintsShown((n) => n + 1)}>
              {hintsShown === 0 ? 'Show first hint' : `Show hint ${hintsShown + 1} of ${hints.length}`}
            </Button>
          )}
        </section>
      )}

      <footer className="question__footer">
        {question.approach && (
          <Button variant="ghost" size="sm" icon={showApproach ? EyeOff : Eye} onClick={() => setShowApproach((v) => !v)}>
            {showApproach ? 'Hide approach' : 'Reveal approach'}
          </Button>
        )}
        <Button variant="secondary" size="sm" icon={Bot} to={`/ai-tutor?q=${encodeURIComponent(tutorPrompt)}`}>
          Discuss with AI Tutor
        </Button>
      </footer>
      {showApproach && (
        <div className="question__approach">
          <Markdown text={question.approach} />
        </div>
      )}
    </article>
  );
}

export default function AIQuestions() {
  const { user } = useAuth();
  const storageKey = scopedKey(STORAGE_BASE, user?.id);
  const { status, refresh } = useAIStatus();
  const { language } = useCodeLanguage();
  const saved = useRef(loadSaved(storageKey)).current;

  const [topic, setTopic] = useState(saved?.request?.topic ?? topics[1].name);
  const [difficulty, setDifficulty] = useState(saved?.request?.difficulty ?? 'Easy');
  const [count, setCount] = useState(saved?.request?.count ?? 1);
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(saved); // { questions, language, model, request }
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const ready = status.state === 'ready';

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = async () => {
    if (!ready || pending) return;
    setError(null);
    setPending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const request = { topic, difficulty, language, count, focus: focus.trim() || undefined };
    const response = await generateQuestions(request, controller.signal);
    abortRef.current = null;
    setPending(false);
    if (response.ok) {
      const questions = Array.isArray(response.data.questions) ? response.data.questions.filter((q) => q && q.title && q.statement) : [];
      if (!questions.length) {
        setError({ kind: 'error', message: 'Claude returned no usable questions. Please try again.' });
        return;
      }
      const next = { questions, language, model: response.model, request };
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

  return (
    <div className="page questions-page">
      <PageHeader
        eyebrow="AI Tools"
        title="Question Generator"
        description="Generate original practice problems on any DSA topic, with examples, constraints and progressive hints."
      />

      {status.state === 'not_configured' && <AINotice kind="not_configured" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      {status.state === 'unavailable' && <AINotice kind="unavailable" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      <AIAccessNotice status={status} />

      <section className="card card--padded">
        <form
          className="ai-form"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
        >
          <div className="ai-form__row">
            <label className="ai-field">
              <span className="ai-field__label">Topic</span>
              <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {topics.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="ai-field">
              <span className="ai-field__label" id="difficulty-label">
                Difficulty
              </span>
              <div className="ai-chips" role="group" aria-labelledby="difficulty-label">
                {DIFFICULTIES.map((d) => (
                  <button key={d} type="button" className="ai-chip" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="ai-field">
              <span className="ai-field__label">Language</span>
              <LanguageSelector size="sm" label="Language for the function signature" />
            </div>
            <div className="ai-field">
              <span className="ai-field__label" id="count-label">
                How many
              </span>
              <div className="ai-chips" role="group" aria-labelledby="count-label">
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" className="ai-chip" aria-pressed={count === n} onClick={() => setCount(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="ai-field">
            <span className="ai-field__label">Anything specific? (optional)</span>
            <input
              className="ai-input"
              value={focus}
              maxLength={300}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. interview-style, uses a sliding window, about strings"
            />
          </label>
          <div className="questions__actions">
            {result && !pending && (
              <Button variant="ghost" icon={Trash2} onClick={clear}>
                Clear
              </Button>
            )}
            {pending ? (
              <Button variant="secondary" icon={Square} onClick={() => abortRef.current?.abort()}>
                Cancel
              </Button>
            ) : (
              <Button type="submit" icon={Wand2} disabled={!ready}>
                Generate {count > 1 ? `${count} questions` : 'question'}
              </Button>
            )}
          </div>
        </form>
      </section>

      {error && <AINotice kind={error.kind} message={error.message} onRetry={error.kind === 'rate_limited' ? undefined : generate} />}

      {pending ? (
        <div className="card ai-loading" role="status">
          <span className="ai-spinner" />
          Claude is writing {count > 1 ? `${count} ${difficulty.toLowerCase()} questions` : `a ${difficulty.toLowerCase()} question`} on {topic}…
        </div>
      ) : result ? (
        <div className="questions">
          <p className="analysis-note">
            {result.questions.length} question{result.questions.length > 1 ? 's' : ''} on <strong>{result.request.topic}</strong> ({result.request.difficulty}),
            signatures in {getLanguage(result.language).label}. AI-generated problems can contain mistakes, so check the examples as you solve them.
          </p>
          {result.questions.map((q, i) => (
            <QuestionCard key={`${result.model}-${i}-${q.title}`} question={q} index={i} language={result.language} />
          ))}
          <AIFootnote model={result.model} />
        </div>
      ) : (
        !error && (
          <div className="card ai-empty">
            <span className="icon-tile icon-tile--lg tone-violet">
              <Wand2 size={24} />
            </span>
            <p className="ai-empty__title">No questions yet</p>
            <p>Pick a topic and difficulty, then generate. Hints stay hidden until you ask for them.</p>
          </div>
        )
      )}
    </div>
  );
}
