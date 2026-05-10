import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearScheduleErrors,
  createSchedule,
  fetchSchedule,
  regenerateClasses,
} from '../slices/scheduleSlice'

export function useSchedule() {
  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState.schedule)
  const loadSchedule = useCallback((batchId) => dispatch(fetchSchedule(batchId)), [dispatch])
  const addSchedule = useCallback((payload) => dispatch(createSchedule(payload)), [dispatch])
  const generateClasses = useCallback((payload) => dispatch(regenerateClasses(payload)), [dispatch])
  const clearErrors = useCallback(() => dispatch(clearScheduleErrors()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      fetchSchedule: loadSchedule,
      createSchedule: addSchedule,
      regenerateClasses: generateClasses,
      clearErrors,
    }),
    [state, loadSchedule, addSchedule, generateClasses, clearErrors],
  )
}

export default useSchedule
