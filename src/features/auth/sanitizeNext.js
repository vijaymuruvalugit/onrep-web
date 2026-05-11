/**
 * sanitizeNext — defend the `next=` redirect parameter on subscription routes.
 *
 * The paywall flow accepts a `next` query param so the user resumes where they
 * were going after activating their subscription. That parameter MUST NEVER be
 * trusted blindly — it lives in a URL the user can craft. Sanitization runs at
 * both boundaries (producers: guard / 403 interceptor encode it; consumers:
 * paywall / processing page decode it).
 *
 * Allowed:
 *   - starts with `/` (no `//`, no scheme, no backslash)
 *   - does NOT start with `/subscription/` or `/auth/` (prevents recursion)
 *   - ≤ 256 chars
 *
 * Rejected → `null`. Callers fall back to `/coach/dashboard`.
 */

export const DEFAULT_NEXT = '/coach/dashboard'

const FORBIDDEN_PREFIXES = ['/subscription/', '/subscription?', '/subscription#', '/auth/']

export function sanitizeNext(rawValue) {
  if (rawValue == null) return null
  const s = String(rawValue).trim()
  if (!s) return null
  if (s.length > 256) return null
  if (!s.startsWith('/')) return null
  if (s.startsWith('//')) return null
  if (s.includes('\\')) return null
  if (s === '/subscription' || s === '/auth') return null
  if (FORBIDDEN_PREFIXES.some((p) => s.startsWith(p))) return null
  if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(s)) return null
  return s
}

/** Convenience: sanitize and return a safe path, never null. */
export function safeNextOrDefault(rawValue) {
  return sanitizeNext(rawValue) || DEFAULT_NEXT
}
