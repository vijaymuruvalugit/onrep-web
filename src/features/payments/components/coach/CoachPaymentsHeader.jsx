import React from 'react'
import { CButton, CCol, CRow } from '@coreui/react'
import { Link } from 'react-router-dom'

const CoachPaymentsHeader = ({ studentName }) => {
  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">{studentName ? `Payments — ${studentName}` : 'Payments'}</h2>
          <p className="text-body-secondary small mb-0">
            Fees are generated from your settings. Record payments and confirm parent reports here.
          </p>
        </CCol>
        <CCol xs="auto" className="d-flex gap-2">
          <Link to="/coach/payments/settings">
            <CButton size="sm" color="secondary" variant="outline">
              Payment settings
            </CButton>
          </Link>
          <Link to="/coach/payments/payout-details">
            <CButton size="sm" color="secondary" variant="outline">
              Payout details
            </CButton>
          </Link>
          <Link to="/coach/billing">
            <CButton size="sm" color="primary" variant="outline">
              Billing
            </CButton>
          </Link>
        </CCol>
      </CRow>
    </>
  )
}

export default CoachPaymentsHeader
