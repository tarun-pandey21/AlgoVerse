/**
 * Authentication middleware (Supabase access tokens).
 *
 *   authenticate – if an "Authorization: Bearer <jwt>" header is present,
 *                  verify it and set req.user / req.accessToken. Requests
 *                  without a token continue anonymously; a present but
 *                  invalid token is rejected with 401 (never silently ignored).
 *   requireAuth  – 401 unless authenticate() established a user.
 *
 * The user id always comes from the verified token, never from the body.
 */
import { isAuthConfigured } from '../config.js';
import { verifyAccessToken, AuthError } from '../supabase.js';

function bearerToken(req) {
  const header = req.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/*
 * Failed sign-in token checks are limited per IP (30 per minute), on every
 * /api route. Without this, a flood of bogus tokens would bypass the per-user
 * limits (which only apply after a successful check) and could make the
 * server call Supabase Auth over and over.
 */
const FAILURE_WINDOW_MS = 60_000;
const FAILURE_MAX = 30;
const failures = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of failures) {
    const recent = times.filter((t) => now - t < FAILURE_WINDOW_MS);
    if (recent.length) failures.set(ip, recent);
    else failures.delete(ip);
  }
}, FAILURE_WINDOW_MS).unref();

function recentFailures(ip) {
  const now = Date.now();
  return (failures.get(ip) ?? []).filter((t) => now - t < FAILURE_WINDOW_MS);
}

function sendAuthError(res, error) {
  if (error.status === 401) res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
  return res.status(error.status).json({ error: error.code, message: error.message });
}

export async function authenticate(req, res, next) {
  const token = bearerToken(req);
  if (!token) return next();
  if (!isAuthConfigured()) {
    return sendAuthError(res, new AuthError(503, 'auth_not_configured', 'Sign-in is not configured on the server.'));
  }
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const recent = recentFailures(ip);
  if (recent.length >= FAILURE_MAX) {
    res.set('Retry-After', String(Math.ceil((FAILURE_WINDOW_MS - (Date.now() - recent[0])) / 1000)));
    return res.status(429).json({ error: 'rate_limited', message: 'Too many failed sign-in attempts. Please wait a minute and sign in again.' });
  }
  try {
    req.user = await verifyAccessToken(token);
    req.accessToken = token;
    return next();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) failures.set(ip, [...recent, Date.now()]);
      return sendAuthError(res, error);
    }
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  if (req.user) return next();
  if (!isAuthConfigured()) {
    return sendAuthError(res, new AuthError(503, 'auth_not_configured', 'Sign-in is not configured on the server. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.'));
  }
  return sendAuthError(res, new AuthError(401, 'auth_required', 'Please sign in to use this feature.'));
}
