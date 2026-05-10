/**
 * Maps backend error codes from onboarding routes to operator-friendly copy.
 * Raw codes still available on the normalized error object.
 */

export function friendlyOnboardingSetupError(code, fallbackMessage = 'Something went wrong. Try again.') {
  const c = String(code || '').toUpperCase()
  switch (c) {
    case 'AUTOMATED_NOT_AVAILABLE':
      return 'Online payments are not available right now. Choose manual fee tracking or ask your host to configure Razorpay.'
    case 'AUTOMATED_RAZORPAY_NOT_CONFIGURED':
      return 'Online checkout is not configured on the server yet. Use manual payments or contact support.'
    case 'INVALID_UPI_VPA':
      return 'Enter a valid UPI ID (for example name@paytm).'
    case 'PAYMENT_MODULE_LOCKED':
      return 'Payment settings are locked for your academy. Contact support if you need to change them.'
    default:
      break
  }
  if (String(code || '').toLowerCase().includes('upivpa')) {
    return 'Enter your academy UPI ID to receive manual payments.'
  }
  return fallbackMessage
}
