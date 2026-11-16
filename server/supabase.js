/**
 * Supabase clients for the Express server.
 *
 *   verifyAccessToken(jwt) – verifies a user's Supabase access token
 *                            (supabase.auth.getClaims: JWKS for asymmetric
 *                            signing keys, Auth server fallback otherwise).
 *   getUserClient(jwt)     – a client that acts AS the user, so every query
 *                            is filtered by Row Level Security.
 *   getAdminClient()       – secret-key client that bypasses RLS. Use it only
 *                            for trusted, server-produced writes (Judge0
 *                            verdicts, Claude replies) and always set user_id
 *                            from a verified token, never from the request body.
 *
 * Keys are read from server config only and are never sent to the browser.
 */
import { createClient } from '@supabase/supabase-js';
import { config, isAuthConfigured, isDatabaseAdminConfigured } from './config.js';

const SERVER_AUTH_OPTIONS = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

let authClient = null;
let adminClient = null;

function getAuthClient() {
  if (!isAuthConfigured()) return null;
  authClient ??= createClient(config.supabase.url, config.supabase.publishableKey, { auth: SERVER_AUTH_OPTIONS });
  return authClient;
}

export function getAdminClient() {
  if (!isDatabaseAdminConfigured()) return null;
  adminClient ??= createClient(config.supabase.url, config.supabase.secretKey, { auth: SERVER_AUTH_OPTIONS });
  return adminClient;
}

/** A per-request client that sends the user's JWT, so RLS applies. */
export function getUserClient(accessToken) {
  if (!isAuthConfigured()) return null;
  return createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: SERVER_AUTH_OPTIONS,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Verify a Supabase access token. Resolves to { id, email, role, claims }.
 * Throws AuthError(401) for invalid/expired tokens or non-user tokens.
 */
export async function verifyAccessToken(token) {
  const client = getAuthClient();
  if (!client) throw new AuthError(503, 'auth_not_configured', 'Sign-in is not configured on the server (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).');
  if (typeof token !== 'string' || token.split('.').length !== 3 || token.length > 8192) {
    throw new AuthError(401, 'invalid_token', 'Your session token is malformed. Please sign in again.');
  }

  let result;
  try {
    result = await client.auth.getClaims(token);
  } catch (error) {
    console.error('[auth] token verification failed:', error?.message ?? error);
    throw new AuthError(503, 'auth_unavailable', 'Could not verify your session right now. Please try again.');
  }
  const claims = result?.data?.claims;
  if (result?.error || !claims) {
    throw new AuthError(401, 'invalid_token', 'Your session has expired or is invalid. Please sign in again.');
  }
  // Only real signed-in users: not anon/service tokens, not other projects.
  if (claims.role !== 'authenticated' || typeof claims.sub !== 'string' || !claims.sub) {
    throw new AuthError(401, 'invalid_token', 'This token does not belong to a signed-in user.');
  }
  if (config.supabase.url && claims.iss && !String(claims.iss).startsWith(config.supabase.url)) {
    throw new AuthError(401, 'invalid_token', 'This token was issued by a different Supabase project.');
  }
  return { id: claims.sub, email: claims.email ?? null, role: claims.role, claims };
}
