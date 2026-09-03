import { describe, expect, it } from 'vitest'
import {
  canManagePlatformBilling,
  getBillingBannerKind,
  getPlanCheckoutLabel,
  isTrialingSubscription,
  shouldShowTrialConvertBanner,
  subscriptionFromUser,
} from './billingSubscriptionUi'

describe('billingSubscriptionUi', () => {
  it('reads subscription from the /auth/me user shape', () => {
    expect(subscriptionFromUser({ subscription: { state: 'TRIALING' } }).state).toBe('TRIALING')
    expect(subscriptionFromUser({ subscription_status: 'TRIAL' })).toBe(null)
  })

  it('treats TRIALING as the in-trial convert state', () => {
    expect(isTrialingSubscription({ state: 'TRIALING' })).toBe(true)
    expect(isTrialingSubscription({ state: 'ACTIVE' })).toBe(false)
    expect(isTrialingSubscription({ trial_active: true })).toBe(false)
  })

  it('shows Subscribe now on every plan while trialing', () => {
    const sub = { state: 'TRIALING' }
    expect(getPlanCheckoutLabel({ isCurrentPlan: false, subscription: sub })).toBe('Subscribe now')
    expect(getPlanCheckoutLabel({ isCurrentPlan: true, subscription: sub })).toBe('Subscribe now')
  })

  it('keeps Renew / Switch plan after the academy is paid', () => {
    const sub = { state: 'ACTIVE' }
    expect(getPlanCheckoutLabel({ isCurrentPlan: true, subscription: sub })).toBe('Renew')
    expect(getPlanCheckoutLabel({ isCurrentPlan: false, subscription: sub })).toBe('Switch plan')
  })

  it('classifies banner kind from canonical state', () => {
    expect(getBillingBannerKind({ state: 'TRIALING' })).toBe('trial')
    expect(getBillingBannerKind({ state: 'ACTIVE' })).toBe('active')
    expect(getBillingBannerKind({ state: 'PAST_DUE' })).toBe('grace')
    expect(getBillingBannerKind({ state: 'TRIAL_EXPIRED' })).toBe('expired')
  })

  it('offers trial convert only to academy admins still on trial', () => {
    expect(
      shouldShowTrialConvertBanner({
        is_legal_owner: true,
        subscription: { state: 'TRIALING', can_access_app: true },
      }),
    ).toBe(true)
    expect(
      shouldShowTrialConvertBanner({
        memberships: [{ role: 'academy_admin', status: 'active' }],
        subscription: { state: 'TRIALING' },
      }),
    ).toBe(true)
    expect(
      shouldShowTrialConvertBanner({
        is_legal_owner: true,
        subscription: { state: 'ACTIVE' },
      }),
    ).toBe(false)
    expect(
      shouldShowTrialConvertBanner({
        roles: ['coach'],
        subscription: { state: 'TRIALING' },
      }),
    ).toBe(false)
    expect(canManagePlatformBilling({ is_legal_owner: true })).toBe(true)
  })
})
