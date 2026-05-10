import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearStudentParentsActionError,
  clearStudentParentsSubmitState,
  fetchStudentParents,
  inviteStudentParent,
  resendStudentParentInvite,
  revokeStudentParentInvite,
  unlinkStudentParent,
} from '../slices/studentParentsSlice'

const EMPTY_ENTRY = { linked: [], invites: [], loading: false, error: null }

/**
 * Returns the per-student parents bundle plus stable action callbacks.
 *
 * Pages that consume this should pass the studentId; we keep the selector
 * narrow (only this student's slice) to avoid unrelated re-renders, and all
 * callbacks reference dispatch only so useEffect deps stay stable. Same
 * pattern as the payments pages — see notes in those files.
 */
export function useStudentParents(studentId) {
  const dispatch = useDispatch()
  const submit = useSelector((s) => s.studentParents.submit)
  const actionId = useSelector((s) => s.studentParents.actionId)
  const actionError = useSelector((s) => s.studentParents.actionError)
  const entry = useSelector((s) =>
    studentId ? s.studentParents.byStudent[studentId] || EMPTY_ENTRY : EMPTY_ENTRY,
  )

  const reload = useCallback(() => {
    if (!studentId) return undefined
    return dispatch(fetchStudentParents(studentId))
  }, [dispatch, studentId])

  const invite = useCallback(
    ({ email, name, expiresInDays } = {}) => {
      if (!studentId) return undefined
      return dispatch(inviteStudentParent({ studentId, email, name, expiresInDays }))
    },
    [dispatch, studentId],
  )

  const resend = useCallback(
    (inviteId, options = {}) => {
      if (!studentId || !inviteId) return undefined
      return dispatch(
        resendStudentParentInvite({
          studentId,
          inviteId,
          expiresInDays: options.expiresInDays,
        }),
      )
    },
    [dispatch, studentId],
  )

  const revoke = useCallback(
    (inviteId) => {
      if (!studentId || !inviteId) return undefined
      return dispatch(revokeStudentParentInvite({ studentId, inviteId }))
    },
    [dispatch, studentId],
  )

  const unlink = useCallback(
    (parentUserId) => {
      if (!studentId || !parentUserId) return undefined
      return dispatch(unlinkStudentParent({ studentId, parentUserId }))
    },
    [dispatch, studentId],
  )

  const clearSubmit = useCallback(() => dispatch(clearStudentParentsSubmitState()), [dispatch])
  const clearActionError = useCallback(() => dispatch(clearStudentParentsActionError()), [dispatch])

  return useMemo(
    () => ({
      linked: entry.linked,
      invites: entry.invites,
      loading: entry.loading,
      error: entry.error,
      submit,
      actionId,
      actionError,
      reload,
      invite,
      resend,
      revoke,
      unlink,
      clearSubmit,
      clearActionError,
    }),
    [
      entry,
      submit,
      actionId,
      actionError,
      reload,
      invite,
      resend,
      revoke,
      unlink,
      clearSubmit,
      clearActionError,
    ],
  )
}

export default useStudentParents
