/**
 * Input/output conventions for practice problems, shared by the browser and the
 * backend (pure JavaScript, no imports).
 *
 * Programs read a test case from standard input and print the answer to
 * standard output. These helpers turn structured test arguments into stdin
 * text, turn expected answers into stdout text, and describe both formats in
 * plain English.
 *
 * stdin, one parameter after another:
 *   int        one line: the integer
 *   string     one line: the whole line is the string (it may be empty or contain spaces)
 *   int[]      a line with n, then a line with n space-separated integers
 *   string[]   a line with n, then n lines with one string each
 *   int[][]    a line "rows cols", then one line of space-separated integers per row
 *   ListNode   like int[]: the node values from head to tail
 *   TreeNode   a line with n, then a line of n level-order tokens ("null" = no node)
 *
 * stdout, depending on the return type:
 *   int / string     the value
 *   bool             "true" or "false"
 *   int[] / ListNode values on one line, separated by spaces (an empty line if empty)
 *   string[]         one string per line
 *   int[][]          one row per line, values separated by spaces
 *   string[][]       one group per line, strings separated by spaces
 */

/* ---------------------------------------------------------------- stdin */

function formatValue(type, value) {
  switch (type) {
    case 'int':
    case 'string':
      return [String(value)];
    case 'int[]':
    case 'ListNode':
      return [String(value.length), value.join(' ')];
    case 'string[]':
      return [String(value.length), ...value];
    case 'int[][]':
      return [`${value.length} ${value.length ? value[0].length : 0}`, ...value.map((row) => row.join(' '))];
    case 'TreeNode':
      return [String(value.length), value.map((v) => (v === null ? 'null' : v)).join(' ')];
    default:
      throw new Error(`Unsupported parameter type: ${type}`);
  }
}

/** Structured arguments → the exact stdin text the program receives. */
export function formatInput(signature, args) {
  return signature.params.flatMap((param, i) => formatValue(param.type, args[i])).join('\n') + '\n';
}

/* --------------------------------------------------------------- stdout */

const compareValues = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function compareRows(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c = compareValues(a[i], b[i]);
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

/**
 * Puts answers that may come in any order into one canonical order.
 * The generated starter code applies exactly the same sort before printing.
 */
export function canonicalize(signature, value) {
  if (!signature.sortOutput) return value;
  switch (signature.returns) {
    case 'int[]':
      return [...value].sort((a, b) => a - b);
    case 'string[]':
      return [...value].sort(compareValues);
    case 'int[][]':
      return value.map((row) => [...row]).sort(compareRows);
    case 'string[][]':
      return value.map((group) => [...group].sort(compareValues)).sort(compareRows);
    default:
      return value;
  }
}

/** Expected answer → the exact stdout text a correct program prints. */
export function formatOutput(signature, rawValue) {
  const value = canonicalize(signature, rawValue);
  switch (signature.returns) {
    case 'int':
    case 'string':
      return String(value);
    case 'bool':
      return value ? 'true' : 'false';
    case 'int[]':
    case 'ListNode':
      return value.join(' ');
    case 'string[]':
      return value.join('\n');
    case 'int[][]':
    case 'string[][]':
      return value.map((row) => row.join(' ')).join('\n');
    default:
      throw new Error(`Unsupported return type: ${signature.returns}`);
  }
}

/**
 * Normalises program output for comparison: unifies line endings, drops
 * trailing spaces on each line and trailing blank lines.
 */
export function normalizeOutput(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/* ---------------------------------------------------- Human-readable text */

const READ_DESCRIPTIONS = {
  int: (n) => [`one line containing the integer \`${n}\``],
  string: (n) => [`one line containing the string \`${n}\` (the whole line; it may be empty or contain spaces)`],
  'int[]': (n) => [`one line with an integer k, the length of \`${n}\``, `one line with k space-separated integers: the elements of \`${n}\``],
  ListNode: (n) => [`one line with an integer k, the number of nodes in list \`${n}\``, `one line with k space-separated integers: the node values from head to tail`],
  'string[]': (n) => [`one line with an integer k, the number of strings in \`${n}\``, `k lines, each containing one string of \`${n}\``],
  'int[][]': (n) => [`one line with two integers r and c: the number of rows in \`${n}\` and the length of each row`, `r lines, each with c space-separated integers`],
  TreeNode: (n) => [`one line with an integer k, the number of tokens describing tree \`${n}\``, 'one line with k tokens: the node values in level order, where `null` marks a missing child'],
};

/** Input format as a list of plain-English lines. */
export function describeInputFormat(signature) {
  return signature.params.flatMap((p) => READ_DESCRIPTIONS[p.type](p.name));
}

const WRITE_DESCRIPTIONS = {
  int: 'Print a single integer.',
  string: 'Print the resulting string on one line.',
  bool: 'Print `true` or `false`.',
  'int[]': 'Print the integers on one line, separated by spaces (print an empty line if there are none).',
  ListNode: 'Print the values of the resulting list from head to tail on one line, separated by spaces (an empty line for an empty list).',
  'string[]': 'Print each string on its own line.',
  'int[][]': 'Print each row on its own line, with values separated by spaces.',
  'string[][]': 'Print each group on its own line, with strings separated by spaces.',
};

/** Output format as plain-English text. */
export function describeOutputFormat(signature) {
  const base = WRITE_DESCRIPTIONS[signature.returns];
  return signature.sortOutput
    ? `${base} Any order is accepted: the starter code sorts your answer before printing it.`
    : base;
}

/** Example arguments as readable assignments, e.g. `nums = [2, 7, 11, 15]`. */
export function describeArgs(signature, args) {
  return signature.params.map((p, i) => `${p.name} = ${prettyValue(p.type, args[i])}`);
}

export function prettyValue(type, value) {
  switch (type) {
    case 'string':
      return JSON.stringify(value);
    case 'bool':
      return value ? 'true' : 'false';
    case 'int':
      return String(value);
    case 'string[]':
      return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
    case 'int[][]':
      return `[${value.map((row) => `[${row.join(', ')}]`).join(', ')}]`;
    case 'string[][]':
      return `[${value.map((row) => `[${row.map((v) => JSON.stringify(v)).join(', ')}]`).join(', ')}]`;
    case 'TreeNode':
      return `[${value.map((v) => (v === null ? 'null' : v)).join(', ')}]`;
    default:
      return `[${value.join(', ')}]`;
  }
}

/** Expected answer in readable form (after canonical ordering). */
export function describeExpected(signature, value) {
  return prettyValue(signature.returns, canonicalize(signature, value));
}
