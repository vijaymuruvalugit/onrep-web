import { describe, expect, it } from 'vitest'

import { ONREP_ROUTE_DEFS } from '../routePaths'
import { DASHBOARD_PAGE_REGISTRATION, DASHBOARD_PAGES } from './dashboardPagesRegistration'

const PARENT_COACH_PATHS = ONREP_ROUTE_DEFS.map((d) => d.path).filter(
  (p) =>
    p.startsWith('/parent/') ||
    p === '/coach/parents' ||
    p === '/coach/dashboard' ||
    p === '/coach/skating' ||
    p === '/coach/ops/sessions/:sessionId' ||
    p === '/coach/onboarding/coaches',
)

describe('protectedRoutes DASHBOARD_PAGES', () => {
  it('resolves parent and key coach routes to concrete pages (not placeholder fallback)', () => {
    for (const path of PARENT_COACH_PATHS) {
      expect(DASHBOARD_PAGES[path], `missing page for ${path}`).toBeDefined()
    }
  })

  it('registers every dashboard page path in ONREP_ROUTE_DEFS so AppContent can mount it', () => {
    const defined = new Set(ONREP_ROUTE_DEFS.map((d) => d.path))
    for (const { path } of DASHBOARD_PAGE_REGISTRATION) {
      expect(defined.has(path), `missing ONREP_ROUTE_DEFS entry for ${path}`).toBe(true)
    }
  })
})
