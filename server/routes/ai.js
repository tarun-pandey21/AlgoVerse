/**
 * /api/ai/* – every Claude feature goes through here.
 *
 *   GET  /api/ai/status       → { configured, model, features }
 *   POST /api/ai/tutor        → Server-Sent Events stream (see ai/tutor.js)
 *   POST /api/ai/review       → structured code review
 *   POST /api/ai/complexity   → structured complexity estimate
 *   POST /api/ai/questions    → generated practice problems
 *   POST /api/ai/roadmap      → personalized learning roadmap
 */
import express from 'express';
import { config, isAIConfigured } from '../config.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError, LANGUAGES, DIFFICULTIES, oneOf, text, integer, stringList, conversation } from '../middleware/validate.js';
import { AIError, notConfiguredError } from '../ai/client.js';
import { streamTutorReply } from '../ai/tutor.js';
import { reviewCode } from '../ai/reviewer.js';
import { analyzeComplexity } from '../ai/complexity.js';
import { generateQuestions } from '../ai/questions.js';
import { buildRoadmap } from '../ai/roadmap.js';
import problems from '../../src/data/practice/problems.js';

const router = express.Router();
const problemsById = new Map(problems.map((p) => [p.id, p]));
const CATALOG = problems.map(({ id, title, difficulty, topic }) => ({ id, title, difficulty, topic }));

router.use(express.json({ limit: '128kb', type: () => true }));

router.get('/status', (req, res) => {
  res.json({
    configured: isAIConfigured(),
    model: isAIConfigured() ? config.anthropic.model : null,
    features: ['tutor', 'review', 'complexity', 'questions', 'roadmap'],
    requiresAuth: config.aiRequireAuth,
    limits: {
      maxMessageChars: config.ai.maxMessageChars,
      maxCodeChars: config.ai.maxCodeChars,
    },
  });
});

// Everything below calls Claude: require a key, optionally a signed-in user
// (AI_REQUIRE_AUTH=true), then rate-limit per user / IP.
router.use((req, res, next) => (isAIConfigured() ? next() : next(notConfiguredError())));
if (config.aiRequireAuth) router.use(requireAuth);
router.use(
  rateLimit({
    windowMs: config.ai.rateLimitWindowMs,
    max: config.ai.rateLimitMax,
    message: 'You’ve sent a lot of AI requests in a short time. Please wait a few minutes and try again.',
  }),
);

/** AbortSignal that fires if the browser disconnects before we answer. */
function clientSignal(res) {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });
  return controller.signal;
}

function codeInput(body) {
  const language = oneOf(body.language, LANGUAGES, 'language');
  const code = text(body.code, 'code', { required: true, max: config.ai.maxCodeChars });
  let problem = null;
  if (body.problemId !== undefined && body.problemId !== null && body.problemId !== '') {
    const p = problemsById.get(body.problemId);
    if (!p) throw new ValidationError('Unknown problemId.');
    problem = { title: p.title, statement: [...p.description, ...(p.constraints ?? []).map((c) => `Constraint: ${c}`)].join('\n') };
  } else if (body.problem) {
    problem = {
      title: text(body.problem.title, 'problem.title', { max: 200 }),
      statement: text(body.problem.statement, 'problem.statement', { max: 4000 }),
    };
  }
  return { language, code, problem };
}

router.post('/tutor', async (req, res) => {
  const body = req.body ?? {};
  const messages = conversation(body.messages, config.ai);
  const language = body.language === undefined ? 'java' : oneOf(body.language, LANGUAGES, 'language');
  const context = text(body.context, 'context', { max: 4000 });
  await streamTutorReply({ messages, language, context }, req, res);
});

router.post('/review', async (req, res) => {
  const input = codeInput(req.body ?? {});
  const result = await reviewCode({ ...input, includeImprovedCode: req.body?.includeImprovedCode === true }, clientSignal(res));
  res.json(result);
});

router.post('/complexity', async (req, res) => {
  const input = codeInput(req.body ?? {});
  res.json(await analyzeComplexity(input, clientSignal(res)));
});

router.post('/questions', async (req, res) => {
  const body = req.body ?? {};
  const input = {
    topic: text(body.topic, 'topic', { required: true, max: 80 }),
    difficulty: oneOf(body.difficulty, DIFFICULTIES, 'difficulty'),
    language: oneOf(body.language, LANGUAGES, 'language'),
    count: integer(body.count, 'count', { min: 1, max: 3, fallback: 1 }),
    focus: text(body.focus, 'focus', { max: 300 }),
  };
  res.json(await generateQuestions(input, clientSignal(res)));
});

router.post('/roadmap', async (req, res) => {
  const body = req.body ?? {};
  const solvedIds = stringList(body.solvedProblemIds, 'solvedProblemIds', { maxItems: 500, maxLength: 80 }).filter((id) => problemsById.has(id));
  const solvedProblems = solvedIds.map((id) => problemsById.get(id));
  const byTopic = {};
  for (const p of solvedProblems) byTopic[p.topic] = (byTopic[p.topic] ?? 0) + 1;

  const input = {
    skillLevel: oneOf(body.skillLevel, ['Beginner', 'Intermediate', 'Advanced'], 'skillLevel'),
    targetDifficulty: oneOf(body.targetDifficulty, DIFFICULTIES, 'targetDifficulty'),
    weeks: integer(body.weeks, 'weeks', { min: 1, max: 8, fallback: 4 }),
    hoursPerWeek: integer(body.hoursPerWeek, 'hoursPerWeek', { min: 1, max: 40, fallback: 6 }),
    language: oneOf(body.language ?? 'java', LANGUAGES, 'language'),
    goals: text(body.goals, 'goals', { max: 500 }),
    completedTopics: stringList(body.completedTopics, 'completedTopics'),
    inProgressTopics: stringList(body.inProgressTopics, 'inProgressTopics'),
    weakAreas: stringList(body.weakAreas, 'weakAreas'),
    solved: {
      ids: solvedIds,
      total: solvedProblems.length,
      easy: solvedProblems.filter((p) => p.difficulty === 'Easy').length,
      medium: solvedProblems.filter((p) => p.difficulty === 'Medium').length,
      hard: solvedProblems.filter((p) => p.difficulty === 'Hard').length,
      byTopic,
    },
    catalog: CATALOG,
  };
  const result = await buildRoadmap(input, clientSignal(res));

  // Only keep catalog links that really exist.
  for (const week of result.data.weeks ?? []) {
    for (const item of week.practice ?? []) {
      if (item.problemId && !problemsById.has(item.problemId)) item.problemId = null;
    }
  }
  res.json(result);
});

/** Errors from this router → JSON (never a stack trace, never the key). */
// eslint-disable-next-line no-unused-vars
router.use((error, req, res, next) => {
  if (res.headersSent) return res.end();
  if (error instanceof ValidationError) return res.status(error.status).json({ error: 'bad_request', message: error.message });
  if (error instanceof AIError) {
    if (error.code === 'aborted') return res.end();
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'too_large', message: 'Request is too large.' });
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_request', message: 'Request body must be valid JSON.' });
  console.error('[ai] unexpected error:', error?.message ?? error);
  return res.status(500).json({ error: 'server_error', message: 'Unexpected server error.' });
});

export default router;
