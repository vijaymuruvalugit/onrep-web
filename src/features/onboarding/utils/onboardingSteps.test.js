import { describe, expect, it } from 'vitest'

import {
  normalizeLegacyOnboardingCurrentStep,
  normalizeOnboardingDtoFromApi,
  isFeeCollectionConfigured,
  OnboardingStep,
} from './onboardingSteps'

describe('onboardingSteps', () => {
  it('normalizes legacy COMPLETE / FIRST_PAYMENT step names', () => {
    expect(normalizeLegacyOnboardingCurrentStep('COMPLETE')).toBe(OnboardingStep.ONBOARDING_COMPLETED)
    expect(normalizeLegacyOnboardingCurrentStep('FIRST_PAYMENT')).toBe(OnboardingStep.FIRST_PARENT_PAYMENT)
    expect(normalizeLegacyOnboardingCurrentStep('GETTING_STARTED')).toBe('GETTING_STARTED')
  })

  it('normalizes onboarding DTO current_step', () => {
    const dto = normalizeOnboardingDtoFromApi({
      current_step: 'COMPLETE',
      payment_module_selected: true,
    })
    expect(dto.current_step).toBe(OnboardingStep.ONBOARDING_COMPLETED)
  })

  it('detects fee collection configured from flags', () => {
    expect(isFeeCollectionConfigured({ payment_module_selected: true, payment_setup_done: true })).toBe(true)
    expect(isFeeCollectionConfigured({ payment_module_selected: false, payment_setup_done: true })).toBe(false)
  })
})
