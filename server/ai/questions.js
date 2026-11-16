/** AI Question Generator – original practice problems by topic/difficulty/language. */
import { callStructured } from './client.js';
import { questionSystem, LANGUAGE_NAMES } from './prompts.js';

// JSON Schema for the response (sent as output_config.format; see client.js)
const FORMAT = {
  name: 'questions',
  description: 'Submit the generated practice problems.',
  schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
            topic: { type: 'string' },
            statement: { type: 'string', description: 'Problem statement in Markdown (no examples or constraints here).' },
            signature: { type: 'string', description: 'Function signature in the requested language.' },
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                  output: { type: 'string' },
                  explanation: { type: 'string' },
                },
                required: ['input', 'output', 'explanation'],
              },
            },
            constraints: { type: 'array', items: { type: 'string' } },
            hints: { type: 'array', description: '2-4 progressive hints.', items: { type: 'string' } },
            approach: { type: 'string', description: 'Short outline of the intended approach and its complexity (shown only on request).' },
          },
          required: ['title', 'difficulty', 'topic', 'statement', 'signature', 'examples', 'constraints', 'hints', 'approach'],
        },
      },
    },
    required: ['questions'],
  },
};

export function generateQuestions({ topic, difficulty, language, count, focus }, signal) {
  const lang = LANGUAGE_NAMES[language];
  const prompt = `Generate ${count} original ${difficulty} DSA practice problem${count > 1 ? 's' : ''} on the topic "${topic}".
Write the function signature in ${lang}.${focus ? `\nThe learner also asked for: ${focus}` : ''}
Each problem needs 2-3 examples, realistic constraints and 2-4 progressive hints.${count > 1 ? ' Make the problems meaningfully different from each other.' : ''}`;
  return callStructured({ system: questionSystem(), prompt, format: FORMAT, maxTokens: 2500 * count + 1000, signal });
}
