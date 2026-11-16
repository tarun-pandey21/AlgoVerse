/** Small helpers for building prompts. */

/** Prefix each line with its number so Claude can reference lines. */
export function numberLines(code) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const width = String(lines.length).length;
  return lines.map((line, i) => `${String(i + 1).padStart(width, ' ')} | ${line}`).join('\n');
}

/** Optional problem context (title + statement) the code is meant to solve. */
export function problemBlock(problem) {
  if (!problem || (!problem.title && !problem.statement)) return '';
  return `
The code is meant to solve this problem:
<problem>
${problem.title ? `Title: ${problem.title}\n` : ''}${problem.statement ?? ''}
</problem>
`;
}
