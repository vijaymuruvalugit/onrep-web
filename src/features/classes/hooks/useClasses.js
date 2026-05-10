import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchClassRoster,
  fetchPastSessions,
  fetchTodayClasses,
  fetchUpcomingClasses,
} from '../slices/classesSlice'

export function useClasses() {
  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState.classes)
  const loadTodayClasses = useCallback(() => dispatch(fetchTodayClasses()), [dispatch])
  const loadUpcomingClasses = useCallback(
    (params) => dispatch(fetchUpcomingClasses(params)),
    [dispatch],
  )
  const loadPastSessions = useCallback(
    (opts) => dispatch(fetchPastSessions(opts)),
    [dispatch],
  )
  const loadClassRoster = useCallback((classId) => dispatch(fetchClassRoster(classId)), [dispatch])

  return useMemo(
    () => ({
      ...state,
      fetchTodayClasses: loadTodayClasses,
      fetchUpcomingClasses: loadUpcomingClasses,
      fetchPastSessions: loadPastSessions,
      fetchClassRoster: loadClassRoster,
    }),
    [state, loadTodayClasses, loadUpcomingClasses, loadPastSessions, loadClassRoster],
  )
}

export default useClasses
