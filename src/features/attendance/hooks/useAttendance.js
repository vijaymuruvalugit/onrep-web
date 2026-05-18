import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAttendanceRoster,
  resetAttendanceState,
  saveAttendance,
  setAttendanceMark,
} from '../slices/attendanceSlice'

export function useAttendance() {
  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState.attendance)
  const fetchRoster = useCallback((classId) => dispatch(fetchAttendanceRoster(classId)), [dispatch])
  const setMark = useCallback((payload) => dispatch(setAttendanceMark(payload)), [dispatch])
  const save = useCallback(
    (classId, marks) => dispatch(saveAttendance({ classId, marks })),
    [dispatch],
  )
  const reset = useCallback(() => dispatch(resetAttendanceState()), [dispatch])

  return useMemo(
    () => ({
      ...state,
      fetchRoster,
      setMark,
      save,
      reset,
      canMark: state.attendanceEligible,
    }),
    [state, fetchRoster, setMark, save, reset],
  )
}

export default useAttendance
