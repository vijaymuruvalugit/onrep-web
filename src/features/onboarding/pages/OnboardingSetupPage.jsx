import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'

import { refreshSession } from '../../auth/slices/authSlice'
import onboardingApi from '../api/onboardingApi'
import normalizeApiError from '../../../api/normalizeApiError'
import { isFeeCollectionConfigured, normalizeOnboardingDtoFromApi } from '../utils/onboardingSteps'
import { friendlyOnboardingSetupError } from '../utils/mapOnboardingSetupError'
import { manualPaymentSetupSchema } from '../validations/onboardingSetupSchema'
import RequireOwner from '../components/RequireOwner'

/**
 * Owner fee collection setup — mirrors legacy RN FeeCollectionSetupScreen (flags, not only current_step).
 */
function OnboardingSetupContent() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const onboarding = normalizeOnboardingDtoFromApi(user?.onboarding ?? null)
  const paymentModule = String(
    user?.payment_module || onboarding?.payment_module || 'MANUAL',
  ).toUpperCase()

  const [initLoading, setInitLoading] = useState(true)
  const [busy, setBusy] = useState(false)
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

  const load = () => {
    setBanner(null)
    setInitLoading(true)
    void (async () => {
      try {
        await dispatch(refreshSession()).unwrap()
      } catch {
        setBanner({ color: 'warning', text: 'Could not refresh your academy status. Try again.' })
      } finally {
        setInitLoading(false)
      }
    })()
  }

  const needModule = !onboarding?.payment_module_selected
  const needSetup = Boolean(onboarding?.payment_module_selected && !onboarding?.payment_setup_done)
  const configured = isFeeCollectionConfigured(onboarding)
  const automatedAvailable = onboarding?.automated_payments_available === true

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(manualPaymentSetupSchema()),
    defaultValues: { upiVpa: '' },
  })

  const pickModule = async (module) => {
    setBusy(true)
    setBanner(null)
    try {
      await onboardingApi.setPaymentModule(module)
      await dispatch(refreshSession()).unwrap()
    } catch (e) {
      const n = normalizeApiError(e)
      setBanner({
        color: 'danger',
        text: friendlyOnboardingSetupError(n.message, n.message),
      })
    } finally {
      setBusy(false)
    }
  }

  const onManualSetup = async (values) => {
    setBusy(true)
    setBanner(null)
    try {
      await onboardingApi.postPaymentSetup({ upiVpa: values.upiVpa.trim() })
      await dispatch(refreshSession()).unwrap()
    } catch (e) {
      const n = normalizeApiError(e)
      setBanner({
        color: 'danger',
        text: friendlyOnboardingSetupError(n.message, n.message),
      })
    } finally {
      setBusy(false)
    }
  }

  const onAutomatedSetup = async () => {
    setBusy(true)
    setBanner(null)
    try {
      await onboardingApi.postPaymentSetup({})
      await dispatch(refreshSession()).unwrap()
    } catch (e) {
      const n = normalizeApiError(e)
      setBanner({
        color: 'danger',
        text: friendlyOnboardingSetupError(n.message, n.message),
      })
    } finally {
      setBusy(false)
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
          <h2 className="mb-1">Collect fees from parents</h2>
          <p className="text-body-secondary small mb-0">
            This is how you record parent fees — separate from your platform subscription. Choose
            manual (offline / UPI) or automated checkout when available.
          </p>
        </div>

        {banner ? <CAlert color={banner.color}>{banner.text}</CAlert> : null}

        {configured ? (
          <CCard className="mb-3">
            <CCardBody>
              <p className="mb-2 fw-semibold">Fee collection is configured</p>
              <p className="small text-body-secondary mb-3">
                You can invite coaches and start adding batches and students. Change fee settings
                later from Payments when needed.
              </p>
              <CButton color="primary" as={Link} to="/onboarding/complete">
                Continue
              </CButton>
            </CCardBody>
          </CCard>
        ) : null}

        {!configured && needModule ? (
          <CCard className="mb-3">
            <CCardHeader>How do you collect fees?</CCardHeader>
            <CCardBody className="d-grid gap-2">
              <CButton
                color="primary"
                variant="outline"
                disabled={busy}
                onClick={() => pickModule('MANUAL')}
              >
                Manual payments
                <div className="small fw-normal text-body-secondary">
                  Offline · UPI / bank · No payment gateway fee
                </div>
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                disabled={busy || !automatedAvailable}
                onClick={() => pickModule('AUTOMATED')}
              >
                Automated payments
                <div className="small fw-normal text-body-secondary">
                  {automatedAvailable
                    ? 'Razorpay checkout for parents'
                    : 'Not available until Razorpay is configured on the server'}
                </div>
              </CButton>
              {busy ? (
                <div className="text-center">
                  <CSpinner size="sm" />
                </div>
              ) : null}
            </CCardBody>
          </CCard>
        ) : null}

        {!configured && needSetup ? (
          <CCard className="mb-3">
            <CCardHeader>Payment details</CCardHeader>
            <CCardBody>
              {paymentModule === 'MANUAL' ? (
                <CForm onSubmit={handleSubmit(onManualSetup)}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="upiVpa">Academy UPI ID</CFormLabel>
                    <CFormInput
                      id="upiVpa"
                      placeholder="your-academy@upi"
                      invalid={Boolean(errors.upiVpa)}
                      autoComplete="off"
                      {...register('upiVpa')}
                    />
                    {errors.upiVpa ? (
                      <div className="small text-danger mt-1">{errors.upiVpa.message}</div>
                    ) : null}
                  </div>
                  <CButton color="primary" type="submit" disabled={busy}>
                    {busy ? <CSpinner size="sm" /> : null}
                    Save
                  </CButton>
                </CForm>
              ) : (
                <>
                  <p className="small text-body-secondary">
                    Fee collection uses Razorpay payment links for parents. Your server must have
                    valid Razorpay keys.
                  </p>
                  <CButton color="primary" onClick={() => void onAutomatedSetup()} disabled={busy}>
                    {busy ? <CSpinner size="sm" /> : null}
                    Continue
                  </CButton>
                </>
              )}
            </CCardBody>
          </CCard>
        ) : null}

        <div className="d-flex flex-wrap gap-2">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={busy}
          >
            Refresh status
          </CButton>
          <CButton
            color="link"
            className="text-decoration-none p-0"
            as={Link}
            to="/coach/dashboard"
          >
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
