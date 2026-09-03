import React from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CButton } from '@coreui/react'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'
import { formatInr } from '../utils/formatInr'

export default function TrialConvertBanner({ trialEndsAt, planPriceInr }) {
  const ends = trialEndsAt ? formatDisplayDateDmy(trialEndsAt) : null
  const price =
    planPriceInr != null && Number.isFinite(Number(planPriceInr))
      ? `₹${formatInr(planPriceInr)}`
      : null

  return (
    <CAlert
      color="info"
      className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3"
      data-testid="trial-convert-banner"
    >
      <span className="mb-0">
        You&apos;re on a free trial
        {ends ? (
          <>
            {' '}
            until <strong>{ends}</strong>
          </>
        ) : null}
        . Convert to a paid plan anytime
        {price ? <> — {price}/month</> : null}. Access stays on trial until payment confirms.
      </span>
      <CButton as={Link} to="/coach/billing" color="primary" size="sm">
        Subscribe now
      </CButton>
    </CAlert>
  )
}
