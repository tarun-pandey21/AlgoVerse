import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ScanSearch,
  Gauge,
  Sparkles,
  Square,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDashed,
  ThumbsUp,
  BookOpenCheck,
  Wrench,
  ListOrdered,
  Lightbulb,
  Bot,
  FileCode2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import FilterTabs from '../components/FilterTabs';
import LanguageSelector from '../components/lesson/LanguageSelector';
import CodeEditor from '../components/practice/CodeEditor';
import Markdown, { InlineMarkdown } from '../components/ai/Markdown';
import AINotice, { AIFootnote, AIAccessNotice } from '../components/ai/AINotice';
import useAIStatus from '../hooks/useAIStatus';
import useCodeLanguage from '../hooks/useCodeLanguage';
import { reviewCode, analyzeComplexity } from '../services/aiApi';
import practiceProblems, { getPracticeProblem } from '../data/practice';
import { getStarterCode } from '../data/practice/starterCode';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { getLanguage } from '../data/languages';
import '../components/ai/AI.css';
import './CodeAnalyzer.css';

const MODES = [
  { key: 'review', label: 'Code Review' },
  { key: 'complexity', label: 'Complexity' },
];

const EXAMPLES = {
  java: `import java.util.*;

public class Main {
    // Returns the largest value in the array
    static int findMax(int[] nums) {
        int best = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            if (nums[i] > best) best = nums[i];
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(findMax(new int[]{3, -1, 9}));
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

// Returns true if any two numbers add up to target
bool hasPair(vector<int>& nums, int target) {
    for (int i = 0; i < nums.size(); i++)
        for (int j = 0; j < nums.size(); j++)
            if (nums[i] + nums[j] == target) return true;
    return false;
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    cout << hasPair(nums, 9) << endl;
}`,
  python: `def is_palindrome(s):
    # Ignore case and non-letters
    cleaned = ""
    for ch in s:
        if ch.isalnum():
            cleaned = cleaned + ch.lower()
    return cleaned == cleaned[::-1]


print(is_palindrome("A man, a plan, a canal: Panama"))`,
};

const VERDICTS = {
  looks_correct: { icon: CheckCircle2, label: 'Looks correct', tone: 'success' },
  minor_issues: { icon: AlertTriangle, label: 'Minor issues', tone: 'warning' },
  has_bugs: { icon: XCircle, label: 'Has bugs', tone: 'danger' },
  incomplete: { icon: CircleDashed, label: 'Incomplete', tone: 'warning' },
};
const SEVERITY_TONE = { critical: 'hard', major: 'medium', minor: 'neutral' };
const CATEGORY_LABEL = {
  bug: 'Bug',
  logic: 'Logic',
  edge_case: 'Edge case',
  performance: 'Performance',
  readability: 'Readability',
  best_practice: 'Best practice',
};
const READABILITY_LABEL = { excellent: 'Excellent', good: 'Good', fair: 'Fair', needs_work: 'Needs work' };
const CONFIDENCE_TONE = { high: 'success', medium: 'warning', low: 'hard' };

/** Starter code for a chosen problem, or an example snippet to try the analyzer on. */
function initialCode(problemId, language) {
  const problem = problemId && getPracticeProblem(problemId);
  if (problem) return getStarterCode(problem, language);
  return EXAMPLES[language];
}

/* ---------------------------------------------------------- results */

