/**
 * Judge0-compatible API client (https://judge0.com). Works with:
 *
 *   - OnlineCompiler.io's Judge0-compatible API
 *       JUDGE0_URL=https://api.onlinecompiler.io/api/judge0
 *       JUDGE0_AUTH_TOKEN=<your OnlineCompiler.io API key>   (sent as X-Auth-Token)
 *   - a self-hosted Judge0 CE instance (optional X-Auth-Token)
 *   - Judge0 CE on RapidAPI (X-RapidAPI-Key / X-RapidAPI-Host)
 *
 * Code is never executed by this server: it is sent to the execution service,
 * which runs it in its own sandbox. API keys are only ever sent to
 * JUDGE0_URL, never to the browser, and never logged.
 */
import { config } from './config.js';

const FIELDS = 'token,stdout,stderr,compile_output,message,status,time,memory';
const b64 = (text) => Buffer.from(text ?? '', 'utf8').toString('base64');
const unb64 = (text) => (text ? Buffer.from(text, 'base64').toString('utf8') : '');

export class Judge0Error extends Error {
  constructor(message, { status = 502 } = {}) {
    super(message);
    this.httpStatus = status;
  }
}

/* ------------------------------------------------------------ provider */

/** Which service JUDGE0_URL points to (used for labels and encoding). */
export function provider() {
  let host = '';
  try {
    host = new URL(config.judge0.url).hostname.toLowerCase();
  } catch {
    /* not configured */
  }
  if (host === 'onlinecompiler.io' || host.endsWith('.onlinecompiler.io')) return { id: 'onlinecompiler', label: 'OnlineCompiler.io' };
  if (host.endsWith('rapidapi.com')) return { id: 'rapidapi', label: 'Judge0 (RapidAPI)' };
  return { id: 'judge0', label: 'Judge0' };
}

/**
 * Base64 transfer encoding. OnlineCompiler.io's documented examples send and
 * receive plain text, so that is the default there; standard Judge0 uses
 * base64 (safe for any output bytes). Override with JUDGE0_BASE64=true|false.
 */
function useBase64() {
  if (config.judge0.base64 !== null) return config.judge0.base64;
  return provider().id !== 'onlinecompiler';
}

function headers() {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const { authToken, rapidApiKey, rapidApiHost } = config.judge0;
  if (authToken) h['X-Auth-Token'] = authToken;
  if (provider().id !== 'onlinecompiler') {
    if (rapidApiKey) h['X-RapidAPI-Key'] = rapidApiKey;
    if (rapidApiHost) h['X-RapidAPI-Host'] = rapidApiHost;
  }
  return h;
}

/* ------------------------------------------------------------ HTTP */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The service's own error text ({"error": "..."} or Judge0 field errors), trimmed. */
function upstreamDetail(body, status) {
  const raw = body?.error || body?.message || (body && typeof body === 'object' ? Object.values(body).flat().join(' ') : '') || `HTTP ${status}`;
  return String(raw).replace(/\s+/g, ' ').trim().slice(0, 200);
}

async function requestOnce(path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.judge0.requestTimeoutMs);
  try {
    const response = await fetch(`${config.judge0.url}${path}`, { ...options, headers: headers(), signal: controller.signal });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON error page */
    }
    return { response, body };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : 'could not be reached';
    // Log the internal address server-side only; never send it to the browser.
    console.error(`[judge0] ${config.judge0.url} ${reason}`);
    throw new Judge0Error(
      reason === 'timed out'
        ? 'The code execution service took too long to respond. Please try again.'
        : 'The code execution service could not be reached. Please try again in a moment.',
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One API call with clear errors. 429 (rate/pending limit) and 503 (queue
 * unavailable) are retried twice with backoff before giving up.
 */
async function request(path, options = {}) {
  const service = provider().label;
  for (let attempt = 0; ; attempt += 1) {
    const { response, body } = await requestOnce(path, options);
    const { status } = response;

    if ((status === 429 || status === 503) && attempt < config.judge0.retries) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5000) : 800 * 2 ** attempt;
      console.warn(`[judge0] ${service} answered ${status}; retrying in ${wait} ms`);
      await sleep(wait);
      continue;
    }
    if (status === 401 || status === 403) {
      console.error(`[judge0] ${service} rejected the credentials (HTTP ${status})`);
      throw new Judge0Error(
        provider().id === 'onlinecompiler'
          ? 'OnlineCompiler.io rejected the API key. Check JUDGE0_AUTH_TOKEN in .env on the server and restart it.'
          : 'The code execution service rejected the request. Check JUDGE0_AUTH_TOKEN or the RapidAPI key/host on the server.',
      );
    }
    if (status === 429) {
      const detail = upstreamDetail(body, status);
      console.warn(`[judge0] ${service} limit reached: ${detail}`);
      throw new Judge0Error(`The code execution service's usage limit was reached (${detail}). Please wait and try again.`, { status: 429 });
    }
    if (status === 503) {
      console.error(`[judge0] ${service} unavailable: ${upstreamDetail(body, status)}`);
      throw new Judge0Error('The code execution service is temporarily unavailable. Please try again in a moment.', { status: 503 });
    }
    if (status === 422) {
      const detail = upstreamDetail(body, status);
      console.error(`[judge0] ${service} refused the submission (422): ${detail}`);
      throw new Judge0Error(`The code execution service refused this submission: ${detail}`);
    }
    if (!response.ok) {
      const detail = upstreamDetail(body, status);
      console.error(`[judge0] ${service} error ${status}: ${detail}`);
      throw new Judge0Error(status >= 500 ? 'The code execution service had an internal error. Please try again.' : `The code execution service returned an error: ${detail}`);
    }
    return body;
  }
}

