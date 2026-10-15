import { coachObligationBadges } from './coachObligationBadges'

describe('coachObligationBadges', () => {
  it('shows a waived charge as waived even when no cash was collected', () => {
    const badges = coachObligationBadges({
      payment_status: 'WAIVED',
      fee_state: 'waived',
      amount_due: '4000.00',
      amount_paid: '0.00',
      cash_collected: '0.00',
      outstanding_amount: '0.00',
      waived_amount: '4000.00',
    })
    expect(badges.map((b) => b.text)).toEqual(['Waived'])
  })

  it('does not treat collected cash as a waiver', () => {
    const badges = coachObligationBadges({
      fee_state: 'paid',
      amount_due: '4000.00',
      cash_collected: '4000.00',
      outstanding_amount: '0.00',
      waived_amount: '0.00',
    })
    expect(badges.map((b) => b.text)).toContain('Paid manually')
  })
})
