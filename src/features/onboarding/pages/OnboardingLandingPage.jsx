import React from 'react'
import { Link } from 'react-router-dom'
import { CButton } from '@coreui/react'
import AuthShell from '../../auth/components/AuthShell'

/**
 * Public entry — operational onboarding only (no marketing funnel).
 */
const OnboardingLandingPage = () => {
  return (
    <AuthShell
      title="Set up your academy"
      subtitle="Create your academy account, configure how you collect fees, and invite your team. Takes just a few minutes."
    >
      <div className="d-grid gap-2 mb-3">
        <CButton color="primary" size="lg" as={Link} to="/onboarding/create-academy">
          Create academy
        </CButton>
        <CButton color="secondary" variant="outline" as={Link} to="/auth/login">
          I already have an account
        </CButton>
      </div>
    </AuthShell>
  )
}

export default OnboardingLandingPage
