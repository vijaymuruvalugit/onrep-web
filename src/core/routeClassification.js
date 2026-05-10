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
  ]),
  scoped: Object.freeze(['/coach/']),
  bootstrap: Object.freeze(['/login', '/register']),
  exempt: Object.freeze(['/onboarding/']),
})

export function coachPathRequiresWorkspace(pathname) {
  if (!pathname || !pathname.startsWith('/coach/')) return false
  if (ROUTE_CLASSIFICATION.global.includes(pathname)) return false
  return true
}

export function onboardingPathExemptFromWorkspace(pathname) {
  if (!pathname) return false
  return ROUTE_CLASSIFICATION.exempt.some((prefix) => pathname.startsWith(prefix))
}
