/**
 * Legacy alias for `/coach/billing/paywall` → `/subscription/paywall`.
 *
 * Pre-Phase-X this page rendered its own simple paywall inside the dashboard
 * layout. The canonical surface is now `/subscription/paywall` mounted under
 * a minimal full-viewport `SubscriptionShell` (NOT inside DefaultLayout).
 * Any deep links / bookmarks still hit `/coach/billing/paywall` and Navigate
 * forwards them with `replace` so the legacy URL never lingers in history.
 *
 * Keep this file thin — all subscription UX changes belong in
 * `SubscriptionPaywallPage.jsx`.
 */
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function PaywallPage() {
  const location = useLocation()
  // Forward any existing query string (e.g. `?payment=failed&next=…`).
  const search = location.search || ''
  return <Navigate to={`/subscription/paywall${search}`} replace />
}
