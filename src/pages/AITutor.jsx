import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, Send, Square, Plus, User, X, Code2, BookOpen, Lightbulb, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import LanguageSelector from '../components/lesson/LanguageSelector';
import Markdown from '../components/ai/Markdown';
import AINotice, { AIFootnote, AIAccessNotice } from '../components/ai/AINotice';
import useAIStatus from '../hooks/useAIStatus';
import useCodeLanguage from '../hooks/useCodeLanguage';
import { streamTutor } from '../services/aiApi';
import { getPracticeProblem } from '../data/practice';
import { getTopicById } from '../data/topics';
import { getLanguage } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import { scopedKey } from '../lib/scopedStorage';
import '../components/ai/AI.css';
import './AITutor.css';

const STORAGE_BASE = 'algoverse.ai.tutor.v1';
const DEFAULT_MAX_CHARS = 6000;

const SUGGESTIONS = [
  'Explain binary search step by step with a dry run',
  'What is the difference between BFS and DFS?',
  'How does a hash map handle collisions?',
  'When should I use dynamic programming?',
];

/** Page context the tutor can use: a practice problem or a lesson topic. */
function buildContext(params) {
  const problem = params.get('problem') && getPracticeProblem(params.get('problem'));
  if (problem) {
    return {
      key: `problem:${problem.id}`,
      label: problem.title,
      kind: 'Practice problem',
      icon: Code2,
      text: [
        `Practice problem: ${problem.title} (${problem.difficulty})`,
        ...problem.description,
        ...(problem.constraints ?? []).map((c) => `Constraint: ${c}`),
        'The learner is working on this problem. Give hints before full solutions.',
      ].join('\n'),
      suggestions: [`Give me a hint for "${problem.title}"`, 'What data structure fits this problem?', 'What edge cases should I test?'],
    };
  }
  const topic = params.get('topic') && getTopicById(params.get('topic'));
  if (topic) {
    return {
      key: `topic:${topic.id}`,
      label: topic.name,
      kind: 'Lesson',
      icon: BookOpen,
      text: `Lesson topic: ${topic.name} (${topic.level}). ${topic.description}`,
      suggestions: [`Explain ${topic.name} like I'm a beginner`, `What are common ${topic.name} interview patterns?`, `Quiz me on ${topic.name}`],
    };
  }
  return null;
}

function loadChat(STORAGE_KEY) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.messages)) return saved;
  } catch {
    /* ignore corrupt storage */
  }
  return { messages: [], contextKey: null };
}

let nextId = 1;
const newId = () => `${Date.now()}-${nextId++}`;

