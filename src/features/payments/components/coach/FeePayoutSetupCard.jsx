import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CSpinner,
  CBadge,
} from '@coreui/react'
import { useDispatch } from 'react-redux'
import { patchCurrentUser } from '../../auth/slices/authSlice'
import onboardingApi from '../../onboarding/api/onboardingApi'
import paymentsApi from '../api/paymentsApi'
import { paymentSettingsApi } from '../api/paymentSettingsApi'
import {
  buildPayoutSavePayload,
  inferPayoutMethodFromServer,
  validatePayoutForm,
} from '../utils/payoutDetailsValidation'
import normalizeApiError from '../../../api/normalizeApiError'
import { copyForReason } from '../constants/checkoutReadiness'

function normalizePaymentModule(raw) {
  return String(raw || 'MANUAL').toUpperCase() === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL'
}

/**
 * One card: pick Manual vs Online, enter UPI or bank, Save once.
 */
export default function FeePayoutSetupCard({ onSaved }) {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [automatedAvailable, setAutomatedAvailable] = useState(false)
  const [paymentModule, setPaymentModule] = useState('MANUAL')
  const [configured, setConfigured] = useState(false)
  const [upiDraft, setUpiDraft] = useState('')
  const [bankServer, setBankServer] = useState(null)
  const [payoutMethod, setPayoutMethod] = useState('upi')
  const [bankForm, setBankForm] = useState({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  })
  const [readiness, setReadiness] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [status, upi, bank, settings] = await Promise.all([
        onboardingApi.getStatus(),
        paymentsApi.getCoachFeeUpi().catch(() => ''),
        paymentSettingsApi.getBankAccount().catch(() => null),
        paymentSettingsApi.getSettings().catch(() => null),
      ])
      const mod = normalizePaymentModule(status?.payment_module)
      setPaymentModule(mod)
      setAutomatedAvailable(status?.automated_payments_available === true)
      setConfigured(!!(status?.payment_setup_done || status?.payment_configured))
      const upiVal = upi || bank?.upi_id || ''
      setUpiDraft(upiVal)
      setBankServer(bank)
      if (bank) {
        setBankForm({
          account_holder_name: bank.account_holder_name || '',
          bank_name: bank.bank_name || '',
          account_number: '',
          ifsc_code: bank.ifsc_code || '',
          upi_id: bank.upi_id || upiVal,
        })
        const inferred = inferPayoutMethodFromServer(bank)
        setPayoutMethod(mod === 'AUTOMATED' ? inferred : 'upi')
      } else {
        setPayoutMethod('upi')
        setBankForm((p) => ({ ...p, upi_id: upiVal }))
      }
      if (settings) {
        setReadiness({
          checkout_ready_ok: settings.checkout_ready_ok ?? settings.ok,
          checkout_ready_reasons: settings.checkout_ready_reasons ?? settings.reasons ?? [],
        })
      }
      dispatch(
        patchCurrentUser({
          payment_module: mod,
          payment_module_locked: !!status?.payment_module_locked,
          payment_configured: !!status?.payment_configured,
        }),
      )
    } catch (err) {
      setError(normalizeApiError(err).message || 'Unable to load payment setup')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const mod =
        paymentModule === 'AUTOMATED' && automatedAvailable ? 'AUTOMATED' : 'MANUAL'

      if (mod === 'MANUAL' || payoutMethod === 'upi') {
        const trimmed = upiDraft.trim()
        if (!trimmed) {
          setError('Enter your UPI ID (e.g. academy@okhdfcbank).')
          return
        }
        await onboardingApi.postPaymentSetup({ module: mod, upiVpa: trimmed })
        // Keep bank-account UPI in sync for online settlements when using UPI.
        if (mod === 'AUTOMATED') {
          await paymentSettingsApi.saveBankAccount(
            buildPayoutSavePayload('upi', { ...bankForm, upi_id: trimmed }, bankServer),
          )
        }
      } else {
        const validationError = validatePayoutForm('bank', bankForm, bankServer)
        if (validationError) {
          setError(validationError)
          return
        }
        await onboardingApi.postPaymentSetup({ module: 'AUTOMATED' })
        await paymentSettingsApi.saveBankAccount(
          buildPayoutSavePayload('bank', bankForm, bankServer),
        )
      }

      await paymentSettingsApi.updateSettings({
        accepts_online_payments: mod === 'AUTOMATED',
      })
      setSuccess(configured ? 'Payment details updated.' : 'Payments are set up.')
      setConfigured(true)
      await load()
      if (onSaved) await onSaved()
    } catch (err) {
      const e = normalizeApiError(err)
      const raw = String(e.message || '').toUpperCase()
      if (raw.includes('AUTOMATED_NOT_AVAILABLE') || raw.includes('AUTOMATED_RAZORPAY')) {
        setError('Online checkout is unavailable right now. Use Manual payments, or contact support.')
      } else if (raw.includes('INVALID_UPI')) {
        setError('UPI ID must look like name@bank.')
      } else {
        setError(e.message || 'Could not save payment setup')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CSpinner />

  const showBankOption = paymentModule === 'AUTOMATED' && automatedAvailable
  const reasons = Array.isArray(readiness?.checkout_ready_reasons)
    ? readiness.checkout_ready_reasons
    : []

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <strong>Receive payments</strong>
        {configured ? <CBadge color="success">Set up</CBadge> : <CBadge color="secondary">Not set up</CBadge>}
      </CCardHeader>
      <CCardBody>
        <p className="text-body-secondary small">
          One save: choose how parents pay, and where the money should go.
        </p>

        {error ? (
          <CAlert color="danger" className="py-2">
            {error}
          </CAlert>
        ) : null}
        {success ? (
          <CAlert color="success" className="py-2">
            {success}
          </CAlert>
        ) : null}

        <div className="mb-3">
          <div className="form-label fw-semibold">How parents pay</div>
          <div className="d-flex flex-wrap gap-3">
            <CFormCheck
              type="radio"
              name="feeModule"
              id="fee-manual"
              label="Manual — parents pay UPI/cash, you confirm"
              checked={paymentModule === 'MANUAL'}
              onChange={() => {
                setPaymentModule('MANUAL')
                setPayoutMethod('upi')
              }}
              disabled={saving}
            />
            <CFormCheck
              type="radio"
              name="feeModule"
              id="fee-online"
              label={
                automatedAvailable
                  ? 'Online — parents pay in OnRep'
                  : 'Online — coming soon'
              }
              checked={paymentModule === 'AUTOMATED'}
              onChange={() => automatedAvailable && setPaymentModule('AUTOMATED')}
              disabled={saving || !automatedAvailable}
            />
          </div>
        </div>

        {showBankOption ? (
          <div className="mb-3">
            <div className="form-label fw-semibold">Where money goes</div>
            <div className="d-flex flex-wrap gap-3">
              <CFormCheck
                type="radio"
                name="dest"
                id="dest-upi"
                label="UPI ID"
                checked={payoutMethod === 'upi'}
                onChange={() => setPayoutMethod('upi')}
                disabled={saving}
              />
              <CFormCheck
                type="radio"
                name="dest"
                id="dest-bank"
                label="Bank account"
                checked={payoutMethod === 'bank'}
                onChange={() => setPayoutMethod('bank')}
                disabled={saving}
              />
            </div>
          </div>
        ) : (
          <CFormLabel htmlFor="setupUpi">Your UPI ID</CFormLabel>
        )}

        {payoutMethod === 'upi' || !showBankOption ? (
          <div className="mb-3">
            {showBankOption ? <CFormLabel htmlFor="setupUpi">UPI ID</CFormLabel> : null}
            <CFormInput
              id="setupUpi"
              placeholder="academy@okhdfcbank"
              value={upiDraft}
              onChange={(e) => setUpiDraft(e.target.value)}
              autoComplete="off"
              disabled={saving}
            />
          </div>
        ) : (
          <>
            <div className="mb-3">
              <CFormLabel htmlFor="setupHolder">Account holder name</CFormLabel>
              <CFormInput
                id="setupHolder"
                value={bankForm.account_holder_name}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, account_holder_name: e.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="setupBank">Bank name</CFormLabel>
              <CFormInput
                id="setupBank"
                value={bankForm.bank_name}
                onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="setupAcn">
                Account number
                {bankServer?.account_number_last4 ? ' (leave blank to keep existing)' : ''}
              </CFormLabel>
              <CFormInput
                id="setupAcn"
                value={bankForm.account_number}
                onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))}
                autoComplete="off"
                disabled={saving}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="setupIfsc">IFSC</CFormLabel>
              <CFormInput
                id="setupIfsc"
                value={bankForm.ifsc_code}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))
                }
                disabled={saving}
              />
            </div>
          </>
        )}

        {paymentModule === 'AUTOMATED' && readiness && !readiness.checkout_ready_ok ? (
          <CAlert color="warning" className="py-2 small">
            Online checkout still needs:
            <ul className="mb-0 mt-1">
              {reasons.map((code) => (
                <li key={code}>{copyForReason(code).title}</li>
              ))}
            </ul>
          </CAlert>
        ) : null}

        <CButton color="primary" onClick={handleSave} disabled={saving}>
          {saving ? <CSpinner size="sm" /> : configured ? 'Update' : 'Save'}
        </CButton>
      </CCardBody>
    </CCard>
  )
}
