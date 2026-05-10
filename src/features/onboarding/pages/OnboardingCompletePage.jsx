import React from 'react'
import { Link } from 'react-router-dom'
import { CButton, CCard, CCardBody } from '@coreui/react'

import RequireOwner from '../components/RequireOwner'

/**
 * Completion step — primary exit to operational dashboard (no dead-end).
 */
function OnboardingCompleteContent() {
  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <h2 className="mb-3">You&apos;re ready to operate</h2>
      <CCard className="mb-4">
        <CCardBody>
          <p className="mb-3">
            Fee collection is set up (or you skipped for now). Head to your dashboard to add batches
            and students, or invite a coach when you are ready.
          </p>
          <div className="d-grid gap-2">
            <CButton color="primary" size="lg" as={Link} to="/coach/dashboard">
              Go to dashboard
            </CButton>
            <CButton color="secondary" variant="outline" as={Link} to="/coach/onboarding/coaches">
              Invite a coach
            </CButton>
            <CButton color="secondary" variant="outline" as={Link} to="/coach/payments">
              Open payments
            </CButton>
          </div>
        </CCardBody>
      </CCard>
      <p className="small text-body-secondary mb-0">
        You can always resume setup from the dashboard if something is still pending.
      </p>
    </div>
  )
}

const OnboardingCompletePage = () => (
  <RequireOwner>
    <OnboardingCompleteContent />
  </RequireOwner>
)

export default OnboardingCompletePage
