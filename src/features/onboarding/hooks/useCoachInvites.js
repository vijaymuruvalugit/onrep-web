import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearCoachInviteRevokeError,
  clearCoachInviteSubmitState,
  createCoachInvite,
  fetchCoachInvites,
  revokeCoachInviteThunk,
  resendCoachInviteThunk,
  clearCoachInviteResendState,
} from '../slices/coachInvitesSlice'

export function useCoachInvites() {
  const dispatch = useDispatch()
  const state = useSelector((s) => s.coachInvites)

  const load = useCallback(() => dispatch(fetchCoachInvites()), [dispatch])
  const invite = useCallback((payload) => dispatch(createCoachInvite(payload)), [dispatch])
  const revoke = useCallback((userId) => dispatch(revokeCoachInviteThunk(userId)), [dispatch])
  const resend = useCallback((userId) => dispatch(resendCoachInviteThunk(userId)), [dispatch])
  const clearSubmit = useCallback(() => dispatch(clearCoachInviteSubmitState()), [dispatch])
  const clearRevokeError = useCallback(() => dispatch(clearCoachInviteRevokeError()), [dispatch])
  const clearResendState = useCallback(() => dispatch(clearCoachInviteResendState()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      loadCoachInvites: load,
      sendCoachInvite: invite,
      revokeCoachInvite: revoke,
      resendCoachInvite: resend,
      clearSubmitState: clearSubmit,
      clearRevokeError,
      clearResendState,
    }),
    [state, load, invite, revoke, resend, clearSubmit, clearRevokeError, clearResendState],
  )
}

export default useCoachInvites