export default function AITutor() {
  const { user } = useAuth();
  const storageKey = scopedKey(STORAGE_BASE, user?.id);
  const [params, setParams] = useSearchParams();
  const { status, refresh } = useAIStatus();
  const { language } = useCodeLanguage();
  const pageContext = useMemo(() => buildContext(params), [params]);

  const [chat, setChat] = useState(() => {
    const saved = loadChat(storageKey);
    // Opening the tutor from a different problem/lesson starts a fresh chat.
    if (pageContext && saved.contextKey !== pageContext.key) return { messages: [], contextKey: pageContext.key };
    return saved;
  });
  const [input, setInput] = useState(() => params.get('q') ?? '');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null); // { kind, message, retryText }
  const [model, setModel] = useState(null);

  const abortRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const stickToBottom = useRef(true);

  const maxChars = status.limits?.maxMessageChars ?? DEFAULT_MAX_CHARS;
  const ready = status.state === 'ready';
  const messages = chat.messages;

  // Persist finished conversations only.
  useEffect(() => {
    if (streaming) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages: chat.messages.filter((m) => !m.pending), contextKey: chat.contextKey }));
    } catch {
      /* storage full or unavailable */
    }
  }, [chat, streaming]);

  useEffect(() => {
    if (status.model) setModel(status.model);
  }, [status.model]);

  // Keep the newest text in view while streaming, unless the learner scrolled up.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const updateLast = (fn) =>
    setChat((c) => ({ ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? fn(m) : m)) }));

  const send = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || streaming || !ready) return;
      if (text.length > maxChars) {
        setError({ kind: 'error', message: `Your message is too long (max ${maxChars.toLocaleString()} characters).` });
        return;
      }
      setError(null);
      setInput('');
      stickToBottom.current = true;

      const history = [...messages.filter((m) => !m.pending), { id: newId(), role: 'user', content: text }];
      setChat((c) => ({ ...c, messages: [...history, { id: newId(), role: 'assistant', content: '', pending: true }] }));
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const result = await streamTutor(
        {
          messages: history.map(({ role, content }) => ({ role, content })),
          language,
          context: pageContext?.text,
        },
        {
          signal: controller.signal,
          onDelta: (_, full) => updateLast((m) => ({ ...m, content: full })),
        },
      );
      abortRef.current = null;
      setStreaming(false);

      if (result.ok) {
        if (result.model) setModel(result.model);
        updateLast((m) => ({ ...m, content: result.text, pending: false, truncated: result.truncated }));
        return;
      }

      const partial = result.partialText?.trim();
      if (partial) {
        // Keep what Claude already wrote, clearly marked as incomplete.
        updateLast((m) => ({ ...m, content: result.partialText, pending: false, incomplete: result.kind === 'aborted' ? 'stopped' : 'error' }));
      } else {
        // Nothing came back: drop the turn and give the learner their text back.
        setChat((c) => ({ ...c, messages: c.messages.slice(0, -2) }));
        setInput(text);
      }
      if (result.kind !== 'aborted') {
        setError({ kind: result.kind, message: result.message, retryText: partial ? null : text });
        if (result.kind === 'unavailable' || result.kind === 'not_configured') refresh();
      }
    },
    [streaming, ready, maxChars, messages, language, pageContext, refresh],
  );

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    stop();
    setChat({ messages: [], contextKey: pageContext?.key ?? null });
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  const clearContext = () => {
    const next = new URLSearchParams(params);
    next.delete('problem');
    next.delete('topic');
    setParams(next, { replace: true });
    setChat({ messages: [], contextKey: null });
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(input);
    }
  };

  // Auto-grow the composer
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const suggestions = pageContext?.suggestions ?? SUGGESTIONS;
  const ContextIcon = pageContext?.icon;

  return (
    <div className="page tutor-page">
      <PageHeader
        eyebrow="AI Tools"
        title="AI DSA Tutor"
        description="Ask about any data structure or algorithm. Get beginner-friendly, step-by-step explanations with code, complexity, and hints before full solutions."
        actions={
          <>
            <LanguageSelector size="sm" label="Language for code examples" />
            <Button variant="secondary" size="sm" icon={Plus} onClick={newChat} disabled={!messages.length && !error}>
              New chat
            </Button>
          </>
        }
      />

      {status.state === 'not_configured' && <AINotice kind="not_configured" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      {status.state === 'unavailable' && <AINotice kind="unavailable" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      <AIAccessNotice status={status} />

      <section className="card tutor" aria-label="Tutor conversation">
        {pageContext && (
          <div className="tutor__context">
            <ContextIcon size={15} />
            <span>
              {pageContext.kind}: <strong>{pageContext.label}</strong>. The tutor will use it as context.
            </span>
            <button type="button" className="tutor__context-clear" onClick={clearContext} aria-label="Remove context">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="tutor__messages" ref={listRef} onScroll={onScroll} aria-live="polite">
          {messages.length === 0 ? (
            <div className="tutor__welcome">
              <span className="icon-tile icon-tile--lg tone-indigo">
                <Bot size={26} />
              </span>
              <h2>What would you like to learn?</h2>
              <p>
                I explain concepts step by step, show code in <strong>{getLanguage(language).label}</strong> (switch above), state the time and space
                complexity, and give hints before full solutions.
              </p>
              <div className="ai-chips tutor__suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="ai-chip" onClick={() => send(s)} disabled={!ready}>
                    <Lightbulb size={14} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="msg msg--user">
                  <div className="msg__bubble">{m.content}</div>
                  <span className="msg__avatar msg__avatar--user" aria-hidden="true">
                    <User size={15} />
                  </span>
                </div>
              ) : (
                <div key={m.id} className="msg msg--assistant">
                  <span className="msg__avatar" aria-hidden="true">
                    <Bot size={16} />
                  </span>
                  <div className="msg__bubble">
                    {m.pending && !m.content ? (
                      <span className="ai-dots" aria-label="Claude is thinking">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <Markdown text={m.content} />
                    )}
                    {m.truncated && (
                      <p className="msg__note">
                        <AlertTriangle size={13} /> The answer hit the length limit. Ask “continue” for the rest.
                      </p>
                    )}
                    {m.incomplete && (
                      <p className="msg__note">
                        <AlertTriangle size={13} /> {m.incomplete === 'stopped' ? 'Stopped before the answer finished.' : 'The answer was interrupted.'}
                      </p>
                    )}
                  </div>
                </div>
              ),
            )
          )}
        </div>

        {error && (
          <div className="tutor__error">
            <AINotice
              kind={error.kind}
              message={error.message}
              onRetry={error.retryText ? () => send(error.retryText) : undefined}
            />
          </div>
        )}

        <form
          className="tutor__composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            ref={inputRef}
            className="tutor__input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ready ? 'Ask a DSA question… (Enter to send, Shift+Enter for a new line)' : 'The AI tutor is unavailable right now'}
            aria-label="Message the AI tutor"
            disabled={!ready && status.state !== 'checking'}
            maxLength={maxChars + 500}
          />
          {streaming ? (
            <Button type="button" variant="secondary" icon={Square} onClick={stop} aria-label="Stop generating">
              Stop
            </Button>
          ) : (
            <Button type="submit" icon={Send} disabled={!ready || !input.trim()} aria-label="Send message">
              Send
            </Button>
          )}
        </form>
        <div className="tutor__meta">
          <AIFootnote model={model} />
          {input.length > maxChars * 0.8 && (
            <span className={`tutor__count ${input.length > maxChars ? 'tutor__count--over' : ''}`}>
              {input.length.toLocaleString()} / {maxChars.toLocaleString()}
            </span>
          )}
        </div>
      </section>

      <p className="tutor__more">
        Want feedback on your own code? Try the <Link to="/code-analyzer">Code Analyzer</Link>. Need fresh problems? Use the{' '}
        <Link to="/ai-questions">Question Generator</Link>.
      </p>
    </div>
  );
}
