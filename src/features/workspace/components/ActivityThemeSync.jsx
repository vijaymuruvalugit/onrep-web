import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useCoachLikeRole } from '../hooks/useCoachLikeRole'
import { resolveActivityThemeKey } from '../../../core/activityWorkspace/activityTheme'

/**
 * Syncs document root with the active activity workspace type so CSS can tune
 * accent (--onrep-hero-accent) per vertical (skating / music / yoga / default).
 */
export default function ActivityThemeSync() {
  const user = useSelector((s) => s.auth.user)
  const coachLike = useCoachLikeRole(user)
  const activities = useSelector((s) => s.workspace.activities)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)

  useEffect(() => {
    const root = document.documentElement
    if (!coachLike) {
      root.removeAttribute('data-onrep-activity')
      return undefined
    }

    const active = activities.find((a) => String(a.id) === String(activeActivityId))
    const key = resolveActivityThemeKey(active?.type)
    root.setAttribute('data-onrep-activity', key)

    return () => {
      root.removeAttribute('data-onrep-activity')
    }
  }, [coachLike, activities, activeActivityId])

  return null
}
