/**
 * SubscriptionShell — minimal full-viewport chrome for `/subscription/*`.
 *
 * Intentionally bypasses:
 *   - DefaultLayout
 *   - CoachWorkspaceShell
 *   - sidebar / nav / activity gates
 *
 * The paywall + processing page are calm conversion screens (think Stripe /
 * Notion / Slack billing interruption). Density and admin chrome belong to the
 * dashboard tree, NOT here.
 */
import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { CSpinner } from '@coreui/react'

export default function SubscriptionShell() {
  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        background: 'var(--cui-body-bg)',
      }}
    >
      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
        <div style={{ width: '100%', maxWidth: 520 }}>
          <Suspense
            fallback={
              <div className="text-center">
                <CSpinner color="primary" variant="grow" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
