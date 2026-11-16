/**
 * Validate a post-sign-in redirect target ("?next=…").
 *
 * Only same-origin, absolute paths are allowed. Rejected (→ fallback):
 *   - anything not starting with a single "/" ("//evil.com", "https://…")
 *   - backslashes ("/\evil.com" – browsers treat "\" like "/")
 *   - control characters and whitespace (tabs/newlines are stripped by URL parsers)
 *   - anything that resolves to a different origin
 * Returns "/path?query#hash" or the fallback.
 */
export function safeNextPath(raw, fallback = '/') {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f\s]/.test(raw)) return fallback;
  try {
    const base = window.location.origin;
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith('//') ? fallback : path;
  } catch {
    return fallback;
  }
}
