/** AI Code Reviewer – structured review of Java / C++ / Python code. */
import { callStructured } from './client.js';
import { reviewSystem, LANGUAGE_NAMES } from './prompts.js';
import { numberLines, problemBlock } from './format.js';

// JSON Schema for the response (sent as output_config.format; see client.js)
const FORMAT = {
  name: 'code_review',
  description: 'Submit the structured code review.',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '2-3 sentence overall assessment in plain language.' },
      verdict: {
        type: 'string',
        enum: ['looks_correct', 'minor_issues', 'has_bugs', 'incomplete'],
        description: 'Overall correctness verdict.',
      },
      issues: {
        type: 'array',
        description: 'Bugs, logical mistakes and edge cases first, then quality issues. Empty if none.',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
            category: { type: 'string', enum: ['bug', 'logic', 'edge_case', 'performance', 'readability', 'best_practice'] },
            line: { type: ['integer', 'null'], description: 'Line number from the listing, or null.' },
            title: { type: 'string' },
            explanation: { type: 'string', description: 'What is wrong and why; include a failing input if possible.' },
            suggestion: { type: 'string', description: 'How to fix it (may include a short code snippet in Markdown).' },
          },
          required: ['severity', 'category', 'title', 'explanation', 'suggestion'],
        },
      },
      strengths: { type: 'array', items: { type: 'string' }, description: 'What the code does well.' },
      readability: {
        type: 'object',
        properties: {
          rating: { type: 'string', enum: ['excellent', 'good', 'fair', 'needs_work'] },
          comments: { type: 'string' },
        },
        required: ['rating', 'comments'],
      },
      complexity: {
        type: 'object',
        properties: {
          time: { type: 'string', description: 'Big-O time, e.g. O(n log n).' },
          space: { type: 'string', description: 'Big-O auxiliary space.' },
          explanation: { type: 'string' },
        },
        required: ['time', 'space', 'explanation'],
      },
      improvedCode: {
        type: 'string',
        description: 'Complete corrected/improved version of the code, only when requested; otherwise empty string.',
      },
    },
    required: ['summary', 'verdict', 'issues', 'strengths', 'readability', 'complexity'],
  },
};

export function reviewCode({ language, code, problem, includeImprovedCode }, signal) {
  const lang = LANGUAGE_NAMES[language];
  const prompt = `Review this ${lang} code.
${problemBlock(problem)}
<code language="${lang}">
${numberLines(code)}
</code>

${includeImprovedCode ? 'Also include a complete improved version of the code in improvedCode.' : 'Leave improvedCode empty; the learner wants to fix the code themselves.'}`;
  return callStructured({ system: reviewSystem(), prompt, format: FORMAT, maxTokens: 6000, signal });
}
