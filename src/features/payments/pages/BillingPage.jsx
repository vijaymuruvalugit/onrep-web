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
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
  } catch {
    return String(d)
  }
}

function StatusBanner({ user }) {
  const status = String(user?.subscription_status || '').toLowerCase()
  const ent = user?.entitlement || {}
  if (ent.has_access && status === 'active') {
    return (
      <CAlert color="success">
        Subscription active. Renews on <strong>{fmtDate(user.subscription_end_date)}</strong>.
      </CAlert>
    )
  }
  if (status === 'trial' || ent.in_trial) {
    return (
      <CAlert color="info">
        Free trial — ends on <strong>{fmtDate(user.trial_ends_at)}</strong>.
      </CAlert>
    )
  }
  if (ent.in_grace) {
    return (
      <CAlert color="warning">
        Subscription expired but you're inside the grace window until{' '}
        <strong>{fmtDate(user.grace_until)}</strong>. Renew now to keep collecting payments.
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
  const { user, refreshUser } = useAuth()
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
    const p = String(user?.subscription_plan || '').toLowerCase()
    return plans.find((x) => x.id === p) || null
  }, [plans, user])

  const handleRenew = async (planId) => {
    setCreatingPlan(planId)
    setErrorMsg(null)
    try {
      const r = await billingApi.createLink({ plan: planId })
      if (r?.url) {
        window.location.assign(r.url)
      } else {
        setErrorMsg('Could not start checkout — please retry.')
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to start checkout')
    } finally {
      setCreatingPlan(null)
      try {
        await refreshUser?.()
      } catch {
        /* non-fatal */
      }
    }
  }

  return (
    <div className="p-4">
      <h2 className="mb-3">Billing</h2>
      <StatusBanner user={user} />
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
                      color={isCurrent ? 'secondary' : 'primary'}
                      disabled={creatingPlan === p.id}
                      onClick={() => handleRenew(p.id)}
                      size="sm"
                    >
                      {creatingPlan === p.id ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Redirecting…
                        </>
                      ) : isCurrent ? (
                        'Renew'
                      ) : (
                        'Switch plan'
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
