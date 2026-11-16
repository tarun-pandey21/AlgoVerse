/** AI Complexity Analyzer – an LLM *estimate* of time/space complexity. */
import { callStructured } from './client.js';
import { complexitySystem, LANGUAGE_NAMES } from './prompts.js';
import { numberLines, problemBlock } from './format.js';

// JSON Schema for the response (sent as output_config.format; see client.js)
const FORMAT = {
  name: 'complexity_analysis',
  description: 'Submit the estimated complexity analysis.',
  schema: {
    type: 'object',
    properties: {
      variables: { type: 'string', description: 'What n, m, k etc. stand for.' },
      time: {
        type: 'object',
        properties: {
          best: { type: 'string' },
          average: { type: 'string' },
          worst: { type: 'string' },
        },
        required: ['best', 'average', 'worst'],
      },
      space: { type: 'string', description: 'Auxiliary space in Big-O, including recursion stack.' },
      timeExplanation: { type: 'string' },
      spaceExplanation: { type: 'string' },
      steps: {
        type: 'array',
        description: 'Step-by-step reasoning, one entry per significant part of the code.',
        items: {
          type: 'object',
          properties: {
            lines: { type: 'string', description: 'Line or range, e.g. "4-9".' },
            cost: { type: 'string', description: 'e.g. O(n) per call' },
            reason: { type: 'string' },
          },
          required: ['lines', 'cost', 'reason'],
        },
      },
      assumptions: { type: 'array', items: { type: 'string' } },
      optimizations: {
        type: 'array',
        description: 'Possible optimizations; empty if the code is already optimal.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            time: { type: 'string', description: 'Time complexity after the change.' },
            space: { type: 'string', description: 'Space complexity after the change.' },
          },
          required: ['title', 'description', 'time', 'space'],
        },
      },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['variables', 'time', 'space', 'timeExplanation', 'spaceExplanation', 'steps', 'assumptions', 'optimizations', 'confidence'],
  },
};

export function analyzeComplexity({ language, code, problem }, signal) {
  const lang = LANGUAGE_NAMES[language];
  const prompt = `Estimate the time and space complexity of this ${lang} code.
${problemBlock(problem)}
<code language="${lang}">
${numberLines(code)}
</code>`;
  return callStructured({ system: complexitySystem(), prompt, format: FORMAT, maxTokens: 4000, signal });
}
