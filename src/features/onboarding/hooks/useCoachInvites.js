import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearCoachAdminActionError,
  clearCoachInviteRevokeError,
  clearCoachInviteSubmitState,
  createCoachInvite,
  fetchAcademyStaff,
  fetchCoachInvites,
  grantCoachAdminThunk,
  revokeCoachAdminThunk,
  revokeCoachInviteThunk,
  resendCoachInviteThunk,
  clearCoachInviteResendState,
} from '../slices/coachInvitesSlice'

export function useCoachInvites() {
  const dispatch = useDispatch()
  const state = useSelector((s) => s.coachInvites)

  const load = useCallback(() => dispatch(fetchCoachInvites()), [dispatch])
  const loadStaff = useCallback(() => dispatch(fetchAcademyStaff()), [dispatch])
  const grantAdmin = useCallback((userId) => dispatch(grantCoachAdminThunk(userId)), [dispatch])
  const revokeAdmin = useCallback((userId) => dispatch(revokeCoachAdminThunk(userId)), [dispatch])
  const invite = useCallback((payload) => dispatch(createCoachInvite(payload)), [dispatch])
  const revoke = useCallback((userId) => dispatch(revokeCoachInviteThunk(userId)), [dispatch])
  const resend = useCallback((userId) => dispatch(resendCoachInviteThunk(userId)), [dispatch])
  const clearSubmit = useCallback(() => dispatch(clearCoachInviteSubmitState()), [dispatch])
  const clearRevokeError = useCallback(() => dispatch(clearCoachInviteRevokeError()), [dispatch])
  const clearResendState = useCallback(() => dispatch(clearCoachInviteResendState()), [dispatch])
  const clearAdminError = useCallback(() => dispatch(clearCoachAdminActionError()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      loadCoachInvites: load,
      loadAcademyStaff: loadStaff,
      sendCoachInvite: invite,
      revokeCoachInvite: revoke,
      resendCoachInvite: resend,
      grantCoachAdmin: grantAdmin,
      revokeCoachAdmin: revokeAdmin,
      clearSubmitState: clearSubmit,
      clearRevokeError,
      clearResendState,
      clearAdminActionError: clearAdminError,
    }),
    [
      state,
      load,
      loadStaff,
      invite,
      revoke,
      resend,
      grantAdmin,
      revokeAdmin,
      clearSubmit,
      clearRevokeError,
      clearResendState,
      clearAdminError,
    ],
  )
}

export default useCoachInvites
