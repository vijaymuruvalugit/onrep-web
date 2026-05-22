/**
 * Central route classification registry for operational correctness.
 * Every new route should be intentionally assigned to one bucket.
 */
export const ROUTE_CLASSIFICATION = Object.freeze({
  global: Object.freeze([
    '/coach/onboarding/coaches',
    '/coach/payments',
    '/coach/parents',
    '/coach/activities',
    '/coach/academy/insights',
    '/super-admin/',
    '/ops/',
  ]),
  scoped: Object.freeze(['/coach/']),
  bootstrap: Object.freeze(['/login', '/register']),
  // `/subscription/*` lives outside the dashboard tree entirely; it must
  // never engage workspace or activity gates. Listing it here is defensive
  // (in case any helper accidentally inspects the path before the routes
  // tree decides where to mount).
  exempt: Object.freeze(['/onboarding/', '/subscription/']),
})

export function coachPathRequiresWorkspace(pathname) {
  if (!pathname) return false
  if (pathname.startsWith('/super-admin/') || pathname.startsWith('/ops/')) return false
  if (!pathname.startsWith('/coach/')) return false
  if (ROUTE_CLASSIFICATION.global.includes(pathname)) return false
  return true
}

export function onboardingPathExemptFromWorkspace(pathname) {
  if (!pathname) return false
  return ROUTE_CLASSIFICATION.exempt.some((prefix) => pathname.startsWith(prefix))
}

/** Returns true when the path is inside the subscription paywall surface. */
export function isSubscriptionRoute(pathname) {
  if (!pathname) return false
  return pathname === '/subscription' || pathname.startsWith('/subscription/')
}
