/**
 * /api/account/* – the signed-in user's own account data.
 *
 *   GET /api/account/status  → { auth, database } configuration flags (public)
 *   GET /api/account/me      → { user, profile, preferences } (requires sign-in)
 *
 * /me reads through an RLS-scoped client (the user's own JWT), so even a bug
 * here could not return another user's rows.
 */
import express from 'express';
import { config, isAuthConfigured, isDatabaseAdminConfigured } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getUserClient } from '../supabase.js';

const router = express.Router();

// Per user (or per IP when signed out). Defaults: 60 requests per minute.
router.use(
  rateLimit({
    windowMs: config.account.rateLimitWindowMs,
    max: config.account.rateLimitMax,
    message: 'Too many account requests. Please wait a minute and try again.',
  }),
);

router.get('/status', (req, res) => {
  res.json({ auth: isAuthConfigured(), database: isDatabaseAdminConfigured(), signedIn: Boolean(req.user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const db = getUserClient(req.accessToken);
  const [profile, preferences] = await Promise.all([
    db.from('profiles').select('id, display_name, username, headline, avatar_url, created_at').eq('id', req.user.id).maybeSingle(),
    db.from('user_preferences').select('preferred_language, daily_goal, email_reminders, weekly_report, streak_alerts').eq('user_id', req.user.id).maybeSingle(),
  ]);
  const failed = profile.error ?? preferences.error;
  if (failed) {
    console.error('[account] database error:', failed.message);
    const missingSchema = /relation .* does not exist|schema cache/i.test(failed.message ?? '');
    return res.status(502).json({
      error: 'database_error',
      message: missingSchema
        ? 'The AlgoVerse tables are missing. Run the SQL migrations in supabase/migrations first.'
        : 'Could not load your account from the database.',
    });
  }
  if (!profile.data) {
    return res.status(404).json({
      error: 'profile_missing',
      message: 'No profile row exists for this user. Make sure the migrations (including the signup trigger) were applied before the user signed up.',
    });
  }
  return res.json({ user: { id: req.user.id, email: req.user.email }, profile: profile.data, preferences: preferences.data });
});

export default router;
