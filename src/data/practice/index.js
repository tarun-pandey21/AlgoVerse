/**
 * Practice problems ready for the UI: statements plus the visible test cases
 * (hidden tests stay on the server), with stdin/stdout text precomputed.
 */
import problems from './problems.js';
import visibleTests from './visibleTests.json';
import topics from '../topics.js';
import { formatInput, formatOutput, describeArgs, describeExpected } from './io.js';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };

const practiceProblems = problems.map((problem, order) => {
  const tests = (visibleTests[problem.id] ?? []).map((t, i) => ({
    index: i,
    stdin: formatInput(problem.signature, t.args),
    stdout: formatOutput(problem.signature, t.expected),
    argsText: describeArgs(problem.signature, t.args),
    expectedText: describeExpected(problem.signature, t.expected),
  }));
  return {
    ...problem,
    order,
    examples: tests.slice(0, 2).map((t, i) => ({ ...t, note: problem.exampleNotes?.[i] })),
    sampleTests: tests.slice(2),
    visibleTestCount: tests.length,
  };
});

export default practiceProblems;

const byId = new Map(practiceProblems.map((p) => [p.id, p]));

export function getPracticeProblem(id) {
  return byId.get(id);
}

/** Previous and next problems in library order (for navigation). */
export function getNeighbors(id) {
  const i = practiceProblems.findIndex((p) => p.id === id);
  return { previous: practiceProblems[i - 1] ?? null, next: practiceProblems[i + 1] ?? null };
}

/** Topics that have practice problems, in curriculum order. */
export const PRACTICE_TOPICS = topics
  .filter((t) => practiceProblems.some((p) => p.topic === t.id))
  .map((t) => ({ id: t.id, name: t.name, count: practiceProblems.filter((p) => p.topic === t.id).length }));

export function topicName(id) {
  return topics.find((t) => t.id === id)?.name ?? id;
}

/** Rough time estimate shown on challenge cards. */
export const ESTIMATED_MINUTES = { Easy: 15, Medium: 25, Hard: 40 };

/** Problem of the day: rotates through the library, one per calendar day. */
export function getDailyProblem(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return practiceProblems[dayNumber % practiceProblems.length];
}
