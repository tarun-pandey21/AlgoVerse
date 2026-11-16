/**
 * Runs a learner's program against a problem's test cases via Judge0 and
 * produces a verdict.
 *
 *   run    → visible tests only; inputs, expected and actual output are returned
 *   submit → visible + hidden tests; hidden tests return only pass/fail and status
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, config } from './config.js';
import { executeOnce } from './judge0.js';
import problems from '../src/data/practice/problems.js';
import { formatInput, formatOutput, normalizeOutput } from '../src/data/practice/io.js';

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, relative), 'utf8'));
const visibleTests = readJson('src/data/practice/visibleTests.json');
const hiddenTests = readJson('server/data/hiddenTests.json');
const problemsById = new Map(problems.map((p) => [p.id, p]));

export const LANGUAGES = ['java', 'cpp', 'python'];
const MAX_SHOWN_OUTPUT = 8 * 1024;
const clip = (text) => (text.length > MAX_SHOWN_OUTPUT ? `${text.slice(0, MAX_SHOWN_OUTPUT)}\n… (output truncated)` : text);

export function getProblem(id) {
  return problemsById.get(id);
}

/** Maps a Judge0 status (plus our output check) to a test status. */
function testStatus(result, expected) {
  switch (result.statusId) {
    case 3: // ran successfully: compare the output ourselves
    case 4:
      return normalizeOutput(result.stdout) === normalizeOutput(expected) ? 'passed' : 'wrong_answer';
    case 5:
      return 'time_limit_exceeded';
    case 6:
      return 'compilation_error';
    case 7: case 8: case 9: case 10: case 11: case 12:
      return 'runtime_error';
    default:
      return 'internal_error';
  }
}

/** Runs async tasks with a concurrency limit, keeping results in order. */
async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await task(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

const VERDICT_LABELS = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  compilation_error: 'Compilation Error',
  runtime_error: 'Runtime Error',
  time_limit_exceeded: 'Time Limit Exceeded',
  internal_error: 'Execution Error',
};

export async function judge({ problem, language, code, mode }) {
  const cases = [
    ...visibleTests[problem.id].map((t) => ({ ...t, visible: true })),
    ...(mode === 'submit' ? hiddenTests[problem.id].map((t) => ({ ...t, visible: false })) : []),
  ].map((t, index) => ({
    index,
    visible: t.visible,
    stdin: formatInput(problem.signature, t.args),
    expected: formatOutput(problem.signature, t.expected),
  }));

  const runCase = async (testCase) => {
    const result = await executeOnce({ language, sourceCode: code, stdin: testCase.stdin });
    return { testCase, result, status: testStatus(result, testCase.expected) };
  };

  // Run the first test alone: a compilation error would repeat for every test.
  const first = await runCase(cases[0]);
  let outcomes = [first];
  if (first.status !== 'compilation_error') {
    outcomes = outcomes.concat(await mapLimit(cases.slice(1), config.judge0.concurrency, runCase));
  }

  const failing = outcomes.find((o) => o.status !== 'passed');
  const verdict = failing ? failing.status : 'accepted';
  const passed = outcomes.filter((o) => o.status === 'passed').length;

  return {
    mode,
    verdict,
    verdictLabel: VERDICT_LABELS[verdict],
    passed,
    total: cases.length,
    compileOutput: first.status === 'compilation_error' ? clip(first.result.compileOutput || first.result.message) : '',
    results: outcomes.map(({ testCase, result, status }) => {
      const base = {
        index: testCase.index,
        visible: testCase.visible,
        status,
        statusDescription: result.statusDescription,
        time: result.time,
        memory: result.memory,
      };
      // Hidden tests never reveal their input, expected output or program output
      if (!testCase.visible) return base;
      return {
        ...base,
        input: testCase.stdin,
        expectedOutput: testCase.expected,
        actualOutput: clip(result.stdout),
        stderr: clip(result.stderr || (status === 'runtime_error' ? result.message : '')),
      };
    }),
    judgedAt: new Date().toISOString(),
  };
}
