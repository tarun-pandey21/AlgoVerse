/**
 * Tiny in-memory sliding-window rate limiter (per signed-in user, else per IP).
 * Good enough for a single server process; use a shared store (e.g. Redis)
 * if you run several instances.
 */
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map();

  // Drop stale entries now and then so memory stays bounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits) {
      const recent = times.filter((t) => now - t < windowMs);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return function rateLimitMiddleware(req, res, next) {
    // Signed-in users are limited per account; everyone else per IP.
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      const retryAfter = Math.ceil((windowMs - (now - recent[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'rate_limited', message, retryAfterSeconds: retryAfter });
    }
    recent.push(now);
    hits.set(key, recent);
    res.set('RateLimit-Remaining', String(max - recent.length));
    return next();
  };
}
