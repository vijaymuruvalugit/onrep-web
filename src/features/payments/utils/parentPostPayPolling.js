/**
 * Parent post-pay polling helper (Phase 1.5 + 3.2).
 *
 * After the parent returns from Razorpay we poll
 * `GET /payments/parent/obligations/:id/status` at PARENT_POLL_INTERVAL_MS
 * (3s) for up to PARENT_POLL_MAX_ATTEMPTS (20 = 60s). The page should show
 * `Payment is processing — do not pay again.` plus the `ATT-{token}` support
 * reference until either:
 *   - `paid === true` arrives → "Payment received"
 *   - timeout → "We're still confirming. Please check back later. Do NOT pay
 *     again." + the Pay-now button is locked for PAY_NOW_LOCKOUT_MS (15 min)
 *     via `localStorage` keyed on `obligation_id`.
 *
 * The helper is intentionally framework-agnostic — pass it a fetcher and it
 * resolves with `{ outcome: 'paid' | 'timeout', latest }`.
 */
import http from '../../../api/http'

export const PARENT_POLL_INTERVAL_MS = 3000
export const PARENT_POLL_MAX_ATTEMPTS = 20
export const PAY_NOW_LOCKOUT_MS = 15 * 60 * 1000

function lockoutKey(obligationId) {
  return `ezy.pay.lockout.${obligationId}`
}

export function setPayNowLockout(obligationId) {
  try {
    localStorage.setItem(lockoutKey(obligationId), String(Date.now() + PAY_NOW_LOCKOUT_MS))
  } catch {
    /* private mode / quota — non-fatal */
  }
}

export function clearPayNowLockout(obligationId) {
  try {
    localStorage.removeItem(lockoutKey(obligationId))
  } catch {
    /* */
  }
}

export function payNowLockoutRemainingMs(obligationId) {
  try {
    const raw = localStorage.getItem(lockoutKey(obligationId))
    if (!raw) return 0
    const until = Number(raw)
    if (!Number.isFinite(until)) return 0
    const remaining = until - Date.now()
    return remaining > 0 ? remaining : 0
  } catch {
    return 0
  }
}

export async function fetchObligationStatus(obligationId) {
  const { data } = await http.get(`/payments/parent/obligations/${obligationId}/status`)
  return data
}

/**
 * Run the bounded poller. Resolves once the obligation is paid or we hit the
 * attempt cap. Setting up the UI copy + lockout is the caller's responsibility
 * (so this stays framework-agnostic).
 *
 * @param {string} obligationId
 * @param {(snapshot: any, attempt: number) => void} onSnapshot
 */
export async function pollObligationUntilPaid(obligationId, onSnapshot) {
  let lastSnapshot = null
  for (let attempt = 1; attempt <= PARENT_POLL_MAX_ATTEMPTS; attempt += 1) {
    try {
      const snap = await fetchObligationStatus(obligationId)
      lastSnapshot = snap
      onSnapshot?.(snap, attempt)
      if (snap?.paid === true) {
        clearPayNowLockout(obligationId)
        return { outcome: 'paid', latest: snap }
      }
    } catch (error) {
      onSnapshot?.({ error }, attempt)
    }
    if (attempt < PARENT_POLL_MAX_ATTEMPTS) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, PARENT_POLL_INTERVAL_MS))
    }
  }
  setPayNowLockout(obligationId)
  return { outcome: 'timeout', latest: lastSnapshot }
}

export default pollObligationUntilPaid
