/**
 * Security headers for everything the Express server sends.
 *
 * Content-Security-Policy for the app (HTML):
 *   - scripts only from this origin (the Vite build has no inline scripts)
 *   - styles from this origin + Google Fonts CSS ('unsafe-inline' is needed
 *     for React `style={…}` attributes)
 *   - fonts from Google Fonts
 *   - network requests (fetch/WebSocket) to this origin + the Supabase project
 *     (SUPABASE_URL / VITE_SUPABASE_URL) + any CSP_CONNECT_SRC extras
 *   - no framing (clickjacking), no plugins, no <base> tricks
 * API responses get a deny-everything CSP.
 *
 * Strict-Transport-Security is sent only for HTTPS requests (directly or via
 * a trusted proxy's X-Forwarded-Proto), so http://localhost keeps working.
 *
 * The Vite dev server (npm run dev) does not use this middleware, so local
 * development is unaffected.
 */
import { config } from '../config.js';

function origins(url) {
  try {
    const u = new URL(url);
    const ws = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return [u.origin, `${ws}//${u.host}`];
  } catch {
    return [];
  }
}

export function buildAppCsp() {
  const supabase = [config.supabase.url, process.env.VITE_SUPABASE_URL].filter(Boolean).flatMap(origins);
  const connect = [...new Set(["'self'", ...supabase, ...config.server.cspConnectSrc])];
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connect.join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const API_CSP = "default-src 'none'; frame-ancestors 'none'";

export function securityHeaders() {
  const appCsp = buildAppCsp();
  return (req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Content-Security-Policy': req.path.startsWith('/api/') ? API_CSP : appCsp,
    });
    if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  };
}
