/**
 * /subscription/paywall — canonical owner subscription gate.
 *
 * Branches UI on `state + billing_context` from /auth/me.subscription. Access
 * decisions live in SubscriptionGuard (which only branches on
 * `can_access_app`). This page is the calm conversion / interruption screen.
 *
 * Query params:
 *   - next      — sanitized internal path to resume after activation
 *   - payment   — 'pending' (webhook still processing) | 'failed' (cancel/err)
 *   - mode      — 'new' (post-signup subscribe path) — only used as hint
 *
 * `isAwaitingPaymentConfirmation` is a transient flag persisted in
 * `sessionStorage` so Pay-now is disabled even across reloads while a payment
 * is in flight. The flag clears on:
 *   - successful activation (can_access_app flips true)
 *   - explicit "Try again" after `payment=failed`
 *   - manual Refresh status + 30s without a flip (best-effort)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'

import { billingApi } from '../../payments/api/billingApi'
import { logout } from '../../auth/slices/authSlice'
import { refreshSubscription } from '../../auth/subscriptionRefresh'
import { sanitizeNext, safeNextOrDefault } from '../../auth/sanitizeNext'
import { readLastKnownSubscription } from '../../auth/lastKnownSubscription'

const AWAITING_KEY = 'onrep_subscription_awaiting_confirmation'

function copyForState({ state, billing_context, payment }) {
  if (payment === 'failed') {
    return {
      title: 'Payment was not completed',
      description: 'No money has been charged. You can try again whenever you are ready.',
      tone: 'warning',
    }
  }
  if (payment === 'pending') {
    return {
      title: 'Still confirming your payment',
      description:
        'Your payment has been received by the gateway. Activation usually happens within a minute — please refresh in a moment. Do NOT pay again.',
      tone: 'info',
    }
  }
  if (state === 'PAST_DUE') {
    return {
      title: 'Your subscription is in its grace period',
      description: 'Renew now to avoid disruption. You still have access for a short window.',
      tone: 'warning',
    }
  }
  if (state === 'TRIAL_EXPIRED' && billing_context === 'NEW_SIGNUP') {
    return {
      title: 'Activate your academy',
      description: 'Continue using OnRep by activating your subscription.',
      tone: 'primary',
    }
  }
  if (state === 'TRIAL_EXPIRED') {
    return {
      title: 'Your trial has ended',
      description: 'Your academy data is safe and access will resume immediately after payment.',
      tone: 'primary',
    }
  }
  if (state === 'CANCELLED' && billing_context === 'REACTIVATION') {
    return {
      title: 'Welcome back',
      description: 'Reactivate your subscription to continue managing your academy.',
      tone: 'primary',
    }
  }
  if (state === 'CANCELLED') {
    return {
      title: 'Your subscription has ended',
      description: 'Your academy data is safe and access will resume immediately after payment.',
      tone: 'primary',
    }
  }
  return {
    title: 'Subscription required',
    description: 'Activate your subscription to continue.',
    tone: 'primary',
  }
}

function formatAmount(rupees) {
  const n = Number(rupees)
  if (!Number.isFinite(n)) return null
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `₹${n}`
  }
}

function setAwaiting(value) {
  try {
    if (value) sessionStorage.setItem(AWAITING_KEY, '1')
    else sessionStorage.removeItem(AWAITING_KEY)
  } catch {
    /* no storage */
  }
}

function readAwaiting() {
  try {
    return sessionStorage.getItem(AWAITING_KEY) === '1'
  } catch {
    return false
  }
}

