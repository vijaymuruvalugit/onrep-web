import React, { useEffect, useState } from 'react'
import { CAlert, CSpinner } from '@coreui/react'

import analyticsApi from '../api/analyticsApi'
import { InsightBarChart } from './InsightChartCard'

/**
 * Motivational progress cues for student home — narrative-first.
 */
const StudentMotivationInsights = () => {
  const [motivation, setMotivation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await analyticsApi.getStudentMotivation()
        if (!cancelled) setMotivation(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <CSpinner size="sm" className="mb-3" />
  if (error) {
    return (
      <CAlert color="warning" className="py-2 small">
        {error.message || 'Could not load progress highlights.'}
      </CAlert>
    )
  }
  if (!motivation) return null

  const sessionsAttended = Number(motivation.sessionsAttended || 0)
  const streakDays = Number(motivation.participationStreak || 0)

  return (
    <div className="mb-3 p-3 bg-body-tertiary rounded">
      {motivation.narrative ? <p className="fw-semibold mb-0">{motivation.narrative}</p> : null}
      {sessionsAttended > 0 || streakDays > 0 ? (
        <div className="mt-2" style={{ height: 140 }}>
          <InsightBarChart
            labels={['Sessions attended', 'Consistency streak']}
            values={[sessionsAttended, streakDays]}
            label="Count"
            horizontal
          />
        </div>
      ) : null}
      {(motivation.milestones || []).length > 0 ? (
        <div className="small mt-2">
          <div className="text-body-secondary mb-1">Milestones</div>
          <div className="d-flex flex-wrap gap-1">
            {motivation.milestones.map((m) => (
              <span
                key={`${m.kind}-${m.label}`}
                className="badge bg-success-subtle text-success-emphasis"
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {(motivation.recentImprovements || []).length > 0 ? (
        <div className="small mt-2">
          <div className="text-body-secondary mb-1">Recent improvements</div>
          {motivation.recentImprovements.map((text, i) => (
            <p key={i} className="mb-1">
              {text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default StudentMotivationInsights
