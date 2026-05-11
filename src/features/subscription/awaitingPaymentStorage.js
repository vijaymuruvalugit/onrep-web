/**
 * Transient "user is mid-checkout" flag used by `SubscriptionPaywallPage` to
 * disable the Pay button (across reloads) until activation completes.
 *
 * Lives in `sessionStorage` because it should NOT survive a tab close — a new
 * session is a fresh intent. It must also NEVER survive logout / login / a
 * forced-logout from the 401 interceptor: a different account in the same tab
 * has nothing to do with the prior user's in-flight payment.
 *
 * Single source for the storage key + the read / write / clear primitives so
 * both `SubscriptionPaywallPage` and `authSlice` reference the same bucket and
 * cannot drift.
 */

const STORAGE_KEY = 'onrep_subscription_awaiting_confirmation'

export function readAwaitingPaymentConfirmation() {
  try {
    if (typeof sessionStorage === 'undefined') return false
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAwaitingPaymentConfirmation(value) {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (value) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* quota / disabled — silent */
  }
}

export function clearAwaitingPaymentConfirmation() {
  setAwaitingPaymentConfirmation(false)
}

export const AWAITING_PAYMENT_KEY = STORAGE_KEY
