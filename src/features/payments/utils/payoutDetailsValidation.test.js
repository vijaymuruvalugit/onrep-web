import { describe, expect, it } from 'vitest'
import { inferPayoutMethodFromServer, validatePayoutForm } from './payoutDetailsValidation'

describe('payoutDetailsValidation', () => {
  it('infers UPI when only upi on server', () => {
    expect(inferPayoutMethodFromServer({ upi_id: 'a@b' })).toBe('upi')
  })

  it('allows UPI-only save validation', () => {
    expect(
      validatePayoutForm('upi', { upi_id: 'academy@okhdfcbank', account_holder_name: '' }, null),
    ).toBeNull()
  })

  it('allows UPI with optional holder name', () => {
    expect(
      validatePayoutForm(
        'upi',
        { upi_id: '9606309303@ybl', account_holder_name: 'Vijay Muruvalu' },
        null,
      ),
    ).toBeNull()
  })

  it('rejects empty UPI path', () => {
    expect(validatePayoutForm('upi', { upi_id: '' }, null)).toMatch(/UPI ID/)
  })
})
