import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchParentAttendance,
  fetchParentDashboard,
  fetchParentFees,
  fetchParentNotifications,
  fetchParentSchedule,
} from '../slices/parentSlice'
import { selectParentHomeModel } from '../utils/homeSelectors'

export default function useParent() {
  const dispatch = useDispatch()
  const parent = useSelector((state) => state.parent)
  const homeModel = useSelector(selectParentHomeModel)

  const loadDashboard = useCallback(() => dispatch(fetchParentDashboard()), [dispatch])
  const loadSchedule = useCallback((params) => dispatch(fetchParentSchedule(params)), [dispatch])
  const loadAttendance = useCallback(
    (params) => dispatch(fetchParentAttendance(params)),
    [dispatch],
  )
  const loadFees = useCallback((params) => dispatch(fetchParentFees(params)), [dispatch])
  const loadNotifications = useCallback(
    (params) => dispatch(fetchParentNotifications(params)),
    [dispatch],
  )

  return {
    ...parent,
    homeModel,
    loadDashboard,
    loadSchedule,
    loadAttendance,
    loadFees,
    loadNotifications,
  }
}
