/**
 * Server configuration from environment variables.
 * A `.env` file in the project root is loaded automatically (see .env.example);
 * variables already set in the environment take precedence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      // Unquoted values: drop an inline " # comment" (same rule as dotenv/Vite).
      value = value.replace(/\s+#.*$/, '').trim();
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv(path.join(PROJECT_ROOT, '.env'));

const env = process.env;
const int = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' ? Number(value) : fallback);

/**
 * Production mode: `npm start` (passes --production) or NODE_ENV=production.
 * Development (`npm run server`, `npm run dev:full`) keeps localhost-friendly
 * defaults.
 */
export const isProduction = process.argv.includes('--production') || env.NODE_ENV === 'production';

/** true/false from "true"/"false"/"1"/"0"/"yes"/"no"; fallback when unset. */
const bool = (value, fallback) => {
  if (value === undefined || String(value).trim() === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
};

export const config = {
  port: int(env.PORT, 8787),
  // Development listens on localhost only; production on all interfaces so
  // containers / hosting platforms can reach it. Override with HOST.
  host: env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'),
  isProduction,
  allowedOrigin: env.ALLOWED_ORIGIN || '',

  judge0: {
    url: (env.JUDGE0_URL || '').replace(/\/+$/, ''),
    authToken: env.JUDGE0_AUTH_TOKEN || '',
    rapidApiKey: env.JUDGE0_RAPIDAPI_KEY || '',
    rapidApiHost: env.JUDGE0_RAPIDAPI_HOST || '',
    // Default language ids (Judge0 CE list, also accepted by OnlineCompiler.io):
    // Java 62, C++ 54, Python 71. Verify yours with `npm run judge0:check`.
    // Transfer encoding: auto (plain text for OnlineCompiler.io, base64 otherwise); JUDGE0_BASE64=true|false overrides.
    base64: env.JUDGE0_BASE64 === undefined || String(env.JUDGE0_BASE64).trim() === '' ? null : /^(1|true|yes|on)$/i.test(env.JUDGE0_BASE64),
    // Retries for 429 (rate / pending limit) and 503 (queue unavailable) answers.
    retries: Math.max(0, int(env.JUDGE0_RETRIES, 2)),
    languageIds: {
      java: int(env.JUDGE0_LANGUAGE_JAVA, 62),
      cpp: int(env.JUDGE0_LANGUAGE_CPP, 54),
      python: int(env.JUDGE0_LANGUAGE_PYTHON, 71),
    },
    cpuTimeLimit: int(env.JUDGE0_CPU_TIME_LIMIT, 2), // seconds per test
    wallTimeLimit: int(env.JUDGE0_WALL_TIME_LIMIT, 5), // seconds per test
    memoryLimitKb: int(env.JUDGE0_MEMORY_LIMIT_KB, 256000),
    concurrency: Math.max(1, int(env.JUDGE0_CONCURRENCY, 3)),
    requestTimeoutMs: int(env.JUDGE0_REQUEST_TIMEOUT_MS, 30000),
  },

  anthropic: {
    // Read ONLY on the server. Never sent to the browser or logged.
    apiKey: (env.ANTHROPIC_API_KEY || '').trim(),
    model: (env.ANTHROPIC_MODEL || 'claude-sonnet-5-5').trim(),
    // Optional: leave empty to use the SDK default (https://api.anthropic.com).
    baseURL: (env.ANTHROPIC_BASE_URL || '').trim(),
    timeoutMs: int(env.ANTHROPIC_TIMEOUT_MS, 90_000),
    maxRetries: int(env.ANTHROPIC_MAX_RETRIES, 2),
    // Structured features: 'auto' (structured outputs, falling back to JSON in
    // the prompt if the model rejects them), 'json_schema' or 'prompt'.
    structuredMode: (env.ANTHROPIC_STRUCTURED_MODE || 'auto').trim(),
    structuredTimeoutMs: int(env.ANTHROPIC_STRUCTURED_TIMEOUT_MS, 240_000),
    // Extra output tokens for models that think before answering (e.g. Sonnet 5.5).
    thinkingHeadroomTokens: int(env.ANTHROPIC_THINKING_HEADROOM_TOKENS, 8000),
  },

  ai: {
    rateLimitMax: int(env.AI_RATE_LIMIT_MAX, 20), // AI requests per client...
    rateLimitWindowMs: int(env.AI_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000), // ...per 5 minutes
    maxMessageChars: int(env.AI_MAX_MESSAGE_CHARS, 6000), // one tutor message
    maxConversationChars: int(env.AI_MAX_CONVERSATION_CHARS, 40_000), // whole history sent per turn
    maxMessages: int(env.AI_MAX_MESSAGES, 30), // history turns kept per request
    maxCodeChars: int(env.AI_MAX_CODE_CHARS, 20_000), // code sent for review/analysis
  },

  supabase: {
    url: (env.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
    // Publishable (or legacy anon) key: used to verify user tokens and to make
    // RLS-scoped requests on behalf of a signed-in user.
    publishableKey: (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '').trim(),
    // Secret (or legacy service_role) key: bypasses RLS. SERVER ONLY.
    secretKey: (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  },

  // Require a signed-in Supabase user for Claude-backed routes / code
  // execution. Default: ON in production, OFF in development.
  aiRequireAuth: bool(env.AI_REQUIRE_AUTH, isProduction),
  executionRequireAuth: bool(env.EXECUTION_REQUIRE_AUTH, isProduction),


  // Set when running behind a reverse proxy / load balancer (see README):
  // e.g. TRUST_PROXY=1 (one proxy hop). Leave empty when clients connect directly.
  trustProxy: env.TRUST_PROXY || '',

  server: {
    shutdownTimeoutMs: int(env.SHUTDOWN_TIMEOUT_MS, 10_000),
    // One log line per API request (method, path, status, duration – never bodies or headers).
    logRequests: bool(env.LOG_REQUESTS, isProduction),
    // Extra origins the browser may connect to (space-separated), added to the CSP connect-src.
    cspConnectSrc: (env.CSP_CONNECT_SRC || '').split(/\s+/).filter(Boolean),
  },

  account: {
    rateLimitMax: int(env.ACCOUNT_RATE_LIMIT_MAX, 60),
    rateLimitWindowMs: int(env.ACCOUNT_RATE_LIMIT_WINDOW_MS, 60_000),
  },

  limits: {
    maxCodeBytes: int(env.MAX_CODE_BYTES, 64 * 1024),
    rateLimitWindowMs: int(env.RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
    rateLimitMax: int(env.RATE_LIMIT_MAX, 40),
  },
};

/** Sign-in can be verified once the project URL and publishable key are set. */
export function isAuthConfigured() {
  return Boolean(config.supabase.url && config.supabase.publishableKey);
}

/** Trusted server-side writes need the secret key as well. */
export function isDatabaseAdminConfigured() {
  return isAuthConfigured() && Boolean(config.supabase.secretKey);
}

/** AI features are configured once an Anthropic API key is set. */
export function isAIConfigured() {
  return Boolean(config.anthropic.apiKey);
}

/** Execution is configured once a Judge0 URL is set. */
export function isExecutionConfigured() {
  return Boolean(config.judge0.url);
}
