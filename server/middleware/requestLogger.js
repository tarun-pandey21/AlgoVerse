/**
 * One line per API request: time, method, path (no query string), status,
 * duration and whether the caller was signed in. Never logs bodies, headers,
 * tokens or code. On by default in production (LOG_REQUESTS).
 */
import { config } from '../config.js';

export function requestLogger() {
  if (!config.server.logRequests) return (req, res, next) => next();
  return (req, res, next) => {
    if (!req.path.startsWith('/api/')) return next();
    const started = process.hrtime.bigint();
    const path = req.originalUrl.split('?')[0]; // routers rewrite req.path; capture it now
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const who = req.user ? 'user' : 'anon';
      console.log(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${ms.toFixed(0)}ms ${who}`);
    });
    return next();
  };
}
