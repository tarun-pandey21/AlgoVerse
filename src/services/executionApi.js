/**
 * Client for the AlgoVerse execution API (server/index.js).
 *
 * Code is never executed in the browser. These functions send it to our
 * backend, which forwards it to Judge0. Every call resolves to a plain
 * object instead of throwing, so the UI can show a clear state:
 *
 *   { ok: true, result }                         judged successfully
 *   { ok: false, kind: 'not_configured', message } Judge0 credentials missing
 *   { ok: false, kind: 'unavailable', message }    API server not running/reachable
 *   { ok: false, kind: 'auth_required', message }  sign-in required (production) or session expired
 *   { ok: false, kind: 'rate_limited' | 'error', message }
 */

import { authHeaders } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const UNAVAILABLE = {
  ok: false,
  kind: 'unavailable',
  message: 'The AlgoVerse API server is not reachable. Start it with `npm run server` (or run everything with `npm run dev:full`).',
};

async function call(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()), ...(options?.headers ?? {}) },
    });
  } catch {
    return UNAVAILABLE;
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not our JSON (e.g. the dev proxy's error page when the API is down)
    return UNAVAILABLE;
  }

  if (response.ok) return { ok: true, result: body };
  if (body?.error === 'not_configured') return { ok: false, kind: 'not_configured', message: body.message };
  if (body?.error === 'rate_limited') return { ok: false, kind: 'rate_limited', message: body.message };
  if (body?.error === 'invalid_token' || body?.error === 'auth_required') return { ok: false, kind: 'auth_required', message: body.message };
  if (!body?.error) return UNAVAILABLE;
  return { ok: false, kind: 'error', message: body.message ?? 'Something went wrong while running your code.' };
}

/** Whether execution is available: 'ready' | 'not_configured' | 'unavailable'. */
export async function getExecutionStatus() {
  const response = await call('/api/execution/status', { method: 'GET' });
  if (!response.ok) return { state: response.kind === 'not_configured' ? 'not_configured' : 'unavailable', message: response.message };
  return response.result.configured
    ? {
        state: 'ready',
        provider: response.result.provider,
        providerLabel: response.result.providerLabel ?? 'Judge0',
        requiresAuth: Boolean(response.result.requiresAuth),
      }
    : {
        state: 'not_configured',
        message: 'Code execution is not configured. Add your Judge0 details to `.env` (see `.env.example`) and restart the API server.',
      };
}

/** Run against the sample (visible) test cases. */
export function runCode({ problemId, language, code }) {
  return call('/api/execution/run', { method: 'POST', body: JSON.stringify({ problemId, language, code }) });
}

/** Submit: run against all visible and hidden test cases. */
export function submitCode({ problemId, language, code }) {
  return call('/api/execution/submit', { method: 'POST', body: JSON.stringify({ problemId, language, code }) });
}
