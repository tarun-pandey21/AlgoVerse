/**
 * Lesson content keyed by topic id. Imported only by the lesson page,
 * which is lazy-loaded, so this content isn't part of the dashboard bundle.
 *
 * Each example gets an `implementations` object with Java (from the lesson
 * file) plus C++ and Python (from implementations/<topic>.js).
 */
import implementations from './implementations/index.js';
import fundamentals from './fundamentals.js';
import arrays from './arrays.js';
import strings from './strings.js';
import searching from './searching.js';
import sorting from './sorting.js';
import recursion from './recursion.js';
import linkedLists from './linked-lists.js';
import stacks from './stacks.js';
import queues from './queues.js';
import hashing from './hashing.js';
import trees from './trees.js';
import bst from './bst.js';
import heaps from './heaps.js';
import graphs from './graphs.js';
import greedy from './greedy.js';
import dynamicProgramming from './dynamic-programming.js';

const rawLessons = {
  fundamentals,
  arrays,
  strings,
  searching,
  sorting,
  recursion,
  'linked-lists': linkedLists,
  stacks,
  queues,
  hashing,
  trees,
  bst,
  heaps,
  graphs,
  greedy,
  'dynamic-programming': dynamicProgramming,
};

/** Attach C++ and Python versions to each example (matched by position). */
function withImplementations(id, lesson) {
  const extra = implementations[id] ?? {};
  return {
    ...lesson,
    examples: lesson.examples.map((example, i) => ({
      ...example,
      implementations: {
        java: { code: example.code, notes: example.notes, output: example.output },
        ...(extra.cpp?.[i] && { cpp: { output: example.output, ...extra.cpp[i] } }),
        ...(extra.python?.[i] && { python: { output: example.output, ...extra.python[i] } }),
      },
    })),
  };
}

const lessons = Object.fromEntries(
  Object.entries(rawLessons).map(([id, lesson]) => [id, withImplementations(id, lesson)])
);

export default lessons;
