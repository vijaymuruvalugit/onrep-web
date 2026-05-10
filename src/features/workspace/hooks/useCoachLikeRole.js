import { normalizeAppRole } from '../../../navigation'

export function useCoachLikeRole(user) {
  const r = normalizeAppRole(user?.role)
  return r === 'coach' || r === 'admin' || r === 'academy_owner'
}
