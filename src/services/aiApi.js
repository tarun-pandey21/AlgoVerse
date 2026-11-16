/**
 * Client for the AlgoVerse AI API (server/routes/ai.js).
 *
 * The browser never talks to Anthropic and never sees the API key: every
 * request goes to our own backend at /api/ai/*, which calls Claude.
 *
 * Every function resolves (never throws) to either
 *   { ok: true, ... }
 *   { ok: false, kind, message }
 * kind: 'not_configured' | 'unavailable' | 'rate_limited' | 'auth_required' | 'aborted' | 'error'
 */

import { authHeaders } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const UNAVAILABLE = {
  ok: false,
  kind: 'unavailable',
  message: 'The AlgoVerse API server is not reachable. Start it with `npm run server` (or run everything with `npm run dev:full`).',
};

function failure(body) {
  if (!body?.error) return UNAVAILABLE;
  if (body.error === 'not_configured') return { ok: false, kind: 'not_configured', message: body.message };
  if (body.error === 'rate_limited' || body.error === 'upstream_rate_limited') return { ok: false, kind: 'rate_limited', message: body.message };
  if (body.error === 'auth_required' || body.error === 'invalid_token') return { ok: false, kind: 'auth_required', message: body.message };
  return { ok: false, kind: 'error', code: body.error, message: body.message ?? 'Something went wrong. Please try again.' };
}

const isAbort = (error) => error?.name === 'AbortError';
const ABORTED = { ok: false, kind: 'aborted', message: 'Stopped.' };

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null; // e.g. the dev proxy's error page when the API server is down
  }
}

/** { state: 'ready' | 'not_configured' | 'unavailable', model?, limits? } */
export async function getAIStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/ai/status`, { headers: await authHeaders() });
    const body = await readJson(response);
    if (!response.ok || !body || typeof body.configured !== 'boolean') return { state: 'unavailable', message: UNAVAILABLE.message };
    return body.configured
      ? { state: 'ready', model: body.model, limits: body.limits, requiresAuth: Boolean(body.requiresAuth) }
      : {
          state: 'not_configured',
          message: 'AI features are not configured yet. Add ANTHROPIC_API_KEY to the .env file in the project root and restart the API server.',
        };
  } catch {
    return { state: 'unavailable', message: UNAVAILABLE.message };
  }
}

/** POST JSON to a structured AI route → { ok: true, data, model } */
async function postAI(path, payload, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/ai/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    return isAbort(error) ? ABORTED : UNAVAILABLE;
  }
  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (isAbort(error)) return ABORTED;
    return UNAVAILABLE;
  }
  if (!response.ok) return failure(body);
  if (!body?.data) return { ok: false, kind: 'error', code: 'empty_response', message: 'Claude returned an empty response. Please try again.' };
  return { ok: true, data: body.data, model: body.model };
}

export const reviewCode = (payload, signal) => postAI('review', payload, signal);
export const analyzeComplexity = (payload, signal) => postAI('complexity', payload, signal);
export const generateQuestions = (payload, signal) => postAI('questions', payload, signal);
export const buildRoadmap = (payload, signal) => postAI('roadmap', payload, signal);

/**
 * Stream a tutor reply. `onDelta(text)` is called for each chunk as Claude
 * writes it. Resolves to { ok: true, text, truncated, model } when finished.
 */
export async function streamTutor({ messages, language, context }, { onDelta, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/ai/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...(await authHeaders()) },
      body: JSON.stringify({ messages, language, context }),
      signal,
    });
  } catch (error) {
    return isAbort(error) ? ABORTED : UNAVAILABLE;
  }

  if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
    return failure(await readJson(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let model = null;
  let finished = null;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = 'message';
        let data = '';
        for (const line of rawEvent.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        let payload = {};
        try {
          payload = data ? JSON.parse(data) : {};
        } catch {
          continue;
        }
        if (event === 'start') model = payload.model;
        else if (event === 'delta' && typeof payload.text === 'string') {
          text += payload.text;
          onDelta?.(payload.text, text);
        } else if (event === 'done') finished = payload;
        else if (event === 'error') return { ...failure(payload), partialText: text };
      }
    }
  } catch (error) {
    if (isAbort(error)) return { ...ABORTED, partialText: text };
    return { ok: false, kind: 'error', message: 'The connection was interrupted while Claude was answering. Please try again.', partialText: text };
  }

  if (!finished) {
    return { ok: false, kind: 'error', message: 'The answer stopped unexpectedly. Please try again.', partialText: text };
  }
  if (!text.trim()) return { ok: false, kind: 'error', message: 'Claude returned an empty response. Please try again.' };
  return { ok: true, text, truncated: Boolean(finished.truncated), model };
}
