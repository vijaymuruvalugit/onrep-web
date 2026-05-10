import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearCoachParentsActionError,
  fetchCoachParentsOverview,
  resendCoachParentInvite,
  revokeCoachParentInvite,
} from '../slices/coachParentsSlice'

export function useCoachParents() {
  const dispatch = useDispatch()
  const state = useSelector((s) => s.coachParents)

  const load = useCallback((params) => dispatch(fetchCoachParentsOverview(params)), [dispatch])
  const resend = useCallback(
    (inviteId, expiresInDays) => dispatch(resendCoachParentInvite({ inviteId, expiresInDays })),
    [dispatch],
  )
  const revoke = useCallback((inviteId) => dispatch(revokeCoachParentInvite(inviteId)), [dispatch])
  const clearActionError = useCallback(() => dispatch(clearCoachParentsActionError()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      loadParentsOverview: load,
      resendInvite: resend,
      revokeInvite: revoke,
      clearActionError,
    }),
    [state, load, resend, revoke, clearActionError],
  )
}

export default useCoachParents
