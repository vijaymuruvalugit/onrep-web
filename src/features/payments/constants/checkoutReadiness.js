/**
 * Frontend mirror of `ezyplay-backend/src/services/checkoutReadiness.js`
 * `CHECKOUT_READINESS_REASONS`.
 *
 * Keep this file in sync with the backend constants. The UI switches on the
 * codes (not on free-text strings) to render copy and CTAs. Adding a new code
 * here without adding it to the backend is a bug — and vice versa.
 */

export const CHECKOUT_READINESS_REASONS = Object.freeze({
  PAYMENTS_DISABLED: 'PAYMENTS_DISABLED',
  NO_BANK_ACCOUNT: 'NO_BANK_ACCOUNT',
  BANK_ACCOUNT_UNVERIFIED: 'BANK_ACCOUNT_UNVERIFIED',
  NO_LIVE_KEYS: 'NO_LIVE_KEYS',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  MISSING_UPI_OR_VPA: 'MISSING_UPI_OR_VPA',
  WEBHOOK_NOT_CONFIGURED: 'WEBHOOK_NOT_CONFIGURED',
})

const COPY = {
  [CHECKOUT_READINESS_REASONS.PAYMENTS_DISABLED]: {
    title: 'Online payments are turned off',
    detail: 'Toggle "Accept online payments" in Payment settings to allow parents to pay online.',
  },
  [CHECKOUT_READINESS_REASONS.NO_BANK_ACCOUNT]: {
    title: 'Bank account not added',
    detail: 'Add your payout details. Settlement requires a verified bank account or UPI ID.',
  },
  [CHECKOUT_READINESS_REASONS.BANK_ACCOUNT_UNVERIFIED]: {
    title: 'Bank account not yet verified',
    detail: 'Our team will verify your payout details soon. You will be notified once verified.',
  },
  [CHECKOUT_READINESS_REASONS.NO_LIVE_KEYS]: {
    title: 'Online checkout temporarily unavailable',
    detail: 'OnRep is finishing the setup on our side. Contact OnRep support if this persists.',
  },
  [CHECKOUT_READINESS_REASONS.SUBSCRIPTION_INACTIVE]: {
    title: 'Subscription not active',
    detail: 'Renew your OnRep subscription to continue collecting parent payments.',
  },
  [CHECKOUT_READINESS_REASONS.MISSING_UPI_OR_VPA]: {
    title: 'UPI ID missing',
    detail: 'Add a UPI ID (VPA) in Payment settings so parents can pay via UPI.',
  },
  [CHECKOUT_READINESS_REASONS.WEBHOOK_NOT_CONFIGURED]: {
    title: 'Payment webhooks not configured',
    detail: 'Internal configuration error — please contact OnRep support.',
  },
}

export function copyForReason(code) {
  return (
    COPY[code] || {
      title: 'Online payments unavailable',
      detail: 'Please contact OnRep support.',
    }
  )
}
