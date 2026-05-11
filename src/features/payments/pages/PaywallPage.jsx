import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CButton, CCard, CCardBody, CCardHeader } from '@coreui/react'

/**
 * Subscription paywall (Phase 2.2). Reached only via the global 403
 * SUBSCRIPTION_REQUIRED interceptor or a deliberate user click. Intentionally
 * minimal — single message, two CTAs, no payment UI inline.
 */
export default function PaywallPage() {
  const navigate = useNavigate()
  return (
    <div className="p-4" style={{ maxWidth: 640 }}>
      <CCard>
        <CCardHeader>
          <strong>Subscription required</strong>
        </CCardHeader>
        <CCardBody>
          <CAlert color="warning">
            Your subscription has expired. Renew to continue managing your academy.
          </CAlert>
          <p className="text-muted">
            Once you renew, parent payments, schedules, and reporting unlock immediately.
            You'll be able to come back to this page from any link that requires an active
            subscription.
          </p>
          <div className="d-flex gap-2 mt-3">
            <CButton color="primary" onClick={() => navigate('/coach/billing')}>
              Renew now
            </CButton>
            <CButton color="secondary" variant="outline" onClick={() => navigate('/coach/billing')}>
              View plans
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}
