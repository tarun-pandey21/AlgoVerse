/**
 * Anthropic client (official @anthropic-ai/sdk) + error mapping.
 *
 * The API key is read from server config only. It is never returned in a
 * response, never logged, and never reaches the browser.
 */
import Anthropic from '@anthropic-ai/sdk';
import { config, isAIConfigured } from '../config.js';

let client = null;

/** Lazily create one shared SDK client. Returns null when no key is set. */
export function getClient() {
  if (!isAIConfigured()) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      ...(config.anthropic.baseURL ? { baseURL: config.anthropic.baseURL } : {}),
      timeout: config.anthropic.timeoutMs,
      maxRetries: config.anthropic.maxRetries,
    });
  }
  return client;
}

export const model = () => config.anthropic.model;

/** An error with an HTTP status and a stable code the frontend can switch on. */
export class AIError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notConfiguredError = () =>
  new AIError(
    503,
    'not_configured',
    'AI features are not configured. Add ANTHROPIC_API_KEY to the .env file in the project root and restart the API server.',
  );

/** The message Anthropic returned, if any (never contains the key). */
function upstreamMessage(error) {
  const body = error?.error;
  return body?.error?.message || body?.message || '';
}

/** Translate any SDK error into an AIError with a clear, actionable message. */
export function mapAnthropicError(error) {
  if (error instanceof AIError) return error;
  const detail = upstreamMessage(error);

  if (error instanceof Anthropic.APIUserAbortError) {
    return new AIError(499, 'aborted', 'The request was cancelled.');
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new AIError(502, 'auth_failed', 'The Anthropic API rejected the API key. Check ANTHROPIC_API_KEY in .env and restart the API server.');
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new AIError(502, 'permission_denied', `The API key does not have access to this request${detail ? `: ${detail}` : '.'}`);
  }
  if (error instanceof Anthropic.NotFoundError) {
    return new AIError(
      502,
      'model_not_found',
      `The model "${config.anthropic.model}" was not found. Check ANTHROPIC_MODEL in .env${detail ? ` (${detail})` : ''}.`,
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIError(429, 'upstream_rate_limited', 'The Claude API rate limit was reached. Please wait a minute and try again.');
  }
  if (error instanceof Anthropic.BadRequestError) {
    // e.g. low credit balance, prompt too long. Anthropic's message is safe to show.
    return new AIError(502, 'bad_request_upstream', detail || 'The Claude API rejected the request.');
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AIError(504, 'timeout', 'The Claude API took too long to respond. Please try again.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AIError(502, 'upstream_unreachable', 'Could not reach the Claude API. Check the server’s internet connection.');
  }
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 0;
    if (status === 529 || status === 503 || detail.toLowerCase().includes('overloaded')) {
      return new AIError(503, 'overloaded', 'Claude is temporarily overloaded. Please try again in a moment.');
    }
    if (status >= 500) {
      return new AIError(502, 'upstream_error', 'The Claude API returned a server error. Please try again.');
    }
    return new AIError(502, 'upstream_error', detail || `The Claude API returned an error (${status}).`);
  }
  console.error('[ai] unexpected error:', error?.message ?? error);
  return new AIError(500, 'server_error', 'Unexpected server error while contacting the Claude API.');
}

/** Concatenate the text blocks of a Messages API response. */
export function textOf(message) {
  return (message?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/* -------------------------------------------------------------------------
 * Structured responses (Code Reviewer, Complexity Analyzer, Question
 * Generator, Roadmap).
 *
 * Newer models (Claude Sonnet 5.5, Opus 5.5, Fable/Mythos 5.1+) reject forced
 * tool use: tool_choice {type: "tool"} or {type: "any"} returns
 *   400 "tool_choice: type "tool" and "any" are not supported for this model."
 * so we no longer use tools here at all. Instead:
 *
 *  1. "json_schema" mode – Anthropic's structured outputs:
 *     output_config.format = { type: "json_schema", schema }. Claude's reply
 *     is a text block containing JSON that matches the schema.
 *  2. "prompt" mode – fallback for models without structured outputs: the
 *     schema goes in the system prompt and the JSON is extracted from text.
 *
 * In both modes the result is parsed and validated against the schema before
 * it is returned; a malformed answer is retried once, then reported as an
 * error. Nothing is ever filled in or invented.
 * ---------------------------------------------------------------------- */

import { strictSchema, validate, extractJson } from './schema.js';

/** Models that rejected output_config.format in this process (→ prompt mode). */
const noStructuredOutputs = new Set();

function structuredMode() {
  const forced = config.anthropic.structuredMode;
  if (forced === 'json_schema' || forced === 'prompt') return forced;
  return noStructuredOutputs.has(model()) ? 'prompt' : 'json_schema';
}

/** A 400 that says the model/request doesn't accept output_config.format. */
function isStructuredOutputUnsupported(error) {
  if (!(error instanceof Anthropic.BadRequestError)) return false;
  const detail = upstreamMessage(error).toLowerCase();
  return /output_config|output_format|json_schema|structured output/.test(detail);
}

function promptModeSystem(system, schema) {
  return `${system}

Respond with ONLY a single JSON object (no Markdown fences, no text before or after it) that matches this JSON Schema exactly. Include every property listed in "required".
<json_schema>
${JSON.stringify(schema)}
</json_schema>`;
}

async function requestOnce({ anthropic, mode, system, prompt, schema, maxTokens, signal }) {
  const params = {
    model: model(),
    max_tokens: maxTokens,
    system: mode === 'prompt' ? promptModeSystem(system, schema) : system,
    messages: [{ role: 'user', content: prompt }],
    ...(mode === 'json_schema' ? { output_config: { format: { type: 'json_schema', schema } } } : {}),
  };
  // Streamed so long answers (and the model's default thinking) never hit an
  // HTTP idle timeout; we only use the final message.
  return anthropic.messages.stream(params, { signal, timeout: config.anthropic.structuredTimeoutMs }).finalMessage();
}

export async function callStructured({ system, prompt, format, maxTokens = 4096, signal }) {
  const anthropic = getClient();
  if (!anthropic) throw notConfiguredError();

  const schema = strictSchema(format.schema);
  // Models that think by default spend output tokens on thinking first, so
  // leave headroom above the answer's own budget.
  const budget = Math.min(maxTokens + config.anthropic.thinkingHeadroomTokens, 32000);
  let lastProblem = '';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let mode = structuredMode();
    let message;
    try {
      message = await requestOnce({ anthropic, mode, system, prompt, schema, maxTokens: budget, signal });
    } catch (error) {
      if (mode === 'json_schema' && config.anthropic.structuredMode !== 'json_schema' && isStructuredOutputUnsupported(error)) {
        console.warn(`[ai] ${model()} rejected output_config.format (${upstreamMessage(error)}); using JSON-in-prompt mode.`);
        noStructuredOutputs.add(model());
        mode = 'prompt';
        try {
          message = await requestOnce({ anthropic, mode, system, prompt, schema, maxTokens: budget, signal });
        } catch (retryError) {
          throw mapAnthropicError(retryError);
        }
      } else {
        throw mapAnthropicError(error);
      }
    }

    if (message.stop_reason === 'refusal') {
      throw new AIError(422, 'refused', 'Claude declined to answer this request.');
    }
    if (message.stop_reason === 'max_tokens') {
      throw new AIError(502, 'truncated', 'Claude’s answer was cut off because it was too long. Try a smaller request (fewer questions or weeks).');
    }

    const text = textOf(message);
    if (!text) {
      lastProblem = 'empty';
      continue;
    }
    const data = mode === 'json_schema' ? safeParse(text) ?? extractJson(text) : extractJson(text);
    if (data === undefined || typeof data !== 'object' || data === null || Array.isArray(data)) {
      lastProblem = 'Claude’s reply was not valid JSON';
      console.warn(`[ai] ${format.name}: unparseable reply (attempt ${attempt}, ${mode} mode)`);
      continue;
    }
    const problems = validate(data, schema);
    if (problems.length) {
      lastProblem = problems.slice(0, 3).join('; ');
      console.warn(`[ai] ${format.name}: reply failed validation (attempt ${attempt}, ${mode} mode): ${lastProblem}`);
      continue;
    }
    return { data, model: message.model, usage: message.usage, mode };
  }

  if (lastProblem === 'empty') {
    throw new AIError(502, 'empty_response', 'Claude returned an empty response. Please try again.');
  }
  throw new AIError(502, 'invalid_response', `Claude’s answer didn’t have the expected structure (${lastProblem}). Please try again.`);
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
