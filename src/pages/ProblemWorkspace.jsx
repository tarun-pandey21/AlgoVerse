import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  Bot,
  ScanSearch,
  AlertTriangle,
} from 'lucide-react';
import Button from '../components/Button';
import { DifficultyBadge } from '../components/Badge';
import LanguageSelector from '../components/lesson/LanguageSelector';
import CodeEditor from '../components/practice/CodeEditor';
import ProblemDescription from '../components/practice/ProblemDescription';
import ResultsPanel from '../components/practice/ResultsPanel';
import practiceProblems, { getPracticeProblem, getNeighbors } from '../data/practice';
import { getStarterCode } from '../data/practice/starterCode';
import { fileNameFor, getLanguage } from '../data/languages';
import useCodeLanguage from '../hooks/useCodeLanguage';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { useAuth } from '../context/AuthContext';
import { getExecutionStatus, runCode, submitCode } from '../services/executionApi';
import NotFound from './NotFound';
import './ProblemWorkspace.css';

/** Route wrapper: remounts the workspace when the problem changes. */
export default function ProblemWorkspace() {
  const { problemId } = useParams();
  const problem = getPracticeProblem(problemId);
  if (!problem) return <NotFound />;
  return <Workspace key={problem.id} problem={problem} />;
}

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

function Workspace({ problem }) {
  const { language } = useCodeLanguage();
  const { getProblemStatus, getSubmissionsFor, recordSubmission, drafts, source } = usePracticeProgress();
  const auth = useAuth();
  const neighbors = getNeighbors(problem.id);
  const starter = useMemo(() => getStarterCode(problem, language), [problem, language]);

  const [code, setCode] = useState(starter);
  const [draftNotice, setDraftNotice] = useState(null); // problem loading/saving the draft
  const [saveNotice, setSaveNotice] = useState(null); // submission judged but not saved to the account
  const typed = useRef(false);
  const [tab, setTab] = useState('description');
  const [outcome, setOutcome] = useState(null);
  const [executionStatus, setExecutionStatus] = useState({ state: 'checking' });
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef(null);
  const submissions = getSubmissionsFor(problem.id);
  const busy = outcome?.phase === 'running';

  // Load this language's draft (or starter) whenever the problem, language or
  // signed-in user changes. Drafts live in Supabase when signed in.
  useEffect(() => {
    let alive = true;
    typed.current = false;
    setCode(getStarterCode(problem, language));
    setOutcome(null);
    setConfirmReset(false);
    setDraftNotice(null);
    setSaveNotice(null);
    if (!drafts.ready) return undefined;
    drafts
      .load(problem.id, language)
      .then((saved) => {
        if (alive && saved != null && !typed.current) setCode(saved);
      })
      .catch((error) => alive && setDraftNotice(`Your saved draft couldn't be loaded: ${error.message}`));
    return () => {
      alive = false;
    };
  }, [problem, language, drafts]);

  const checkStatus = useCallback(async () => {
    setExecutionStatus({ state: 'checking' });
    setExecutionStatus(await getExecutionStatus());
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  // Save drafts shortly after typing stops
  const handleChange = (next) => {
    typed.current = true;
    setCode(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const save = next === starter ? drafts.remove(problem.id, language) : drafts.save(problem.id, language, next);
      save.then(() => setDraftNotice(null)).catch((error) => setDraftNotice(`Your draft wasn't saved: ${error.message}`));
    }, source === 'account' ? 800 : 400);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const execute = async (mode) => {
    if (busy || executionStatus.state !== 'ready' || (executionStatus.requiresAuth && auth.status !== 'signed_in')) return;
    setOutcome({ phase: 'running', mode });
    const request = { problemId: problem.id, language, code };
    const response = mode === 'submit' ? await submitCode(request) : await runCode(request);

    if (!response.ok) {
      setOutcome({ phase: 'error', mode, kind: response.kind, message: response.message });
      // The server may have gone away or lost its configuration since we checked
      if (response.kind === 'not_configured' || response.kind === 'unavailable') {
        setExecutionStatus({ state: response.kind, message: response.message });
      }
      return;
    }
    setOutcome({ phase: 'done', mode, result: response.result });
    if (mode === 'submit') {
      const { verdict, passed, total, persistence } = response.result;
      if (source === 'account' && !persistence?.saved) {
        // Never fall back to storing it somewhere else: say so plainly.
        setSaveNotice(
          persistence?.message ??
            (persistence?.reason === 'signed_out'
              ? 'The server did not recognise your session, so this result was not saved. Please sign in again.'
              : 'This result was not saved to your account.'),
        );
      } else {
        setSaveNotice(null);
      }
      await recordSubmission({ problemId: problem.id, language, verdict, passed, total }, persistence);
    }
  };

  const resetCode = () => {
    drafts.remove(problem.id, language).catch((error) => setDraftNotice(`Couldn't delete your saved draft: ${error.message}`));
    setCode(starter);
    setConfirmReset(false);
    setOutcome(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // Production servers require an account to run code (EXECUTION_REQUIRE_AUTH).
  const needsSignIn = executionStatus.state === 'ready' && executionStatus.requiresAuth && auth.status !== 'signed_in';
  const panelStatus = needsSignIn ? { state: 'sign_in' } : executionStatus;
  const ready = executionStatus.state === 'ready' && !needsSignIn;
  const disabledReason =
    executionStatus.state === 'checking'
      ? 'Checking the execution server…'
      : needsSignIn
        ? 'Sign in to run and submit code.'
        : !ready
          ? 'Code execution is not available. See the message below the editor.'
          : undefined;
  const baseName = problem.signature.fn.charAt(0).toUpperCase() + problem.signature.fn.slice(1);

  return (
    <div className="workspace">
      {/* Top bar */}
      <div className="workspace__bar">
        <Link to="/practice" className="back-link workspace__back">
          <ArrowLeft size={16} /> Problem library
        </Link>
        <div className="workspace__title">
          <span className="workspace__count">
            Problem {problem.order + 1} of {practiceProblems.length}
          </span>
          <strong>{problem.title}</strong>
          <DifficultyBadge level={problem.difficulty} />
        </div>
        <div className="workspace__nav">
          <Link className="workspace__ai" to={`/ai-tutor?problem=${problem.id}`} title="Get hints from the AI Tutor">
            <Bot size={15} /> <span>Ask AI Tutor</span>
          </Link>
          <Link className="workspace__ai" to={`/code-analyzer?problem=${problem.id}`} title="Review your saved draft with AI">
            <ScanSearch size={15} /> <span>Review with AI</span>
          </Link>
          {neighbors.previous ? (
            <Link className="icon-link" to={`/practice/${neighbors.previous.id}`} aria-label={`Previous problem: ${neighbors.previous.title}`} title={neighbors.previous.title}>
              <ChevronLeft size={18} />
            </Link>
          ) : (
            <span className="icon-link icon-link--disabled" aria-hidden="true">
              <ChevronLeft size={18} />
            </span>
          )}
          {neighbors.next ? (
            <Link className="icon-link" to={`/practice/${neighbors.next.id}`} aria-label={`Next problem: ${neighbors.next.title}`} title={neighbors.next.title}>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span className="icon-link icon-link--disabled" aria-hidden="true">
              <ChevronRight size={18} />
            </span>
          )}
        </div>
      </div>

      <div className="workspace__panes">
        {/* Problem pane */}
        <section className="pane pane--problem card" aria-label="Problem">
          <div className="pane__tabs" role="tablist" aria-label="Problem panel">
            <button role="tab" aria-selected={tab === 'description'} className={tab === 'description' ? 'is-active' : ''} onClick={() => setTab('description')}>
              <FileText size={15} /> Description
            </button>
            <button role="tab" aria-selected={tab === 'submissions'} className={tab === 'submissions' ? 'is-active' : ''} onClick={() => setTab('submissions')}>
              <History size={15} /> Submissions {submissions.length > 0 && <span className="tab-count">{submissions.length}</span>}
            </button>
          </div>
          <div className="pane__scroll">
            {tab === 'description' ? (
              <ProblemDescription problem={problem} status={getProblemStatus(problem.id)} neighbors={neighbors} />
            ) : (
              <div className="submission-history">
                {submissions.length === 0 ? (
                  <div className="results-empty">
                    <History size={20} />
                    <p>No submissions yet. When you submit, your results appear here.</p>
                  </div>
                ) : (
                  <ul>
                    {submissions.map((s) => (
                      <li key={s.id} className={s.verdict === 'accepted' ? 'is-accepted' : 'is-rejected'}>
                        {s.verdict === 'accepted' ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                        <div>
                          <p className="submission-history__verdict">{VERDICT_TEXT[s.verdict] ?? s.verdict}</p>
                          <p className="submission-history__meta">
                            {getLanguage(s.language).label} · {s.passed}/{s.total} tests passed
                          </p>
                        </div>
                        <time dateTime={s.submittedAt}>{timeAgo(s.submittedAt)}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Code pane */}
        <section className="pane pane--code" aria-label="Code">
          <div className="editor-card card">
            <div className="editor-toolbar">
              <LanguageSelector size="sm" label="Programming language" />
              <span className="editor-toolbar__file">{language === 'java' ? 'Main.java' : fileNameFor(baseName, language)}</span>
              <div className="editor-toolbar__actions">
                {confirmReset ? (
                  <span className="reset-confirm" role="alert">
                    Reset to starter code?
                    <button onClick={resetCode} className="reset-confirm__yes">Reset</button>
                    <button onClick={() => setConfirmReset(false)}>Cancel</button>
                  </span>
                ) : (
                  <button className="tool-btn" onClick={() => setConfirmReset(true)} title="Reset to starter code">
                    <RotateCcw size={14} /> <span>Reset</span>
                  </button>
                )}
                <button className="tool-btn" onClick={copyCode} title="Copy code">
                  {copied ? <Check size={14} /> : <Copy size={14} />} <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="editor-host">
              <CodeEditor
                value={code}
                language={language}
                onChange={handleChange}
                onRun={() => execute('run')}
                ariaLabel={`${getLanguage(language).label} code editor`}
              />
            </div>
            <div className="editor-actions">
              <span className={`exec-pill exec-pill--${executionStatus.state}`}>
                {executionStatus.state === 'checking' && <Loader2 size={12} className="spin" />}
                {executionStatus.state === 'ready' && `${executionStatus.providerLabel ?? 'Judge0'} connected`}
                {executionStatus.state === 'checking' && 'Checking execution…'}
                {executionStatus.state === 'not_configured' && 'Execution not configured'}
                {executionStatus.state === 'unavailable' && 'Execution server offline'}
              </span>
              <div className="editor-actions__buttons">
                <Button variant="secondary" icon={busy && outcome.mode === 'run' ? Loader2 : Play} onClick={() => execute('run')} disabled={!ready || busy} title={disabledReason}>
                  Run Code
                </Button>
                <Button icon={busy && outcome.mode === 'submit' ? Loader2 : Send} onClick={() => execute('submit')} disabled={!ready || busy} title={disabledReason}>
                  Submit
                </Button>
              </div>
            </div>
          </div>

          <div className="console card" aria-label="Results">
            <p className="console__title">Results</p>
            <div className="console__body">
              {(saveNotice || draftNotice) && (
                <div className="exec-notice exec-notice--config save-notice" role="alert">
                  <AlertTriangle size={16} />
                  <div>{saveNotice && <p>{saveNotice}</p>}{draftNotice && <p>{draftNotice}</p>}</div>
                </div>
              )}
              <ResultsPanel outcome={outcome} executionStatus={panelStatus} onRetryStatus={checkStatus} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
