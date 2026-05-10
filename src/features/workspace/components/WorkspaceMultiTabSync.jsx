import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  ONREP_ACTIVE_ACTIVITY_STORAGE_KEY,
  readPersistedActivityId,
  subscribeWorkspaceBroadcast,
} from '../../../core/activityWorkspace/workspacePersistence'
import { applyExternalPersistedWorkspace } from '../slices/workspaceSlice'

/**
 * Keeps workspace partition consistent across browser tabs (storage + BroadcastChannel).
 */
export function WorkspaceMultiTabSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    const offBc = subscribeWorkspaceBroadcast((activityId) => {
      dispatch(applyExternalPersistedWorkspace(activityId))
    })

    const onStorage = (ev) => {
      if (ev.key !== ONREP_ACTIVE_ACTIVITY_STORAGE_KEY) return
      const next = ev.newValue
      dispatch(applyExternalPersistedWorkspace(next))
    }
    window.addEventListener('storage', onStorage)

    return () => {
      offBc()
      window.removeEventListener('storage', onStorage)
    }
  }, [dispatch])

  useEffect(() => {
    const onStorage = () => {
      const v = readPersistedActivityId()
      dispatch(applyExternalPersistedWorkspace(v))
    }
    window.addEventListener('focus', onStorage)
    return () => window.removeEventListener('focus', onStorage)
  }, [dispatch])

  return null
}
