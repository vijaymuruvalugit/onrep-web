/** India-first phone helpers. Country code is fixed to +91 for now. */

export const DEFAULT_INDIA_COUNTRY_CODE = '+91'
export const INDIA_LOCAL_DIGIT_COUNT = 10

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

/**
 * Normalize pasted/typed input to 10 local digits when possible.
 * Accepts local `98765…`, `098765…`, or full `9198765…` / `+91…`.
 */
export function normalizeIndiaLocalDigits(value) {
  let digits = digitsOnly(value)
  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  if (digits.length > INDIA_LOCAL_DIGIT_COUNT) {
    digits = digits.slice(0, INDIA_LOCAL_DIGIT_COUNT)
  }
  return digits
}

export function isValidIndiaLocal(value) {
  return normalizeIndiaLocalDigits(value).length === INDIA_LOCAL_DIGIT_COUNT
}

/**
 * @returns {string|null} E.164 like +919876543210, or null if invalid
 */
export function toE164India(localOrFull, countryCode = DEFAULT_INDIA_COUNTRY_CODE) {
  const local = normalizeIndiaLocalDigits(localOrFull)
  if (local.length !== INDIA_LOCAL_DIGIT_COUNT) return null
  const cc = digitsOnly(countryCode) || '91'
  return `+${cc}${local}`
}