export default function SubscriptionPaywallPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const user = useSelector((s) => s.auth.user)
  const subscription = user?.subscription || {}

  const next = useMemo(() => safeNextOrDefault(search.get('next')), [search])
  const payment = search.get('payment') // 'failed' | 'pending' | null
  const [awaiting, setAwaitingState] = useState(() => readAwaiting() || payment === 'pending')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const copy = copyForState({
    state: subscription.state,
    billing_context: subscription.billing_context,
    payment,
  })

  // If we landed on the paywall but `can_access_app` is suddenly true (e.g.
  // the user navigated back from a successful activation), bounce to `next`.
  useEffect(() => {
    if (subscription.can_access_app === true) {
      setAwaiting(false)
      navigate(next, { replace: true })
    }
  }, [subscription.can_access_app, navigate, next])

  // Hit /auth/me once on mount so the page reflects the latest backend state.
  // Force-bypasses the 30s TTL — paywall mount is a high-signal trigger.
  useEffect(() => {
    refreshSubscription(dispatch, { force: true }).catch(() => {})
  }, [dispatch])

  // Plain handlers — no useCallback. These are passed to ordinary DOM
  // elements (buttons), not memoized children, so the identity churn is fine
  // and keeps the React Compiler / Forget happy without dep-array juggling.
  const handlePay = async () => {
    setError(null)
    setBusy(true)
    try {
      const planId = subscription.plan || 'pro'
      const sanitizedNext = sanitizeNext(next)
      const { url } = await billingApi.createLink({
        plan: planId,
        next: sanitizedNext || undefined,
      })
      if (!url) throw new Error('Payment link unavailable')
      setAwaiting(true)
      setAwaitingState(true)
      window.location.href = url
    } catch (e) {
      setBusy(false)
      setError(e?.message || 'Failed to create payment link')
    }
  }

  const handleTryAgain = () => {
    setAwaiting(false)
    setAwaitingState(false)
    setError(null)
    // Strip the ?payment=failed query but preserve `next`.
    const suffix = next && next !== '/coach/dashboard' ? `?next=${encodeURIComponent(next)}` : ''
    navigate(`/subscription/paywall${suffix}`, { replace: true })
  }

  const handleRefresh = async () => {
    setError(null)
    setBusy(true)
    try {
      await refreshSubscription(dispatch, { force: true })
    } catch (e) {
      setError(e?.message || 'Refresh failed')
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  // ---- Identity strip values ----
  // Hydrate from `localStorage` cache to avoid an empty card while /me is in
  // flight on reload / offline. The cache is UI-only — never trusted for the
  // access gate (see SubscriptionGuard).
  const cached = useMemo(() => readLastKnownSubscription(), [])
  const academyName =
    user?.academy?.name || user?.academy_name || user?.academyName || cached?.academy_name || ''
  const planName = subscription.plan || cached?.plan || 'Subscription'
  const amount = formatAmount(
    subscription.plan_price_inr != null ? subscription.plan_price_inr : cached?.plan_price_inr,
  )

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody className="p-4">
        <div className="mb-4 pb-3 border-bottom">
          <div className="text-body-secondary small text-uppercase mb-1">Academy</div>
          <div className="fw-semibold fs-5">{academyName || '—'}</div>
          <div className="d-flex flex-wrap gap-3 mt-2 small text-body-secondary">
            <div>
              <span className="me-1">Plan</span>
              <span className="text-body fw-medium">{planName}</span>
            </div>
            <div>
              <span className="me-1">Billing</span>
              <span className="text-body fw-medium">Monthly</span>
            </div>
            {amount ? (
              <div>
                <span className="me-1">Amount</span>
                <span className="text-body fw-medium">{amount}</span>
              </div>
            ) : null}
          </div>
        </div>

        <h2 className="h4 mb-2">{copy.title}</h2>
        <p className="text-body-secondary mb-4">{copy.description}</p>

        {error ? (
          <CAlert color="danger" className="py-2 small">
            {error}
          </CAlert>
        ) : null}

        {payment === 'failed' ? (
          <div className="d-grid gap-2">
            <CButton color="primary" onClick={handleTryAgain} disabled={busy}>
              Try again
            </CButton>
            <CButton color="secondary" variant="outline" onClick={handleLogout} disabled={busy}>
              Logout
            </CButton>
          </div>
        ) : awaiting ? (
          <>
            <CAlert color="info" className="py-2 small mb-3">
              <strong>Waiting for payment confirmation…</strong>
              <div className="mt-1">
                Activation usually happens within a minute. Do NOT pay again.
              </div>
            </CAlert>
            <div className="d-grid gap-2">
              <CButton color="primary" onClick={handleRefresh} disabled={busy}>
                {busy ? <CSpinner size="sm" /> : 'Refresh status'}
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleLogout} disabled={busy}>
                Logout
              </CButton>
            </div>
          </>
        ) : (
          <div className="d-grid gap-2">
            <CButton color="primary" onClick={handlePay} disabled={busy}>
              {busy ? <CSpinner size="sm" /> : 'Pay now'}
            </CButton>
            <CButton color="secondary" variant="outline" onClick={handleLogout} disabled={busy}>
              Logout
            </CButton>
          </div>
        )}

        <p className="small text-body-secondary mt-4 mb-0">
          Need help? Email{' '}
          <a href="mailto:support@onrep.in" className="text-decoration-none">
            support@onrep.in
          </a>
          .
        </p>
      </CCardBody>
    </CCard>
  )
}
