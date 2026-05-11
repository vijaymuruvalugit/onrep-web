/**
 * Central subscription refresh — single point that hits GET /auth/me.
 *
 * Contract (must not drift):
 *   - **30 second TTL** between successful calls. Multiple event sources
 *     (login, visibilitychange, online, focus, paywall mount, processing page
 *     polls, 403 interceptor) all flow through here so we do not hammer
 *     `/auth/me` on every focus change or tab wake.
 *   - **Concurrent calls coalesce**: an in-flight refresh is awaited by every
 *     subsequent caller; only one network request is in flight at a time.
 *   - **`{ force: true }`** bypasses the TTL — reserved for:
 *       1. Explicit user "Refresh status" click on paywall / processing page.
 *       2. `/subscription/payment-processing` polling ticks (the page enforces
 *          its own 5s/12-attempt limit; this still skips the TTL).
 *       3. The 403 SUBSCRIPTION_REQUIRED interceptor (mid-session expiry — we
 *          need the new `can_access_app` immediately).
 *
 * NOTE: this module is intentionally framework-agnostic; pass the redux
 * `dispatch` from the caller so it can be invoked from anywhere
 * (App.jsx effects, interceptors, lazy components, page polls).
 */

import { refreshSession } from './slices/authSlice'

export const SUBSCRIPTION_REFRESH_TTL_MS = 30 * 1000

let lastFetchedAt = 0
let inflight = null

/**
 * Refresh the canonical /auth/me payload (updates Redux `auth.user.subscription`).
 *
 * @param {Function} dispatch redux dispatch
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<unknown>} the dispatched thunk result
 */
export function refreshSubscription(dispatch, opts = {}) {
  if (typeof dispatch !== 'function') return Promise.resolve(null)
  const force = opts && opts.force === true
  const now = Date.now()

  // Coalesce: every concurrent caller awaits the same in-flight promise.
  if (inflight) return inflight

  // TTL guard for non-forced callers.
  if (!force && now - lastFetchedAt < SUBSCRIPTION_REFRESH_TTL_MS) {
    return Promise.resolve(null)
  }

  inflight = (async () => {
    try {
      const result = await dispatch(refreshSession())
      lastFetchedAt = Date.now()
      return result
    } catch (err) {
      // Errors do not update lastFetchedAt — caller can retry. Re-throw so
      // explicit "Refresh status" clicks can surface UI feedback.
      throw err
    } finally {
      inflight = null
    }
  })()

  return inflight
}

/** Test / dev helper — reset the throttle window. NOT for production code. */
export function __resetSubscriptionRefreshState() {
  lastFetchedAt = 0
  inflight = null
}
