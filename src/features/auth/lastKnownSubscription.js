/**
 * lastKnownSubscription — best-effort UI cache to reduce paywall flicker on
 * reload / offline.
 *
 * IMPORTANT: this cache is **UX only**. It is NEVER consulted for the access
 * gate — `SubscriptionGuard` and `requireActiveSubscription` always wait for a
 * fresh `/auth/me`. The cache only seeds the paywall identity strip (academy
 * name, plan, amount, billing cycle) so the user does not see an empty
 * "Activate your academy" card while `/me` is in flight.
 *
 * Keys persisted: only fields safe to render without authorization checks.
 * No tokens, no email, no PII beyond academy display name.
 */

const STORAGE_KEY = 'onrep_last_known_subscription'

function pickSubset(subscription, academyName) {
  if (!subscription) return null
  return {
    state: subscription.state || null,
    billing_context: subscription.billing_context ?? null,
    plan: subscription.plan || null,
    plan_price_inr:
      subscription.plan_price_inr != null ? Number(subscription.plan_price_inr) : null,
    academy_name: academyName || null,
    saved_at: Date.now(),
  }
}

export function persistLastKnownSubscription({ subscription, academyName } = {}) {
  try {
    if (typeof localStorage === 'undefined') return
    const subset = pickSubset(subscription, academyName)
    if (!subset) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subset))
  } catch {
    /* quota / disabled storage — silent */
  }
}

export function readLastKnownSubscription() {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearLastKnownSubscription() {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* silent */
  }
}
