import React, { useCallback, useEffect, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLoopCircular } from '@coreui/icons'
import { useDispatch } from 'react-redux'
import { patchCurrentUser } from '../../../auth/slices/authSlice'
import onboardingApi from '../../../onboarding/api/onboardingApi'
import normalizeApiError from '../../../../api/normalizeApiError'

/**
 * Academy owner: choose how parents pay. Uses the same onboarding endpoint
 * so signup and Payment Settings stay in sync.
 */
const FeeCollectionModeCard = ({ initialPaymentModule, onPaymentModuleChange }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [automatedAvailable, setAutomatedAvailable] = useState(false)
  const [paymentModule, setPaymentModule] = useState(
    String(initialPaymentModule || 'MANUAL').toUpperCase() === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL',
  )

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await onboardingApi.getStatus()
      const pm = String(data?.payment_module || 'MANUAL').toUpperCase()
      const normalizedModule = pm === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL'
      setPaymentModule(normalizedModule)
      setAutomatedAvailable(data?.automated_payments_available === true)
      if (onPaymentModuleChange) onPaymentModuleChange(normalizedModule)
      dispatch(
        patchCurrentUser({
          payment_module: normalizedModule,
          payment_module_locked: !!data?.payment_module_locked,
          payment_configured: !!data?.payment_configured,
        }),
      )
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [dispatch, onPaymentModuleChange])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- encapsulated in load()
    void load()
  }, [load])

  const selectMode = async (module) => {
    const mod = module === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL'
    if (mod === paymentModule) return
    setSaving(true)
    setError(null)
    try {
      await onboardingApi.setPaymentModule(mod)
      setPaymentModule(mod)
      if (onPaymentModuleChange) onPaymentModuleChange(mod)
      dispatch(patchCurrentUser({ payment_module: mod }))
      await load()
    } catch (err) {
      const e = normalizeApiError(err)
      const raw = String(e.message || '').toUpperCase()
      if (raw.includes('AUTOMATED_NOT_AVAILABLE')) {
        setError({
          ...e,
          message:
            'Online checkout is currently unavailable. Stay on manual tracking, or contact OnRep support.',
        })
      } else {
        setError(e)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <CCard className="mb-3">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong>How parents pay</strong>
          <div className="text-body-secondary small fw-normal">
            Choose the payment flow parents see. You can still record offline payments anytime.
          </div>
        </div>
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={loading || saving}
        >
          {loading ? <CSpinner size="sm" /> : <CIcon icon={cilLoopCircular} className="me-1" />}
          Refresh
        </CButton>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-body-secondary small">Loading settings…</div>
        ) : (
          <>
            {error ? (
              <CAlert color="danger" className="py-2 mb-3">
                {error.message || 'Could not update fee collection mode.'}
              </CAlert>
            ) : null}

            <div className="d-flex flex-column flex-sm-row gap-2 mb-3 align-items-stretch">
              <CButton
                color={paymentModule === 'MANUAL' ? 'primary' : 'secondary'}
                variant={paymentModule === 'MANUAL' ? undefined : 'outline'}
                className="flex-grow-1 text-start d-flex flex-column align-items-stretch h-100"
                onClick={() => selectMode('MANUAL')}
                disabled={saving}
              >
                <div className="fw-semibold">Manual payments</div>
                <div className="small opacity-75">
                  Parents pay by cash, bank transfer, or UPI. You record or confirm the payment.
                </div>
              </CButton>
              <CButton
                color={paymentModule === 'AUTOMATED' ? 'primary' : 'secondary'}
                variant={paymentModule === 'AUTOMATED' ? undefined : 'outline'}
                className="flex-grow-1 text-start d-flex flex-column align-items-stretch h-100"
                onClick={() => selectMode('AUTOMATED')}
                disabled={saving || !automatedAvailable}
              >
                <div className="fw-semibold">Online checkout</div>
                <div className="small opacity-75">
                  Parents pay online through OnRep. Money is sent to your payout details.
                </div>
              </CButton>
            </div>

            {!automatedAvailable ? (
              <CAlert color="light" className="mb-0 py-2 text-body border">
                Online checkout is currently unavailable. Manual payments always work — contact
                OnRep support if you&apos;d like to enable online checkout for your academy.
              </CAlert>
            ) : (
              <p className="text-body-secondary small mb-0">
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" /> Saving…
                  </>
                ) : (
                  <>
                    Current:{' '}
                    <strong>
                      {paymentModule === 'AUTOMATED' ? 'Online checkout' : 'Manual payments'}
                    </strong>
                    .
                  </>
                )}
              </p>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default FeeCollectionModeCard
