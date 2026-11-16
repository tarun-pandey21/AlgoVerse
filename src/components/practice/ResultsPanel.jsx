import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Terminal,
  ServerOff,
  PlugZap,
  EyeOff,
  RefreshCw,
  Trophy, LogIn } from 'lucide-react';
import Button from '../Button';

const STATUS_LABEL = {
  passed: 'Passed',
  wrong_answer: 'Wrong Answer',
  runtime_error: 'Runtime Error',
  time_limit_exceeded: 'Time Limit Exceeded',
  compilation_error: 'Compilation Error',
  internal_error: 'Execution Error',
};

const VERDICT_STYLE = {
  accepted: { tone: 'success', icon: CheckCircle2 },
  wrong_answer: { tone: 'danger', icon: XCircle },
  runtime_error: { tone: 'danger', icon: AlertTriangle },
  compilation_error: { tone: 'danger', icon: AlertTriangle },
  time_limit_exceeded: { tone: 'warning', icon: Clock },
  internal_error: { tone: 'warning', icon: AlertTriangle },
};

function OutputBlock({ label, text, tone }) {
  return (
    <div className={`result-io ${tone ? `result-io--${tone}` : ''}`}>
      <p>{label}</p>
      <pre>{text === '' ? <span className="io-block__empty">(no output)</span> : text}</pre>
    </div>
  );
}

