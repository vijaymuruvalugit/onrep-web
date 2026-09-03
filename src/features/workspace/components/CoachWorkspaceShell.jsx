import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { bootstrapWorkspace } from '../slices/workspaceSlice'
import { useCoachLikeRole } from '../hooks/useCoachLikeRole'
import { hasAcademyAdminMembership } from '../../auth/utils/academyAdminAccess'
import {
  coachPathRequiresWorkspace,
  onboardingPathExemptFromWorkspace,
} from '../../../core/routeClassification'
import { WorkspaceMultiTabSync } from './WorkspaceMultiTabSync'
import WorkspaceFaultBanner from './WorkspaceFaultBanner'
import WorkspaceSelectionGate from './WorkspaceSelectionGate'
import ActivityThemeSync from './ActivityThemeSync'

/**
 * Coach/owner operational workspace: bootstrap activities, gate selection, multi-tab sync.
 */
export default function CoachWorkspaceShell({ children }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const coachLike = useCoachLikeRole(user)
  const { bootstrapComplete, status, activities, activeActivityId, workspaceFault } = useSelector(
    (state) => state.workspace,
  )

  useEffect(() => {
    if (!isAuthenticated || !coachLike) return
    if (!bootstrapComplete && status === 'idle') {
      dispatch(bootstrapWorkspace())
    }
  }, [isAuthenticated, coachLike, bootstrapComplete, status, dispatch])

  if (!isAuthenticated || !coachLike) {
    return children
  }

  const path = location.pathname
  // Block rendering until bootstrap is done so API calls never fire with a null activityId.
  if (status === 'loading') return null

  const needsGate =
    coachPathRequiresWorkspace(path) &&
    !onboardingPathExemptFromWorkspace(path) &&
    bootstrapComplete &&
    status === 'succeeded'

  // Academy admins with zero activities still need the dashboard launch guide
  // (enable-activity CTA). Coaches without admin stay on the empty gate.
  const skipEmptyActivityGate = activities.length === 0 && hasAcademyAdminMembership(user)
  const mustPickWorkspace =
    needsGate &&
    !workspaceFault &&
    !skipEmptyActivityGate &&
    (activities.length === 0 || (activities.length > 1 && !activeActivityId))

  return (
    <>
      <ActivityThemeSync />
      <WorkspaceMultiTabSync />
      <WorkspaceFaultBanner />
      {mustPickWorkspace ? (
        <div className="py-4 px-3">
          <WorkspaceSelectionGate />
        </div>
      ) : (
        children
      )}
    </>
  )
}
