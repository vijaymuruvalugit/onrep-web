/**
 * Central API classification registry for workspace behavior.
 * Keep this explicit to prevent silent academy-wide leaks.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const API_CLASSIFICATION = Object.freeze({
  bootstrap: Object.freeze(['/auth/', '/activities']),
  global: Object.freeze([
    '/onboarding/',
    '/subscription/',
    '/billing/',
    '/payments',
    '/parent/',
    '/family/',
    '/devices/',
    '/reconciliation/',
    '/academy/',
    '/coaches',
    '/dashboard/owner-',
    '/dashboard/summary',
    '/invites',
    '/parents/overview',
    '/ops/',
    '/events',
  ]),
  // Transitional explicit exemptions: keep academy-global until contract migration completes.
  exempt: Object.freeze(['/students', '/student-import', '/batches']),
  scoped: Object.freeze([
    '/dashboard/coach-summary',
    '/dashboard/today',
    '/batch-schedules',
    '/operational-sessions',
    '/recurring-patterns',
    '/places',
    '/skating',
    '/sessions',
    '/attendance-percent',
    '/participation-summary',
    '/observations',
    '/coaching-priority',
    '/follow-ups',
    '/progress-cards',
    '/sub-activities',
  ]),
})

function pathHasPrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname.includes(prefix))
}

function isStudentImportExempt(pathname) {
  return pathname === '/student-import' || pathname.startsWith('/student-import/')
}

function isStudentsExempt(pathname) {
  if (isStudentImportExempt(pathname)) return true
  if (pathname === '/students' || pathname.startsWith('/students?')) return true
  if (!pathname.startsWith('/students/')) return false

  const afterId = pathname.slice('/students/'.length)
  const slash = afterId.indexOf('/')
  if (slash === -1) return true

  const nested = afterId.slice(slash + 1)
  // Profile-adjacent academy-global reads/writes. Operational nested routes need x-activity-id.
  return (
    nested === 'parents' ||
    nested.startsWith('parents/') ||
    nested === 'login-status' ||
    nested === 'enable-login' ||
    nested.startsWith('enable-login')
  )
}

function isBatchesExempt(pathname) {
  if (!pathname.includes('/batches')) return false
  if (pathname.includes('/batch-schedules')) return false
  // Nested under /batches/:id/recurring-patterns — activity-scoped (preview/bulk).
  if (pathname.includes('/recurring-patterns')) return false
  return true
}

function isPlacesLookupExempt(pathname) {
  return (
    pathname === '/places/autocomplete' ||
    pathname.startsWith('/places/autocomplete?') ||
    pathname === '/places/details' ||
    pathname.startsWith('/places/details?')
  )
}

/** Paths that must never send x-activity-id (bootstrap / academy-global / exempt). */
export function requestSkipsActivityHeader(urlPath) {
  const p = normalizeApiPath(urlPath)
  if (!p) return true
  if (pathHasPrefix(p, API_CLASSIFICATION.bootstrap)) return true
  if (pathHasPrefix(p, API_CLASSIFICATION.global)) return true
  if (isStudentsExempt(p) || isBatchesExempt(p) || isPlacesLookupExempt(p)) return true
  return false
}

/**
 * Paths that require a valid workspace id before the request is sent (coach operational partition).
 */
export function requestRequiresActivityWorkspace(urlPath) {
  const p = normalizeApiPath(urlPath)
  if (!p) return false
  if (requestSkipsActivityHeader(p)) return false
  return pathHasPrefix(p, API_CLASSIFICATION.scoped)
}

export function normalizeApiPath(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const u = new URL(url)
      return u.pathname.replace(/\/api\/v1/i, '').replace(/^\/+/, '/') || '/'
    }
  } catch {
    /* fall through */
  }
  let p = url.split('?')[0]
  if (p.includes('/api/v1')) {
    p = p.replace(/^.*\/api\/v1/i, '')
  }
  if (!p.startsWith('/')) p = `/${p}`
  return p || '/'
}

export function isValidUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim())
}
