import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearScheduleErrors,
  createSchedule,
  deactivatePattern,
  fetchSchedule,
  updatePattern,
} from '../slices/scheduleSlice'

export function useSchedule() {
  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState.schedule)
  const loadSchedule = useCallback((batchId) => dispatch(fetchSchedule(batchId)), [dispatch])
  const addSchedule = useCallback((payload) => dispatch(createSchedule(payload)), [dispatch])
  const editPattern = useCallback((payload) => dispatch(updatePattern(payload)), [dispatch])
  const disablePattern = useCallback((payload) => dispatch(deactivatePattern(payload)), [dispatch])
  const clearErrors = useCallback(() => dispatch(clearScheduleErrors()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      fetchSchedule: loadSchedule,
      createSchedule: addSchedule,
      updatePattern: editPattern,
      deactivatePattern: disablePattern,
      clearErrors,
    }),
    [state, loadSchedule, addSchedule, editPattern, disablePattern, clearErrors],
  )
}

export default useSchedule
