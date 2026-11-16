/**
 * /api/execution/* – code execution via Judge0 (unchanged behaviour from Phase 4).
 *
 *   GET  /api/execution/status    → { configured, provider, languages }
 *   POST /api/execution/run       → run against visible (sample) tests
 *   POST /api/execution/submit    → run against visible + hidden tests; for a
 *                                   signed-in user the verdict is saved to
 *                                   Supabase `submissions` (result.persistence)
 */
import express from 'express';
import { config, isExecutionConfigured } from '../config.js';
import { judge, getProblem, LANGUAGES } from '../judge.js';
import { Judge0Error, provider } from '../judge0.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { saveSubmission } from '../db/submissions.js';

const router = express.Router();

router.get('/status', (req, res) => {
  const service = provider();
  res.json({
    configured: isExecutionConfigured(),
    provider: service.id,
    providerLabel: service.label,
    languages: LANGUAGES,
    requiresAuth: config.executionRequireAuth,
  });
});

const limiter = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: config.limits.rateLimitMax,
  message: 'Too many runs in a short time. Please wait a few minutes and try again.',
});

function requireConfigured(req, res, next) {
  if (isExecutionConfigured()) return next();
  return res.status(503).json({
    error: 'not_configured',
    message: 'Code execution is not configured. Set JUDGE0_URL (and credentials if needed) in .env, then restart the server.',
  });
}

const jsonBody = express.json({ limit: config.limits.maxCodeBytes + 16 * 1024, type: () => true });

function handler(mode) {
  return async (req, res) => {
    const { problemId, language, code } = req.body ?? {};
    const problem = typeof problemId === 'string' ? getProblem(problemId) : undefined;
    if (!problem) return res.status(404).json({ error: 'unknown_problem', message: 'Unknown problem.' });
    if (!LANGUAGES.includes(language)) return res.status(400).json({ error: 'bad_request', message: 'Language must be java, cpp or python.' });
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ error: 'bad_request', message: 'Code is empty.' });
    if (Buffer.byteLength(code) > config.limits.maxCodeBytes) {
      return res.status(413).json({ error: 'too_large', message: `Code must be under ${Math.round(config.limits.maxCodeBytes / 1024)} KB.` });
    }
    try {
      const result = await judge({ problem, language, code, mode });
      if (mode === 'submit') {
        // Signed-in users: store the verdict in Supabase (trusted server write).
        // Signed-out users: nothing is stored on the server.
        result.persistence = req.user
          ? await saveSubmission({ userId: req.user.id, problemId: problem.id, language, code, result })
          : { saved: false, reason: 'signed_out' };
      }
      return res.json(result);
    } catch (error) {
      if (error instanceof Judge0Error) return res.status(error.httpStatus).json({ error: 'execution_failed', message: error.message });
      console.error(error);
      return res.status(500).json({ error: 'server_error', message: 'Unexpected server error while running the code.' });
    }
  };
}

// Production: only signed-in users may run code (EXECUTION_REQUIRE_AUTH, see config.js).
const signedIn = (req, res, next) => (config.executionRequireAuth ? requireAuth(req, res, next) : next());

router.post('/run', requireConfigured, signedIn, limiter, jsonBody, handler('run'));
router.post('/submit', requireConfigured, signedIn, limiter, jsonBody, handler('submit'));

// eslint-disable-next-line no-unused-vars
router.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'bad_request', message: 'Request body too large.' });
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_request', message: 'Request body must be valid JSON.' });
  console.error(error);
  return res.status(500).json({ error: 'server_error', message: 'Unexpected server error.' });
});

export default router;
