import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearCoachInviteRevokeError,
  clearCoachInviteSubmitState,
  createCoachInvite,
  fetchCoachInvites,
  revokeCoachInviteThunk,
} from '../slices/coachInvitesSlice'

export function useCoachInvites() {
  const dispatch = useDispatch()
  const state = useSelector((s) => s.coachInvites)

  const load = useCallback(() => dispatch(fetchCoachInvites()), [dispatch])
  const invite = useCallback((payload) => dispatch(createCoachInvite(payload)), [dispatch])
  const revoke = useCallback((userId) => dispatch(revokeCoachInviteThunk(userId)), [dispatch])
  const clearSubmit = useCallback(() => dispatch(clearCoachInviteSubmitState()), [dispatch])
  const clearRevokeError = useCallback(() => dispatch(clearCoachInviteRevokeError()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      loadCoachInvites: load,
      sendCoachInvite: invite,
      revokeCoachInvite: revoke,
      clearSubmitState: clearSubmit,
      clearRevokeError,
    }),
    [state, load, invite, revoke, clearSubmit, clearRevokeError],
  )
}

export default useCoachInvites
