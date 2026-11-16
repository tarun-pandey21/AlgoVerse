/**
 * Express application (exported separately from index.js so tests can mount it).
 *
 *   /api/health        → { ok: true }
 *   /api/execution/*   → Judge0 code execution     (routes/execution.js)
 *   /api/ai/*          → Claude AI features        (routes/ai.js)
 *   /api/account/*     → signed-in user's account  (routes/account.js, Supabase)
 *   everything else    → the built React app in dist/ (SPA fallback)
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import { PROJECT_ROOT, config } from './config.js';
import executionRoutes from './routes/execution.js';
import aiRoutes from './routes/ai.js';
import accountRoutes from './routes/account.js';
import { authenticate } from './middleware/auth.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { requestLogger } from './middleware/requestLogger.js';

const DIST = path.join(PROJECT_ROOT, 'dist');

/** Compress responses except Server-Sent Events (the AI Tutor stream must not be buffered). */
function shouldCompress(req, res) {
  if (String(res.getHeader('Content-Type') ?? '').includes('text/event-stream')) return false;
  return compression.filter(req, res);
}

/** Long-lived caching for content-hashed build files; revalidate everything else. */
function setStaticCacheHeaders(res, filePath) {
  const rel = path.relative(DIST, filePath).split(path.sep).join('/');
  if (rel.startsWith('assets/')) res.set('Cache-Control', 'public, max-age=31536000, immutable');
  else if (rel === 'index.html') res.set('Cache-Control', 'no-cache');
  else res.set('Cache-Control', 'public, max-age=3600');
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) {
    const value = config.trustProxy;
    app.set('trust proxy', value === 'true' ? true : /^\d+$/.test(value) ? Number(value) : value);
  }

  app.use(requestLogger());
  app.use(securityHeaders());
  app.use(compression({ filter: shouldCompress }));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    if (config.allowedOrigin) {
      res.set({
        'Access-Control-Allow-Origin': config.allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  // Verify a Supabase access token if one is sent (sets req.user).
  app.use('/api', authenticate);
  app.use('/api/account', accountRoutes);
  app.use('/api/execution', executionRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found', message: 'Unknown API route.' }));

  // Production build (npm run build) with SPA fallback.
  if (fs.existsSync(DIST)) {
    app.use(express.static(DIST, { index: false, setHeaders: setStaticCacheHeaders }));
    // A missing file (an old build's chunk, a typo'd asset) is a real 404, never
    // the HTML page: returning HTML for a .js request breaks the app silently.
    app.use((req, res, next) => {
      if (req.path.startsWith('/assets/') || path.extname(req.path)) {
        res.set('Cache-Control', 'no-store');
        return res.status(404).type('text/plain').send('Not found');
      }
      return next();
    });
    app.get('/{*path}', (req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(DIST, 'index.html'));
    });
  } else {
    app.use((req, res) =>
      res.status(404).json({ error: 'not_found', message: 'Not found. (Run `npm run build` to serve the app from this server.)' }),
    );
  }

  // Last-resort error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error(`[server] ${req.method} ${req.path} failed:`, error?.stack ?? error);
    if (!res.headersSent) res.status(500).json({ error: 'server_error', message: 'Unexpected server error.' });
  });

  return app;
}
