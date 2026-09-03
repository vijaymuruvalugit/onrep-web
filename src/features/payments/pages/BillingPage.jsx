import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import { useAuth } from '../../auth/hooks/useAuth'
import { billingApi } from '../api/billingApi'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'
import {
  getBillingBannerKind,
  getPlanCheckoutLabel,
  isTrialingSubscription,
  subscriptionFromUser,
} from '../utils/billingSubscriptionUi'

/**
 * Owner-only billing surface (Phase 2.1).
 *
 * Surfaces, in order of importance:
 *   1. Current plan + status banner (trial / active / expired / grace).
 *   2. Plan catalogue with renew/upgrade buttons.
 *   3. Recent subscription payments (last 12, bounded).
 *
 * Rule: web-only. Mobile clients open the redirect URL natively; this page
 * never gets embedded in the mobile app.
 */
function fmtINR(n) {
  const v = Number(n || 0)
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return formatDisplayDateDmy(d)
  } catch {
    return String(d)
  }
}

function StatusBanner({ subscription }) {
  const kind = getBillingBannerKind(subscription)
  if (kind === 'active') {
    return (
      <CAlert color="success">
        Subscription active. Renews on <strong>{fmtDate(subscription.subscription_ends_at)}</strong>.
      </CAlert>
    )
  }
  if (kind === 'trial') {
    return (
      <CAlert color="info">
        Free trial — ends on <strong>{fmtDate(subscription.trial_ends_at)}</strong>. Subscribe now
        to convert to a paid plan. Your academy stays on trial until payment confirms.
      </CAlert>
    )
  }
  if (kind === 'grace') {
    return (
      <CAlert color="warning">
        Subscription expired but you&apos;re inside the grace window until{' '}
        <strong>{fmtDate(subscription.grace_until)}</strong>. Renew now to keep collecting payments.
      </CAlert>
    )
  }
  if (kind === 'cancelled') {
    return (
      <CAlert color="warning">
        Your paid subscription has ended. Reactivate below to continue managing your academy.
      </CAlert>
    )
  }
  return (
    <CAlert color="danger">
      Your subscription has expired. Renew now to continue managing your academy.
    </CAlert>
  )
}

function PaymentStatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  if (s === 'paid' || s === 'success') return <CBadge color="success">Paid</CBadge>
  if (s === 'created' || s === 'pending') return <CBadge color="warning">Pending</CBadge>
  if (s === 'expired' || s === 'failed') return <CBadge color="secondary">{s}</CBadge>
  return <CBadge color="info">{status || '—'}</CBadge>
}

export default function BillingPage() {
  const { user } = useAuth()
  const subscription = subscriptionFromUser(user)
  const [plans, setPlans] = useState([])
  const [payments, setPayments] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [creatingPlan, setCreatingPlan] = useState(null)

  useEffect(() => {
    let cancelled = false
    billingApi
      .getPlans()
      .then((rows) => {
        if (!cancelled) setPlans(rows)
      })
      .catch((e) => {
        if (!cancelled) setErrorMsg(e?.message || 'Failed to load plans')
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false)
      })
    billingApi
      .getPayments({ limit: 12 })
      .then((rows) => {
        if (!cancelled) setPayments(rows)
      })
      .catch(() => {
        if (!cancelled) setPayments([])
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlan = useMemo(() => {
    const p = String(subscription?.plan || '').toLowerCase()
    return plans.find((x) => x.id === p) || null
  }, [plans, subscription])

  const handleCheckout = async (planId) => {
    setCreatingPlan(planId)
    setErrorMsg(null)
    try {
      const r = await billingApi.createLink({ plan: planId, next: '/coach/billing' })
      if (r?.url) {
        window.location.assign(r.url)
      } else {
        setErrorMsg('Could not start checkout — please retry.')
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to start checkout')
    } finally {
      setCreatingPlan(null)
    }
  }

  return (
    <div className="p-4">
      <h2 className="mb-3">Billing</h2>
      <StatusBanner subscription={subscription} />
      {isTrialingSubscription(subscription) ? (
        <p className="text-body-secondary small mb-3">
          Choose a plan below to convert this academy from trial to paid. Razorpay confirms
          payment; access stays on trial until that confirmation arrives.
        </p>
      ) : null}
      {errorMsg ? <CAlert color="danger">{errorMsg}</CAlert> : null}

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Plans</strong>
        </CCardHeader>
        <CCardBody>
          {loadingPlans ? (
            <CSpinner size="sm" />
          ) : plans.length === 0 ? (
            <em>No plans available.</em>
          ) : (
            <div className="d-flex flex-wrap gap-3">
              {plans.map((p) => {
                const isCurrent = currentPlan?.id === p.id
                return (
                  <div
                    key={p.id}
                    className="border rounded p-3"
                    style={{ minWidth: 220, flex: '0 0 220px' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>{p.name || p.id}</strong>
                      {isCurrent ? <CBadge color="success">Current</CBadge> : null}
                    </div>
                    <div className="text-muted small mb-2">
                      {p.description || `${p.billing_cycle || 'monthly'} access`}
                    </div>
                    <div className="fs-4 mb-2">{fmtINR(p.price_inr)}</div>
                    <CButton
                      color={isCurrent && !isTrialingSubscription(subscription) ? 'secondary' : 'primary'}
                      disabled={creatingPlan === p.id}
                      onClick={() => handleCheckout(p.id)}
                      size="sm"
                    >
                      {creatingPlan === p.id ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Redirecting…
                        </>
                      ) : (
                        getPlanCheckoutLabel({ isCurrentPlan: isCurrent, subscription })
                      )}
                    </CButton>
                  </div>
                )
              })}
            </div>
          )}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>Recent payments</strong>
        </CCardHeader>
        <CCardBody>
          {loadingPayments ? (
            <CSpinner size="sm" />
          ) : payments.length === 0 ? (
            <em>No subscription payments yet.</em>
          ) : (
            <CTable hover responsive size="sm">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Plan</CTableHeaderCell>
                  <CTableHeaderCell>Amount</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Razorpay payment</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {payments.map((row) => (
                  <CTableRow key={row.id}>
                    <CTableDataCell>{fmtDate(row.created_at)}</CTableDataCell>
                    <CTableDataCell>{row.plan || '—'}</CTableDataCell>
                    <CTableDataCell>{fmtINR(row.amount_inr)}</CTableDataCell>
                    <CTableDataCell>
                      <PaymentStatusBadge status={row.status} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <code className="small">{row.razorpay_payment_id || '—'}</code>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}
