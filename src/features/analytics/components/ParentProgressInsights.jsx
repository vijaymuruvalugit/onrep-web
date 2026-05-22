import React, { useEffect, useState } from 'react'
import { CAlert, CSpinner } from '@coreui/react'

import analyticsApi from '../api/analyticsApi'

/**
 * Narrative-first progress summaries for parent child overview.
 */
const ParentProgressInsights = ({ studentId }) => {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await analyticsApi.getParentProgress(studentId ? { studentId } : {})
        if (!cancelled) setProgress(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading) return <CSpinner size="sm" />
  if (error) {
    return (
      <CAlert color="warning" className="py-2 small mb-0">
        {error.message || 'Progress summary unavailable.'}
      </CAlert>
    )
  }

  const child = progress?.children?.[0]
  if (!child) return null

  return (
    <div className="small">
      {child.narrative?.attendance ? <p className="mb-2">{child.narrative.attendance}</p> : null}
      {child.narrative?.streak ? (
        <p className="mb-2 text-body-secondary">{child.narrative.streak}</p>
      ) : null}
      {child.narrative?.focus ? <p className="mb-0 fw-semibold">{child.narrative.focus}</p> : null}
      {(child.recentImprovements || []).length > 0 ? (
        <div className="mt-2 p-2 bg-body-tertiary rounded">
          {(child.recentImprovements || []).slice(0, 2).map((imp, i) => (
            <div key={i}>{imp.text || imp}</div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ParentProgressInsights
