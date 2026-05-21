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
    '/dashboard/coach-summary',
    '/dashboard/summary',
    '/invites',
    '/parents/overview',
  ]),
  // Transitional explicit exemptions: keep academy-global until contract migration completes.
  exempt: Object.freeze(['/students', '/student-import', '/batches']),
  scoped: Object.freeze([
    '/dashboard/today',
    '/batch-schedules',
    '/operational-sessions',
    '/recurring-patterns',
    '/places',
    '/skating',
    '/sessions',
    '/attendance-percent',
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
  return (
    isStudentImportExempt(pathname) ||
    pathname === '/students' ||
    pathname.startsWith('/students?') ||
    (pathname.startsWith('/students/') && !pathname.includes('/attendance-percent'))
  )
}

function isBatchesExempt(pathname) {
  return pathname.includes('/batches') && !pathname.includes('/batch-schedules')
}

/** Paths that must never send x-activity-id (bootstrap / academy-global / exempt). */
export function requestSkipsActivityHeader(urlPath) {
  const p = normalizeApiPath(urlPath)
  if (!p) return true
  if (pathHasPrefix(p, API_CLASSIFICATION.bootstrap)) return true
  if (pathHasPrefix(p, API_CLASSIFICATION.global)) return true
  if (isStudentsExempt(p) || isBatchesExempt(p)) return true
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
