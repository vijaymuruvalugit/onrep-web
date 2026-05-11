/**
 * /subscription/payment-processing — Razorpay callback target.
 *
 * UX intent: calm “Verifying payment…” screen so the user never bounces
 * through the dashboard between Razorpay and the activated state. The page
 * polls `/auth/me` until `can_access_app === true`, then navigates to the
 * sanitized `next` (or `/coach/dashboard`).
 *
 * Polling contract (hard limits — keep tight):
 *   - Interval: 5 seconds.
 *   - Max attempts: 12 (~60 s total budget).
 *   - One in-flight `/auth/me` at a time (subscriptionRefresh coalesces).
 *   - Paused while document is hidden; resumed on visibilitychange.
 *   - On exhaustion: navigate to `/subscription/paywall?payment=pending&next=…`
 *     with `isAwaitingPaymentConfirmation = true` carried via sessionStorage.
 *     No further auto-polling — only manual refresh.
 */
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'

import { refreshSubscription } from '../../auth/subscriptionRefresh'
import { sanitizeNext, safeNextOrDefault } from '../../auth/sanitizeNext'

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 12 // ~60 s

const AWAITING_KEY = 'onrep_subscription_awaiting_confirmation'

function markAwaiting() {
  try {
    sessionStorage.setItem(AWAITING_KEY, '1')
  } catch {
    /* no-op */
  }
}

export default function SubscriptionPaymentProcessingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const user = useSelector((s) => s.auth.user)
  const canAccess = user?.subscription?.can_access_app === true

  const next = safeNextOrDefault(search.get('next'))
  const [attempts, setAttempts] = useState(0)
  const stoppedRef = useRef(false)

  // Whenever the user object flips to can_access_app: true → navigate away.
  useEffect(() => {
    if (canAccess && !stoppedRef.current) {
      stoppedRef.current = true
      try {
        sessionStorage.removeItem(AWAITING_KEY)
      } catch {
        /* no-op */
      }
      navigate(next, { replace: true })
    }
  }, [canAccess, navigate, next])

  // Mark awaiting so the paywall (fallback) shows the calm waiting copy.
  useEffect(() => {
    markAwaiting()
  }, [])

  // Polling loop with hard limits + visibility awareness.
  useEffect(() => {
    if (stoppedRef.current) return undefined
    if (attempts >= MAX_POLL_ATTEMPTS) {
      // Pending fallback — paywall shows "Still confirming…" + manual refresh.
      const sanitized = sanitizeNext(next)
      const q = new URLSearchParams({ payment: 'pending' })
      if (sanitized) q.set('next', sanitized)
      navigate(`/subscription/paywall?${q.toString()}`, { replace: true })
      return undefined
    }

    let timer = null
    let cancelled = false

    function schedule() {
      if (cancelled || stoppedRef.current) return
      timer = setTimeout(async () => {
        if (cancelled || stoppedRef.current) return
        // Skip the tick while document is hidden — resume on visibilitychange.
        if (typeof document !== 'undefined' && document.hidden) {
          schedule()
          return
        }
        try {
          // Force bypass the 30s TTL: payment activation is the whole point of
          // this page; we need fresh /auth/me on every tick.
          await refreshSubscription(dispatch, { force: true })
        } catch {
          /* swallow — next tick will retry */
        }
        if (cancelled || stoppedRef.current) return
        setAttempts((n) => n + 1)
      }, POLL_INTERVAL_MS)
    }

    schedule()

    function onVisibility() {
      if (cancelled || stoppedRef.current) return
      if (typeof document !== 'undefined' && !document.hidden) {
        // Immediately retry on becoming visible; loop continues afterward.
        refreshSubscription(dispatch, { force: true }).catch(() => {})
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [attempts, dispatch, navigate, next])

  // First call on mount — kick the loop without waiting 5s.
  useEffect(() => {
    refreshSubscription(dispatch, { force: true }).catch(() => {})
  }, [dispatch])

  return (
    <div className="text-center py-4">
      <div className="mb-3">
        <CSpinner color="primary" />
      </div>
      <h2 className="h4 mb-2">Verifying payment…</h2>
      <p className="text-body-secondary mb-0">
        This usually takes a few seconds. Please do not close this tab.
      </p>
    </div>
  )
}
