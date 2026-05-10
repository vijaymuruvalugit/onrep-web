/** Mirrors backend / ezyplay-frontend onboarding step enums for client checks. */

export const OnboardingStep = {
  PAYMENT_MODULE: 'PAYMENT_MODULE',
  PAYMENT_SETUP: 'PAYMENT_SETUP',
  INVITE_COACH: 'INVITE_COACH',
  INVITE_PARENT: 'INVITE_PARENT',
  FIRST_PARENT_PAYMENT: 'FIRST_PARENT_PAYMENT',
  GETTING_STARTED: 'GETTING_STARTED',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
}

export function normalizeLegacyOnboardingCurrentStep(step) {
  if (step === 'COMPLETE') return OnboardingStep.ONBOARDING_COMPLETED
  if (step === 'FIRST_PAYMENT') return OnboardingStep.FIRST_PARENT_PAYMENT
  return step
}

/** Normalize onboarding DTO from /auth/me, /login, /onboarding/status. */
export function normalizeOnboardingDtoFromApi(raw) {
  if (raw == null || typeof raw !== 'object') return raw
  return {
    ...raw,
    current_step: normalizeLegacyOnboardingCurrentStep(raw.current_step),
  }
}

/** Fee collection UX: module picked + setup saved (matches legacy RN FeeCollectionSetupScreen). */
export function isFeeCollectionConfigured(onboarding) {
  return !!(onboarding?.payment_module_selected && onboarding?.payment_setup_done)
}