/* ------------------------------------------------------------ results */

/**
 * Some services (e.g. OnlineCompiler.io for certain languages) report a
 * compilation failure as "Runtime Error (NZEC)" with the compiler's message
 * in stderr instead of compile_output. Recognise the compilers' own error
 * formats so the learner still sees "Compilation Error".
 */
const COMPILER_ERROR = {
  java: /(^|\n)\S*\.java:\d+: error: |(^|\n)error: (compilation failed|class \w+ is public)/,
  cpp: /(^|\n)\S*\.(cpp|cc|cxx|c\+\+|hpp|h):\d+(:\d+)?: (fatal )?error: |undefined reference to [`']|collect2: error: ld returned/,
};

export function normalizeCompileError(language, result) {
  const pattern = COMPILER_ERROR[language];
  const isRuntimeError = result.statusId >= 7 && result.statusId <= 12;
  if (pattern && isRuntimeError && !result.compileOutput && !result.stdout.trim() && pattern.test(result.stderr)) {
    return { ...result, statusId: 6, statusDescription: 'Compilation Error', compileOutput: result.stderr, stderr: '' };
  }
  return result;
}

function decode(submission, base64) {
  const text = base64 ? unb64 : (value) => value ?? '';
  return {
    statusId: submission.status?.id ?? 13,
    statusDescription: submission.status?.description ?? 'Unknown',
    stdout: text(submission.stdout),
    stderr: text(submission.stderr),
    compileOutput: text(submission.compile_output),
    message: text(submission.message),
    time: submission.time != null ? Number(submission.time) : null,
    memory: submission.memory ?? null,
  };
}

/**
 * Runs one program with one stdin and returns the result.
 * Uses wait=true, and falls back to polling if the service returns early.
 */
export async function executeOnce({ language, sourceCode, stdin }) {
  const languageId = config.judge0.languageIds[language];
  if (!languageId) throw new Judge0Error(`No Judge0 language id configured for ${language}.`, { status: 500 });
  const base64 = useBase64();
  const encode = base64 ? b64 : (value) => value ?? '';

  const created = await request(`/submissions?base64_encoded=${base64}&wait=true&fields=${FIELDS}`, {
    method: 'POST',
    body: JSON.stringify({
      source_code: encode(sourceCode),
      language_id: languageId,
      stdin: encode(stdin),
      cpu_time_limit: config.judge0.cpuTimeLimit,
      wall_time_limit: config.judge0.wallTimeLimit,
      memory_limit: config.judge0.memoryLimitKb,
    }),
  });

  let submission = created;
  const deadline = Date.now() + config.judge0.requestTimeoutMs;
  // Status 1 = In Queue, 2 = Processing
  while ((!submission?.status || submission.status.id <= 2) && created?.token) {
    if (Date.now() > deadline) throw new Judge0Error('Timed out waiting for the code execution service to finish running the code.');
    await sleep(600);
    submission = await request(`/submissions/${encodeURIComponent(created.token)}?base64_encoded=${base64}&fields=${FIELDS}`);
  }
  if (!submission?.status) throw new Judge0Error('The code execution service returned an unexpected response.');
  return normalizeCompileError(language, decode(submission, base64));
}
