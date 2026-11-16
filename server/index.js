/**
 * AlgoVerse API server (Node 18+, Express).
 *
 * - Code execution is forwarded to Judge0 – this server never runs user code.
 * - AI features call Claude through the official Anthropic SDK. The API key
 *   stays on this server; the browser only ever talks to /api/*.
 * - If a production build exists in dist/, it is served too, so
 *   `npm run build && npm start` runs the whole app from one process.
 *
 * `npm start` runs in production mode (--production): sign-in is required for
 * AI and code execution, the server listens on all interfaces, and API
 * requests are logged. `npm run server` / `npm run dev:full` are development.
 */
import { config, isExecutionConfigured, isAIConfigured, isAuthConfigured, isDatabaseAdminConfigured } from './config.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  const execution = isExecutionConfigured() ? `Judge0 at ${config.judge0.url}` : 'NOT CONFIGURED (set JUDGE0_URL in .env)';
  const ai = isAIConfigured() ? `Claude (${config.anthropic.model})` : 'NOT CONFIGURED (set ANTHROPIC_API_KEY in .env)';
  const auth = isAuthConfigured() ? `Supabase${isDatabaseAdminConfigured() ? '' : ' (no SUPABASE_SECRET_KEY: submissions are not saved)'}` : 'not configured';
  console.log(`AlgoVerse API (${config.isProduction ? 'production' : 'development'}) listening on http://${config.host}:${config.port}`);
  console.log(`Code execution: ${execution}${config.executionRequireAuth ? ' · sign-in required' : ''}`);
  console.log(`AI features:    ${ai}${config.aiRequireAuth ? ' · sign-in required' : ''}`);
  console.log(`Accounts:       ${auth}${config.trustProxy ? ` · TRUST_PROXY=${config.trustProxy}` : ''}`);
  if ((config.aiRequireAuth || config.executionRequireAuth) && !isAuthConfigured()) {
    console.warn(
      'WARNING: sign-in is required for AI/code execution, but Supabase is not configured, so those features will refuse every request. ' +
        'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or set AI_REQUIRE_AUTH=false / EXECUTION_REQUIRE_AUTH=false.',
    );
  }
});

/* ---------------- graceful shutdown & crash logging ---------------- */

let shuttingDown = false;

function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received: finishing in-flight requests (up to ${config.server.shutdownTimeoutMs} ms)…`);
  // Stop accepting new connections; let running requests (e.g. code being judged) finish.
  server.close(() => {
    console.log('[server] closed cleanly');
    process.exit(exitCode);
  });
  server.closeIdleConnections?.();
  setTimeout(() => {
    console.warn('[server] shutdown timeout reached: closing remaining connections');
    server.closeAllConnections?.();
    process.exit(exitCode);
  }, config.server.shutdownTimeoutMs).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  // Log and keep serving: one failed background promise shouldn't take the site down.
  console.error('[server] unhandled promise rejection:', reason?.stack ?? reason);
});

process.on('uncaughtException', (error) => {
  // State may be corrupted: log, stop gracefully, and let the process manager restart us.
  console.error('[server] uncaught exception:', error?.stack ?? error);
  shutdown('uncaughtException', 1);
});

export default server;
