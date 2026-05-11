/**
 * SubscriptionGuard — wraps the dashboard tree (NOT the `/subscription/*` tree).
 *
 * Hard contract (must not drift — see CONTEXT/05 doctrine):
 *   - Branches ONLY on `user.subscription.can_access_app === false` + role
 *     `academy_owner`. No other field is checked. No `state`, no `has_access`,
 *     no `requires_payment`, no `paywall_reason`.
 *   - **No flash**: while we have no subscription payload yet (e.g. cold mount
 *     before `/auth/me` lands), render a spinner; never render the dashboard
 *     and then redirect. We also force a fresh `/auth/me` on mount to detect
 *     mid-session expiry from previously-cached payloads.
 *   - Non-owners (coach / parent / student / platform_admin without owner) are
 *     never gated client-side — the backend still enforces per-route
 *     `can_access_app` via `coachSubscriptionExplore` / `requireActiveSubscription`.
 *   - Preserves intended path via sanitized `next=` query (sanitization runs on
 *     both producer + consumer; see `sanitizeNext.js`).
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'

import { refreshSubscription } from '../subscriptionRefresh'
import { sanitizeNext } from '../sanitizeNext'

export default function SubscriptionGuard() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((s) => s.auth.user)
  const [bootstrapped, setBootstrapped] = useState(false)

  // Force-refresh /auth/me on mount: the cached user payload may pre-date
  // a subscription expiry. Bypasses the 30s TTL.
  useEffect(() => {
    let cancelled = false
    refreshSubscription(dispatch, { force: true })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const role = user?.role
  const subscription = user?.subscription
  const isOwner = role === 'academy_owner'

  const nextQuery = useMemo(() => {
    const raw = `${location.pathname || ''}${location.search || ''}`
    const safe = sanitizeNext(raw)
    return safe ? `?next=${encodeURIComponent(safe)}` : ''
  }, [location.pathname, location.search])

  // While we have no subscription payload yet, hold render to avoid a flash.
  // Non-owners skip the gate entirely once bootstrapped (or immediately if
  // the role is not owner — they don't depend on the subscription payload).
  if (!isOwner) return <Outlet />

  if (!bootstrapped && !subscription) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (subscription && subscription.can_access_app === false) {
    return <Navigate to={`/subscription/paywall${nextQuery}`} replace />
  }

  return <Outlet />
}
