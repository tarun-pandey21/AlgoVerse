/**
 * Tags for source code in lesson files (java`...`, cpp`...`, python`...`).
 * Uses String.raw so backslashes (e.g. "\\s+") are kept exactly as written,
 * and trims the leading/trailing blank lines of the template literal.
 *
 * Every lesson file exports one object with this shape:
 * {
 *   summary:      string,
 *   introduction: string[],                              // paragraphs
 *   concepts:     { heading, paragraphs: string[], points?: string[] }[],
 *   visualizers?: ('array-operations' | 'linear-search' | 'binary-search' |
 *                  'bubble-sort' | 'selection-sort' | 'insertion-sort')[],
 *   applications: { title, description }[],
 *   terminology:  { term, definition }[],
 *   examples:     { title, description, code, notes: { match, text }[], output, time, space }[],
 *   algorithm:    { title, steps: string[], dryRun?: { title, lines: string[] } },
 *   complexity:   { columns: string[], rows: string[][], note?: string },
 *   mistakes:     { mistake, fix }[],
 *   takeaways:    string[],
 *   practice:     string[],                              // problem ids from data/practice/problems.js
 *   languageNotes: { java: string[], cpp: string[], python: string[] }, // language-specific tips
 * }
 *
 * Each example's `code`/`notes`/`output` is the Java version. The C++ and Python
 * versions live in implementations/<topic>.js as { cpp: [...], python: [...] },
 * one entry per example in the same order. An entry may override `output`,
 * `time` or `space`; otherwise the Java values are used.
 *
 * In text, `backticks` render as inline code. In example notes, `match` is a
 * snippet of the code line being explained; the UI finds its line number.
 */
export const code = (strings, ...values) =>
  String.raw({ raw: strings.raw }, ...values)
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');

// Same tag under each language's name, so source reads naturally: cpp`...`, python`...`
export const java = code;
export const cpp = code;
export const python = code;
