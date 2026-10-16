import React, { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'
import operationalSessionsApi from '../../../domain/operationalSessions/operationalSessionsApi'
import {
  sessionOpensSkatingLiveTools,
  sessionWorkspacePath,
} from '../../../domain/operationalSessions/helpers/sessionEffectiveSkating'

/**
 * Canonical deep link `/coach/ops/sessions/:sessionId`.
 * Routes by session-effective capability (modules ∩ stamp), not activity type alone.
 * Skating-eligible → live floor; otherwise Core schedule drawer (openSession query).
 */
export default function CoachOpsSessionRedirectPage() {
  const { sessionId } = useParams()
  const modules = useSelector((s) => s.auth?.user?.modules)
  const [target, setTarget] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!sessionId) {
      setTarget('/coach/schedule')
      return undefined
    }
    ;(async () => {
      try {
        const session = await operationalSessionsApi.getSession(sessionId)
        if (cancelled) return
        const opensSkatingLive = sessionOpensSkatingLiveTools({
          modules,
          session,
          activityType: session?.activityType,
        })
        if (opensSkatingLive) {
          setTarget(sessionWorkspacePath(sessionId, { opensSkatingLive: true }))
        } else {
          setTarget(
            `/coach/schedule?openSession=${encodeURIComponent(String(sessionId))}`,
          )
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not load session')
          setTarget('/coach/schedule')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId, modules])

  if (!target) {
    return (
      <div className="p-4 d-flex align-items-center gap-2" role="status">
        <CSpinner size="sm" />
        <span className="small text-body-secondary">Opening session…</span>
        {error ? <span className="small text-danger">{error}</span> : null}
      </div>
    )
  }

  return <Navigate to={target} replace />
}
