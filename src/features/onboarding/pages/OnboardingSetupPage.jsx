import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CCard, CCardBody, CCol, CRow, CSpinner } from '@coreui/react'

import { refreshSession } from '../../auth/slices/authSlice'
import FeePayoutSetupCard from '../../payments/components/coach/FeePayoutSetupCard'
import { isFeeCollectionConfigured, normalizeOnboardingDtoFromApi } from '../utils/onboardingSteps'
import RequireOwner from '../components/RequireOwner'

/** Owner fee collection — one card: Manual/Online + UPI or bank + Save. */
function OnboardingSetupContent() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const onboarding = normalizeOnboardingDtoFromApi(user?.onboarding ?? null)
  const configured = isFeeCollectionConfigured(onboarding)

  const [initLoading, setInitLoading] = useState(true)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await dispatch(refreshSession()).unwrap()
      } catch {
        if (!cancelled) {
          setBanner({ color: 'warning', text: 'Could not refresh your academy status. Try again.' })
        }
      } finally {
        if (!cancelled) setInitLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const onSaved = async () => {
    setBanner(null)
    try {
      await dispatch(refreshSession()).unwrap()
    } catch {
      setBanner({ color: 'warning', text: 'Saved, but status refresh failed. Reload the page.' })
    }
  }

  if (initLoading) {
    return (
      <div className="py-5 text-center">
        <CSpinner color="primary" />
        <div className="small text-body-secondary mt-2">Loading payment setup…</div>
      </div>
    )
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={8} xl={7}>
        <div className="mb-3">
          <h2 className="mb-1">Set up payments</h2>
          <p className="text-body-secondary small mb-0">
            Choose how parents pay and where the money goes — one save and you&apos;re done.
          </p>
        </div>

        {banner ? <CAlert color={banner.color}>{banner.text}</CAlert> : null}

        {configured ? (
          <CCard className="mb-3">
            <CCardBody>
              <p className="mb-2 fw-semibold">Payments are set up</p>
              <p className="small text-body-secondary mb-3">
                You can update details below anytime, or continue to finish onboarding.
              </p>
              <CButton color="primary" as={Link} to="/onboarding/complete">
                Continue
              </CButton>
            </CCardBody>
          </CCard>
        ) : null}

        <FeePayoutSetupCard onSaved={onSaved} />

        <div className="d-flex flex-wrap gap-2">
          <CButton color="link" className="text-decoration-none p-0" as={Link} to="/coach/dashboard">
            Skip for now — go to dashboard
          </CButton>
        </div>
      </CCol>
    </CRow>
  )
}

const OnboardingSetupPage = () => (
  <RequireOwner>
    <OnboardingSetupContent />
  </RequireOwner>
)

export default OnboardingSetupPage
