/**
 * Display helpers for platform billing. Access decisions stay on
 * `subscription.can_access_app` — these helpers are copy and CTAs only.
 */

import {
  hasAcademyAdminCapability,
  hasAcademyAdminMembership,
  isLegalAcademyOwner,
} from '../../auth/utils/academyAdminAccess'

export function subscriptionFromUser(user) {
  return user?.subscription && typeof user.subscription === 'object' ? user.subscription : null
}

export function subscriptionState(subscription) {
  return String(subscription?.state || '').toUpperCase()
}

export function isTrialingSubscription(subscription) {
  return subscriptionState(subscription) === 'TRIALING'
}

export function canManagePlatformBilling(user) {
  return (
    isLegalAcademyOwner(user) ||
    hasAcademyAdminMembership(user) ||
    hasAcademyAdminCapability(user)
  )
}

export function shouldShowTrialConvertBanner(user) {
  return canManagePlatformBilling(user) && isTrialingSubscription(subscriptionFromUser(user))
}

export function getPlanCheckoutLabel({ isCurrentPlan, subscription }) {
  if (isTrialingSubscription(subscription)) return 'Subscribe now'
  if (isCurrentPlan) return 'Renew'
  return 'Switch plan'
}

export function getBillingBannerKind(subscription) {
  const state = subscriptionState(subscription)
  if (state === 'ACTIVE') return 'active'
  if (state === 'TRIALING') return 'trial'
  if (state === 'PAST_DUE') return 'grace'
  if (state === 'CANCELLED') return 'cancelled'
  return 'expired'
}
