/** @typedef {'bank'|'upi'} PayoutMethod */

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/
const UPI_VPA_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/

/**
 * @param {object|null|undefined} server — saved bank_account row
 * @returns {PayoutMethod}
 */
export function inferPayoutMethodFromServer(server) {
  if (!server) return 'bank'
  const hasUpi = String(server.upi_id || '').trim().length > 0
  const hasBank = Boolean(server.account_number_last4 || server.ifsc_code)
  if (hasUpi && !hasBank) return 'upi'
  if (hasBank && !hasUpi) return 'bank'
  if (hasUpi && hasBank) return 'upi'
  return 'bank'
}

/**
 * @param {PayoutMethod} method
 * @param {object} form
 * @param {object|null} server
 * @returns {string|null} error message
 */
export function validatePayoutForm(method, form, server) {
  const upi = String(form.upi_id || '').trim()
  if (method === 'upi') {
    if (!upi) return 'Enter your UPI ID (e.g. academy@okhdfcbank).'
    if (!UPI_VPA_RE.test(upi)) return 'UPI ID must look like name@bank.'
    return null
  }

  const holder = String(form.account_holder_name || '').trim()
  const bank = String(form.bank_name || '').trim()
  const ifsc = String(form.ifsc_code || '').trim().toUpperCase()
  const acn = String(form.account_number || '').replace(/\s+/g, '')
  const hasStored = Boolean(server?.account_number_last4)

  if (!holder) return 'Account holder name is required for bank payout.'
  if (!bank) return 'Bank name is required for bank payout.'
  if (!ifsc) return 'IFSC is required for bank payout.'
  if (ifsc && !IFSC_RE.test(ifsc)) return 'IFSC must be 11 characters (e.g. HDFC0001234).'
  if (!acn && !hasStored) return 'Account number is required for bank payout.'
  if (acn && !/^[0-9]{6,20}$/.test(acn)) return 'Account number must be 6–20 digits.'
  return null
}

/**
 * @param {PayoutMethod} method
 * @param {object} form
 * @param {object|null} server
 */
export function buildPayoutSavePayload(method, form, server) {
  if (method === 'upi') {
    return {
      account_holder_name: form.account_holder_name?.trim() || null,
      bank_name: null,
      account_number: null,
      ifsc_code: null,
      upi_id: form.upi_id?.trim() || null,
    }
  }
  return {
    account_holder_name: form.account_holder_name?.trim() || null,
    bank_name: form.bank_name?.trim() || null,
    account_number: form.account_number?.trim() || null,
    ifsc_code: form.ifsc_code ? form.ifsc_code.trim().toUpperCase() : null,
    upi_id: null,
  }
}