function ReviewResult({ data, language }) {
  const verdict = VERDICTS[data.verdict] ?? VERDICTS.minor_issues;
  const VerdictIcon = verdict.icon;
  const issues = Array.isArray(data.issues) ? data.issues : [];
  return (
    <div className="analysis">
      <div className={`analysis__verdict analysis__verdict--${verdict.tone}`}>
        <VerdictIcon size={20} />
        <div>
          <p className="analysis__verdict-label">{verdict.label}</p>
          {data.summary && <Markdown text={data.summary} />}
        </div>
      </div>

      <section>
        <h3 className="ai-section-title">
          <AlertTriangle size={17} /> Issues {issues.length > 0 && <span className="analysis__count">{issues.length}</span>}
        </h3>
        {issues.length === 0 ? (
          <p className="analysis__muted">No issues found.</p>
        ) : (
          <ol className="issues">
            {issues.map((issue, i) => (
              <li key={i} className={`issue issue--${issue.severity}`}>
                <div className="issue__head">
                  <Badge tone={SEVERITY_TONE[issue.severity] ?? 'neutral'}>{issue.severity ?? 'note'}</Badge>
                  <Badge>{CATEGORY_LABEL[issue.category] ?? issue.category}</Badge>
                  {Number.isInteger(issue.line) && <span className="issue__line">Line {issue.line}</span>}
                </div>
                <p className="issue__title">
                  <InlineMarkdown text={issue.title} />
                </p>
                {issue.explanation && <Markdown text={issue.explanation} />}
                {issue.suggestion && (
                  <div className="issue__fix">
                    <span className="issue__fix-label">
                      <Wrench size={13} /> Suggested fix
                    </span>
                    <Markdown text={issue.suggestion} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.strengths?.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <ThumbsUp size={17} /> What you did well
          </h3>
          <ul className="ai-list">
            {data.strengths.map((s, i) => (
              <li key={i}>
                <InlineMarkdown text={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ai-metric-grid">
        {data.readability && (
          <div className="ai-metric">
            <p className="ai-metric__label">Readability</p>
            <p className="ai-metric__value analysis__plain">{READABILITY_LABEL[data.readability.rating] ?? data.readability.rating}</p>
          </div>
        )}
        {data.complexity && (
          <>
            <div className="ai-metric">
              <p className="ai-metric__label">Time (est.)</p>
              <p className="ai-metric__value">{data.complexity.time}</p>
            </div>
            <div className="ai-metric">
              <p className="ai-metric__label">Space (est.)</p>
              <p className="ai-metric__value">{data.complexity.space}</p>
            </div>
          </>
        )}
      </div>
      {data.readability?.comments && (
        <section>
          <h3 className="ai-section-title">
            <BookOpenCheck size={17} /> Readability &amp; coding practices
          </h3>
          <Markdown text={data.readability.comments} />
        </section>
      )}
      {data.complexity?.explanation && (
        <section>
          <h3 className="ai-section-title">
            <Gauge size={17} /> Complexity
          </h3>
          <Markdown text={data.complexity.explanation} />
          <p className="analysis__muted analysis__small">Complexity is an AI estimate. Use the Complexity tab for a detailed breakdown.</p>
        </section>
      )}
      {data.improvedCode?.trim() && (
        <section>
          <h3 className="ai-section-title">
            <Sparkles size={17} /> Improved version
          </h3>
          <Markdown text={`\`\`\`${language}\n${data.improvedCode.replace(/^```\w*\n?|```\s*$/g, '')}\n\`\`\``} />
        </section>
      )}
    </div>
  );
}

function ComplexityResult({ data }) {
  const time = data.time ?? {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const optimizations = Array.isArray(data.optimizations) ? data.optimizations : [];
  return (
    <div className="analysis">
      <div className="ai-metric-grid">
        <div className="ai-metric">
          <p className="ai-metric__label">Best time</p>
          <p className="ai-metric__value">{time.best ?? '—'}</p>
        </div>
        <div className="ai-metric">
          <p className="ai-metric__label">Average time</p>
          <p className="ai-metric__value">{time.average ?? '—'}</p>
        </div>
        <div className="ai-metric">
          <p className="ai-metric__label">Worst time</p>
          <p className="ai-metric__value">{time.worst ?? '—'}</p>
        </div>
        <div className="ai-metric">
          <p className="ai-metric__label">Extra space</p>
          <p className="ai-metric__value">{data.space ?? '—'}</p>
        </div>
      </div>
      <div className="analysis__meta">
        {data.variables && (
          <span>
            <InlineMarkdown text={data.variables} />
          </span>
        )}
        {data.confidence && <Badge tone={CONFIDENCE_TONE[data.confidence] ?? 'neutral'}>Confidence: {data.confidence}</Badge>}
      </div>

      <section>
        <h3 className="ai-section-title">
          <Gauge size={17} /> Why this time complexity
        </h3>
        <Markdown text={data.timeExplanation ?? ''} />
      </section>
      <section>
        <h3 className="ai-section-title">
          <FileCode2 size={17} /> Why this space complexity
        </h3>
        <Markdown text={data.spaceExplanation ?? ''} />
      </section>

      {steps.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <ListOrdered size={17} /> Step by step
          </h3>
          <div className="md-table">
            <table>
              <thead>
                <tr>
                  <th>Lines</th>
                  <th>Cost</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s, i) => (
                  <tr key={i}>
                    <td className="analysis__mono">{s.lines}</td>
                    <td className="analysis__mono">{s.cost}</td>
                    <td>
                      <InlineMarkdown text={s.reason} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.assumptions?.length > 0 && (
        <section>
          <h3 className="ai-section-title">
            <Info size={17} /> Assumptions
          </h3>
          <ul className="ai-list">
            {data.assumptions.map((a, i) => (
              <li key={i}>
                <InlineMarkdown text={a} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="ai-section-title">
          <Lightbulb size={17} /> Possible optimizations
        </h3>
        {optimizations.length === 0 ? (
          <p className="analysis__muted">Claude didn’t suggest an asymptotic improvement for this code.</p>
        ) : (
          <div className="optimizations">
            {optimizations.map((o, i) => (
              <div key={i} className="optimization">
                <p className="optimization__title">
                  <InlineMarkdown text={o.title} />
                </p>
                <Markdown text={o.description ?? ''} />
                <p className="optimization__result">
                  → Time <code className="inline-code">{o.time}</code> · Space <code className="inline-code">{o.space}</code>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EstimateDisclaimer() {
  return (
    <div className="ai-disclaimer" role="note">
      <Info size={16} />
      <span>
        <strong>This is an estimate, not a proof.</strong> Claude reasons about your code the way a reviewer would. It does not run or formally verify it,
        so results can be wrong, especially for recursion, amortized costs and library internals. Check the reasoning before you rely on it.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- page */

export default function CodeAnalyzer() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'complexity' ? 'complexity' : 'review';
  const { status, refresh } = useAIStatus();
  const { language } = useCodeLanguage();
  const { drafts } = usePracticeProgress();
  const [draftState, setDraftState] = useState('none'); // 'none' | 'loading' | 'loaded' | 'error:<msg>'

  const [problemId, setProblemId] = useState(() => (getPracticeProblem(params.get('problem') ?? '') ? params.get('problem') : ''));
  const [code, setCode] = useState(() => initialCode(problemId, language));
  const [includeImproved, setIncludeImproved] = useState(false);
  const [results, setResults] = useState({ review: null, complexity: null }); // { data, model, language }
  const [pending, setPending] = useState(null); // mode being analyzed
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const edited = useRef(false);

  const ready = status.state === 'ready';
  const maxChars = status.limits?.maxCodeChars ?? 20000;
  const problem = useMemo(() => (problemId ? getPracticeProblem(problemId) : null), [problemId]);

  // Switching language or problem loads matching code, unless the learner typed their own.
  // …and the learner's saved draft for that problem, when there is one
  // (from Supabase when signed in, otherwise this browser).
  useEffect(() => {
    let alive = true;
    if (edited.current) return undefined;
    setCode(initialCode(problemId, language));
    setDraftState(problemId ? 'loading' : 'none');
    if (!problemId || !drafts.ready) return undefined;
    drafts
      .load(problemId, language)
      .then((saved) => {
        if (!alive || edited.current) return;
        if (saved != null) setCode(saved);
        setDraftState(saved != null ? 'loaded' : 'none');
      })
      .catch((error) => alive && setDraftState(`error:${error.message}`));
    return () => {
      alive = false;
    };
  }, [language, problemId, drafts]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setMode = (key) => {
    const next = new URLSearchParams(params);
    if (key === 'review') next.delete('mode');
    else next.set('mode', key);
    setParams(next, { replace: true });
    setError(null);
  };

  const run = async () => {
    if (!ready || pending) return;
    if (!code.trim()) return setError({ kind: 'error', message: 'Add some code to analyze first.' });
    if (code.length > maxChars) return setError({ kind: 'error', message: `Code is too long (max ${maxChars.toLocaleString()} characters).` });
    setError(null);
    setPending(mode);
    const controller = new AbortController();
    abortRef.current = controller;
    const payload = { language, code, ...(problemId ? { problemId } : {}) };
    const response = mode === 'review' ? await reviewCode({ ...payload, includeImprovedCode: includeImproved }, controller.signal) : await analyzeComplexity(payload, controller.signal);
    abortRef.current = null;
    setPending(null);
    if (response.ok) {
      setResults((r) => ({ ...r, [mode]: { data: response.data, model: response.model, language } }));
    } else if (response.kind !== 'aborted') {
      setError(response);
      if (response.kind === 'unavailable' || response.kind === 'not_configured') refresh();
    }
  };

  const result = results[mode];
  const ActionIcon = mode === 'review' ? ScanSearch : Gauge;

  return (
    <div className="page analyzer-page">
      <PageHeader
        eyebrow="AI Tools"
        title="Code Analyzer"
        description="Paste or write Java, C++ or Python code. Claude reviews it for bugs, logic and readability, or estimates its time and space complexity."
        actions={<FilterTabs tabs={MODES} active={mode} onChange={setMode} ariaLabel="Analysis type" />}
      />

      {status.state === 'not_configured' && <AINotice kind="not_configured" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      {status.state === 'unavailable' && <AINotice kind="unavailable" message={status.message} onRetry={refresh} retryLabel="Check again" />}
      <AIAccessNotice status={status} />

      <div className="analyzer">
        <section className="card analyzer__input" aria-label="Code to analyze">
          <div className="analyzer__toolbar">
            <LanguageSelector size="sm" />
            <select
              className="select analyzer__problem"
              value={problemId}
              onChange={(e) => {
                edited.current = false;
                setProblemId(e.target.value);
              }}
              aria-label="Problem this code solves (optional)"
            >
              <option value="">No specific problem</option>
              {practiceProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
          <div className="analyzer__editor">
            <CodeEditor
              value={code}
              language={language}
              onChange={(next) => {
                edited.current = true;
                setCode(next);
              }}
              onRun={run}
              ariaLabel={`${getLanguage(language).label} code to analyze`}
            />
          </div>
          <div className="analyzer__actions">
            {mode === 'review' ? (
              <label className="analyzer__check">
                <input type="checkbox" checked={includeImproved} onChange={(e) => setIncludeImproved(e.target.checked)} />
                Include a corrected version of my code
              </label>
            ) : (
              <span className="analyzer__hint">Results are estimates.</span>
            )}
            <div className="analyzer__buttons">
              {problem && (
                <Button variant="ghost" size="sm" to={`/practice/${problem.id}`}>
                  Open problem
                </Button>
              )}
              {pending ? (
                <Button variant="secondary" icon={Square} onClick={() => abortRef.current?.abort()}>
                  Cancel
                </Button>
              ) : (
                <Button icon={ActionIcon} onClick={run} disabled={!ready || !code.trim()}>
                  {mode === 'review' ? 'Review code' : 'Analyze complexity'}
                </Button>
              )}
            </div>
          </div>
          {problem ? (
            <p className="analyzer__context">
              Claude will check the code against <strong>{problem.title}</strong>.{' '}
              {draftState === 'loaded' && 'Your saved draft for this problem was loaded.'}
              {draftState === 'loading' && 'Loading your saved draft…'}
              {draftState === 'none' && !edited.current && 'You have no saved draft for this problem, so the starter code is shown.'}
              {draftState.startsWith('error:') && `Your saved draft couldn't be loaded: ${draftState.slice(6)}`}
            </p>
          ) : (
            !edited.current && <p className="analyzer__context">The editor starts with an example snippet. Replace it with your own code.</p>
          )}
        </section>

        <section className="card analyzer__output" aria-label="Analysis" aria-live="polite" aria-busy={Boolean(pending)}>
          {mode === 'complexity' && <EstimateDisclaimer />}
          {error && <AINotice kind={error.kind} message={error.message} onRetry={error.kind === 'error' || error.kind === 'unavailable' ? run : undefined} />}
          {pending === mode ? (
            <div className="ai-loading" role="status">
              <span className="ai-spinner" />
              {mode === 'review' ? 'Claude is reviewing your code…' : 'Claude is estimating the complexity…'}
            </div>
          ) : result ? (
            <>
              {result.language !== language && (
                <p className="analysis__muted analysis__small">This result is for your {getLanguage(result.language).label} code.</p>
              )}
              {mode === 'review' ? <ReviewResult data={result.data} language={result.language} /> : <ComplexityResult data={result.data} />}
              <AIFootnote model={result.model} />
            </>
          ) : (
            !error && (
              <div className="ai-empty">
                <span className="icon-tile icon-tile--lg tone-indigo">
                  {mode === 'review' ? <ScanSearch size={24} /> : <Gauge size={24} />}
                </span>
                <p className="ai-empty__title">{mode === 'review' ? 'Get a code review' : 'Estimate complexity'}</p>
                <p>
                  {mode === 'review'
                    ? 'Claude looks for bugs, logical mistakes and edge cases first, then readability and coding practices.'
                    : 'Claude estimates best, average and worst-case time, extra space, and possible optimizations, with its reasoning.'}
                </p>
                <p className="analysis__small">
                  Stuck on the idea itself? <Link to={problem ? `/ai-tutor?problem=${problem.id}` : '/ai-tutor'}>
                    <Bot size={13} /> Ask the AI Tutor
                  </Link>
                </p>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}