function TestCaseResult({ result, defaultOpen }) {
  const passed = result.status === 'passed';
  return (
    <details className={`test-result ${passed ? 'test-result--pass' : 'test-result--fail'}`} open={defaultOpen}>
      <summary>
        {passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        <span className="test-result__name">Test case {result.index + 1}</span>
        <span className="test-result__status">{STATUS_LABEL[result.status]}</span>
        {result.time != null && <span className="test-result__time">{Math.round(result.time * 1000)} ms</span>}
      </summary>
      <div className="test-result__body">
        <OutputBlock label="Input" text={result.input.replace(/\n$/, '')} />
        <div className="result-io-pair">
          <OutputBlock label="Expected output" text={result.expectedOutput} />
          <OutputBlock label="Your output" text={result.actualOutput.replace(/\n$/, '')} tone={passed ? 'pass' : 'fail'} />
        </div>
        {result.stderr && <OutputBlock label="Error output (stderr)" text={result.stderr} tone="fail" />}
      </div>
    </details>
  );
}

/** Explains why code can't run, without pretending anything happened. */
export function ExecutionUnavailable({ status, onRetry }) {
  if (status.state === 'sign_in') {
    const next = `${window.location.pathname}${window.location.search}`;
    return (
      <div className="exec-notice exec-notice--config" role="status">
        <LogIn size={20} />
        <div>
          <p className="exec-notice__title">Sign in to run your code</p>
          <p>{status.message ?? 'Running and submitting code requires an AlgoVerse account. Your code stays in the editor while you sign in.'}</p>
          <Button size="sm" icon={LogIn} to={`/auth?next=${encodeURIComponent(next)}`}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }
  if (status.state === 'not_configured') {
    return (
      <div className="exec-notice exec-notice--config">
        <PlugZap size={20} />
        <div>
          <p className="exec-notice__title">Code execution is not configured yet</p>
          <p>
            Run and Submit send your code to a secure Judge0 sandbox through the AlgoVerse API server. Code never runs in
            your browser. Add your Judge0 URL (and key, if needed) to <code className="inline-code">.env</code>, then
            restart the API server. Until then, nothing is run and no results are recorded.
          </p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
            Check again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="exec-notice exec-notice--offline">
      <ServerOff size={20} />
      <div>
        <p className="exec-notice__title">The execution server isn’t running</p>
        <p>
          Start the AlgoVerse API server with <code className="inline-code">npm run server</code> (or run the app and
          server together with <code className="inline-code">npm run dev:full</code>), then check again.
        </p>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Check again
        </Button>
      </div>
    </div>
  );
}

/**
 * Console under the editor: run/submit results, errors and per-test details.
 * outcome: null | { phase: 'running', mode } | { phase: 'done', mode, result }
 *          | { phase: 'error', mode, kind, message }
 */
export default function ResultsPanel({ outcome, executionStatus, onRetryStatus }) {
  if (['not_configured', 'unavailable', 'sign_in'].includes(executionStatus.state)) {
    return <ExecutionUnavailable status={executionStatus} onRetry={onRetryStatus} />;
  }

  if (!outcome) {
    return (
      <div className="results-empty">
        <Terminal size={20} />
        <p>
          <strong>Run</strong> checks your code against the sample test cases. <strong>Submit</strong> runs every test,
          including hidden ones, and records your result.
        </p>
        <p className="results-empty__kbd">
          Tip: press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> in the editor to run.
        </p>
      </div>
    );
  }

  if (outcome.phase === 'running') {
    return (
      <div className="results-running" role="status">
        <Loader2 size={20} className="spin" />
        <p>{outcome.mode === 'submit' ? 'Submitting: running all test cases…' : 'Running sample test cases…'}</p>
      </div>
    );
  }

  if (outcome.phase === 'error') {
    if (outcome.kind === 'not_configured' || outcome.kind === 'unavailable') {
      return <ExecutionUnavailable status={{ state: outcome.kind }} onRetry={onRetryStatus} />;
    }
    if (outcome.kind === 'auth_required') {
      return <ExecutionUnavailable status={{ state: 'sign_in', message: outcome.message }} onRetry={onRetryStatus} />;
    }
    return (
      <div className="exec-notice exec-notice--error" role="alert">
        <AlertTriangle size={20} />
        <div>
          <p className="exec-notice__title">{outcome.kind === 'rate_limited' ? 'Slow down a little' : 'Your code could not be run'}</p>
          <p>{outcome.message}</p>
        </div>
      </div>
    );
  }

  const { result, mode } = outcome;
  const style = VERDICT_STYLE[result.verdict] ?? VERDICT_STYLE.internal_error;
  const VerdictIcon = mode === 'submit' && result.verdict === 'accepted' ? Trophy : style.icon;
  const visible = result.results.filter((r) => r.visible);
  const hidden = result.results.filter((r) => !r.visible);
  const firstFailing = visible.find((r) => r.status !== 'passed');
  const skipped = result.total - result.results.length;

  return (
    <div className="results" aria-live="polite">
      <div className={`verdict verdict--${style.tone}`}>
        <VerdictIcon size={22} />
        <div>
          <p className="verdict__label">
            {mode === 'run' && result.verdict === 'accepted' ? 'All sample tests passed' : result.verdictLabel}
          </p>
          <p className="verdict__meta">
            {result.passed} / {result.total} test cases passed
            {mode === 'run' ? ' · sample tests only' : ' · all tests'}
            {mode === 'submit' && result.verdict === 'accepted' && ' · submission recorded'}
            {mode === 'submit' && result.verdict !== 'accepted' && ' · attempt recorded'}
          </p>
        </div>
      </div>

      {mode === 'run' && result.verdict === 'accepted' && (
        <p className="results-hint">Looks good! Submit to check your solution against the hidden test cases too.</p>
      )}

      {result.verdict === 'compilation_error' && (
        <div className="compile-output">
          <p>
            <AlertTriangle size={15} /> Compiler output
          </p>
          <pre>{result.compileOutput || 'The compiler did not return a message.'}</pre>
        </div>
      )}

      {result.verdict !== 'compilation_error' && (
        <>
          {visible.length > 0 && (
            <div className="results-group">
              <p className="results-group__title">{mode === 'run' ? 'Sample test cases' : 'Visible test cases'}</p>
              {visible.map((r) => (
                <TestCaseResult key={r.index} result={r} defaultOpen={r === firstFailing} />
              ))}
            </div>
          )}

          {hidden.length > 0 && (
            <div className="results-group">
              <p className="results-group__title">
                <EyeOff size={14} /> Hidden test cases
              </p>
              <ul className="hidden-results">
                {hidden.map((r) => (
                  <li key={r.index} className={r.status === 'passed' ? 'hidden-pass' : 'hidden-fail'} title={STATUS_LABEL[r.status]}>
                    {r.status === 'passed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}#{r.index + 1}
                    <span className="sr-only">{STATUS_LABEL[r.status]}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Hidden test inputs aren’t shown, so solutions can’t be tailored to them.</p>
            </div>
          )}
          {skipped > 0 && <p className="muted small">{skipped} test cases were skipped.</p>}
        </>
      )}
    </div>
  );
}
