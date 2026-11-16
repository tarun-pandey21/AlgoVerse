/**
 * npm run ai:check
 *
 * Sends ONE tiny request to the Claude API with the key and model from .env,
 * and prints Claude's actual reply, or the exact problem. Costs a few tokens.
 * Use it after adding ANTHROPIC_API_KEY to confirm the AI features can work.
 *
 * npm run ai:check -- --all
 *   Also runs every AI feature once against the real API (Tutor, Code Reviewer,
 *   Complexity Analyzer, Question Generator, Roadmap) with small inputs and
 *   prints PASS/FAIL for each. Uses a few thousand tokens in total.
 */
import { config, isAIConfigured } from '../server/config.js';
import { getClient, mapAnthropicError, textOf } from '../server/ai/client.js';

const mask = (key) => (key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '(set)');

if (!isAIConfigured()) {
  console.error('✗ ANTHROPIC_API_KEY is not set.');
  console.error('  Copy .env.example to .env, add your key from https://console.anthropic.com/, and run this again.');
  process.exit(1);
}

console.log(`Key:   ${mask(config.anthropic.apiKey)}`);
console.log(`Model: ${config.anthropic.model}`);
if (config.anthropic.baseURL) console.log(`Base URL: ${config.anthropic.baseURL}`);
else if (process.env.ANTHROPIC_BASE_URL) console.log(`Base URL (from environment): ${process.env.ANTHROPIC_BASE_URL}`);
console.log('Sending a test message to Claude…');

try {
  const started = Date.now();
  const message = await getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: 40,
    messages: [{ role: 'user', content: 'Reply with exactly: AlgoVerse AI is connected.' }],
  });
  const text = textOf(message);
  if (!text) {
    console.error('✗ Claude answered, but the response was empty.');
    process.exit(1);
  }
  console.log(`✓ Claude replied in ${Date.now() - started} ms (model ${message.model}):`);
  console.log(`  "${text}"`);
  if (!process.argv.includes('--all')) {
    console.log('The AI features can reach Claude. Run `npm run ai:check -- --all` to test every feature.');
  }
} catch (error) {
  const mapped = mapAnthropicError(error);
  console.error(`✗ ${mapped.code}: ${mapped.message}`);
  process.exit(1);
}

if (process.argv.includes('--all')) {
  const { reviewCode } = await import('../server/ai/reviewer.js');
  const { analyzeComplexity } = await import('../server/ai/complexity.js');
  const { generateQuestions } = await import('../server/ai/questions.js');
  const { buildRoadmap } = await import('../server/ai/roadmap.js');
  const { tutorSystem } = await import('../server/ai/prompts.js');
  const { default: problems } = await import('../src/data/practice/problems.js');

  const code = 'def find_max(nums):\n    best = 0\n    for i in range(len(nums) - 1):\n        if nums[i] > best:\n            best = nums[i]\n    return best\n';
  const checks = [
    [
      'AI Tutor (streaming)',
      async () => {
        let text = '';
        const stream = getClient().messages.stream({
          model: config.anthropic.model,
          max_tokens: 2048,
          system: tutorSystem({ language: 'java' }),
          messages: [{ role: 'user', content: 'In two sentences, what is a stack?' }],
        });
        stream.on('text', (t) => (text += t));
        await stream.finalMessage();
        if (!text.trim()) throw new Error('empty reply');
        return text.trim().replace(/\s+/g, ' ').slice(0, 90);
      },
    ],
    ['Code Reviewer', async () => {
      const { data, mode } = await reviewCode({ language: 'python', code, problem: null, includeImprovedCode: false });
      return `[${mode}] verdict=${data.verdict}, ${data.issues.length} issue(s), time ${data.complexity.time}`;
    }],
    ['Complexity Analyzer', async () => {
      const { data, mode } = await analyzeComplexity({ language: 'python', code, problem: null });
      return `[${mode}] worst ${data.time.worst}, space ${data.space}, confidence ${data.confidence}`;
    }],
    ['Question Generator', async () => {
      const { data, mode } = await generateQuestions({ topic: 'Arrays', difficulty: 'Easy', language: 'java', count: 1, focus: '' });
      const q = data.questions[0];
      if (!q) throw new Error('no questions returned');
      return `[${mode}] "${q.title}" with ${q.examples.length} example(s), ${q.hints.length} hint(s)`;
    }],
    ['AI Roadmap', async () => {
      const catalog = problems.map(({ id, title, difficulty, topic }) => ({ id, title, difficulty, topic }));
      const { data, mode } = await buildRoadmap({
        skillLevel: 'Beginner', targetDifficulty: 'Easy', weeks: 1, hoursPerWeek: 4, language: 'python', goals: '',
        completedTopics: ['Arrays'], inProgressTopics: [], weakAreas: ['Hashing'],
        solved: { ids: [], total: 0, easy: 0, medium: 0, hard: 0, byTopic: {} }, catalog,
      });
      return `[${mode}] ${data.weeks.length} week(s), first: "${data.weeks[0]?.title}"`;
    }],
  ];

  console.log('\nTesting every AI feature against the API (this takes a minute)…');
  let failed = 0;
  for (const [name, run] of checks) {
    const started = Date.now();
    try {
      const summary = await run();
      console.log(`✓ PASS  ${name} (${((Date.now() - started) / 1000).toFixed(1)} s): ${summary}`);
    } catch (error) {
      failed += 1;
      const mapped = mapAnthropicError(error);
      console.log(`✗ FAIL  ${name}: ${mapped.code}: ${mapped.message}`);
    }
  }
  console.log(failed ? `\n${failed} feature(s) failed.` : '\nAll AI features received valid responses from Claude.');
  process.exit(failed ? 1 : 0);
}
