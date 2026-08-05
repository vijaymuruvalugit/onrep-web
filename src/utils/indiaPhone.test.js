import {
  isValidIndiaLocal,
  normalizeIndiaLocalDigits,
  toE164India,
} from './indiaPhone'

describe('indiaPhone', () => {
  test('normalizes local digits and strips non-digits', () => {
    expect(normalizeIndiaLocalDigits('98765 43210')).toBe('9876543210')
    expect(normalizeIndiaLocalDigits('09876543210')).toBe('9876543210')
    expect(normalizeIndiaLocalDigits('+91 98765 43210')).toBe('9876543210')
    expect(normalizeIndiaLocalDigits('919876543210')).toBe('9876543210')
  })

  test('toE164India builds +91 E.164', () => {
    expect(toE164India('9876543210')).toBe('+919876543210')
    expect(toE164India('+91 98765 43210')).toBe('+919876543210')
    expect(toE164India('123')).toBeNull()
  })

  test('isValidIndiaLocal requires 10 digits', () => {
    expect(isValidIndiaLocal('9876543210')).toBe(true)
    expect(isValidIndiaLocal('98765')).toBe(false)
  })
})
