import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { normalizeOnboardingDtoFromApi } from '../utils/onboardingSteps'

/** Reads normalized onboarding flags from persisted auth user (backend source of truth via login/me). */
export function useOnboardingFlags() {
  const user = useSelector((state) => state.auth.user)
  return useMemo(() => normalizeOnboardingDtoFromApi(user?.onboarding ?? null), [user?.onboarding])
}

export default useOnboardingFlags
