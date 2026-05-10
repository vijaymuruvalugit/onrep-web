import { describe, expect, it } from 'vitest'

import { ONREP_ROUTE_DEFS } from '../routePaths'
import { DASHBOARD_PAGES } from './dashboardPagesRegistration'

const PARENT_COACH_PATHS = ONREP_ROUTE_DEFS.map((d) => d.path).filter(
  (p) =>
    p.startsWith('/parent/') ||
    p === '/coach/parents' ||
    p === '/coach/dashboard' ||
    p === '/coach/skating' ||
    p === '/coach/onboarding/coaches',
)

describe('protectedRoutes DASHBOARD_PAGES', () => {
  it('resolves parent and key coach routes to concrete pages (not placeholder fallback)', () => {
    for (const path of PARENT_COACH_PATHS) {
      expect(DASHBOARD_PAGES[path], `missing page for ${path}`).toBeDefined()
    }
  })
})
