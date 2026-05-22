/**
 * HashRouter requires `#/route` — bare paths like `/accept-invite?token=…` land on `/`
 * and bounce to login. Used from index.html (pre-React) and App (backup).
 *
 * @returns {boolean} true when a redirect was triggered
 */
export function restorePublicHashRoute() {
  if (typeof window === 'undefined') return false

  try {
    const hash = window.location.hash || ''
    if (hash.length > 1 && hash.charAt(1) === '/') {
      return false
    }

    const pathname = window.location.pathname || '/'
    const search = window.location.search || ''
    const stripped = pathname.replace(/\/$/, '') || '/'

    const map = {
      '/verify-email': '/auth/verify-email',
      '/reset-password': '/auth/reset-password',
      '/accept-invite': '/accept-invite',
      '/accept-parent-invite': '/accept-parent-invite',
    }

    const target = map[stripped]
    if (!target) return false

    window.location.replace(`${window.location.origin}/#${target}${search}`)
    return true
  } catch {
    return false
  }
}

/**
 * Read invite/auth token when query landed outside the hash (email clients, scanners).
 * @returns {string}
 */
export function readStrandedAuthToken() {
  if (typeof window === 'undefined') return ''
  try {
    const fromSearch = new URLSearchParams(window.location.search || '')
    return (
      fromSearch.get('token') ||
      fromSearch.get('code') ||
      ''
    ).trim()
  } catch {
    return ''
  }
}
