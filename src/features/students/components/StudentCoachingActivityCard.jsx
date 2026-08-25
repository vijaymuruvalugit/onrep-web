import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CPlaceholder,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import studentsApi from '../api/studentsApi'

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

/**
 * Read-only coaching activity: recent observations + active priority.
 * Owner/admin may see coach_private via backend oversight policy.
 * No edit / priority action controls in this slice.
 */
export default function StudentCoachingActivityCard({ studentId }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [observations, setObservations] = useState([])
  const [priority, setPriority] = useState(null)
  const [followUps, setFollowUps] = useState([])

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError(null)
    try {
      const [obs, pri, fus] = await Promise.all([
        studentsApi.getStudentObservations(studentId, { limit: 20 }),
        studentsApi.getCoachingPriority(studentId),
        studentsApi.getStudentFollowUps(studentId).catch(() => []),
      ])
      setObservations(Array.isArray(obs) ? obs : [])
      setPriority(pri ?? null)
      setFollowUps(Array.isArray(fus) ? fus : [])
    } catch (e) {
      setError(e?.message || 'Could not load coaching activity')
      setObservations([])
      setPriority(null)
      setFollowUps([])
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <CCard className="mb-3">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Coaching activity</span>
        {!loading && error ? (
          <CButton color="primary" size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </CButton>
        ) : null}
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <CSpinner size="sm" />
            <CPlaceholder animation="glow" className="flex-grow-1">
              <CPlaceholder xs={10} />
              <CPlaceholder xs={8} />
            </CPlaceholder>
          </div>
        ) : null}

        {!loading && error ? (
          <CAlert color="danger" className="mb-0">
            {error}
          </CAlert>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="mb-3">
              <strong className="d-block mb-1">Active priority</strong>
              {priority ? (
                <div className="small">
                  <div>
                    <strong>{priority.skillFocus}</strong> — {priority.cue}
                  </div>
                  <div className="text-body-secondary">
                    Status: {priority.status}
                    {priority.setAt ? ` · set ${formatWhen(priority.setAt)}` : ''}
                    {priority.setByName ? ` · by ${priority.setByName}` : ''}
                  </div>
                  <div className="text-body-secondary">
                    Last reviewed:{' '}
                    {priority.lastReviewedAt ? formatWhen(priority.lastReviewedAt) : 'Never'}
                    {priority.lastReviewedSessionId
                      ? ` · session ${String(priority.lastReviewedSessionId).slice(0, 8)}…`
                      : ''}
                  </div>
                </div>
              ) : (
                <div className="text-body-secondary small">No active priority</div>
              )}
            </div>

            <div className="mb-3">
              <strong className="d-block mb-1">Open follow-ups</strong>
              {followUps.length === 0 ? (
                <div className="text-body-secondary small">No open follow-ups</div>
              ) : (
                <ul className="small mb-0 ps-3">
                  {followUps.map((f) => (
                    <li key={f.id}>
                      {f.actionText}
                      <span className="text-body-secondary"> · {f.sourceType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <strong className="d-block mb-2">Recent observations</strong>
            {observations.length === 0 ? (
              <div className="text-body-secondary small">No observations yet</div>
            ) : (
              <CTable small responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>When</CTableHeaderCell>
                    <CTableHeaderCell>Coach</CTableHeaderCell>
                    <CTableHeaderCell>Focus</CTableHeaderCell>
                    <CTableHeaderCell>Label</CTableHeaderCell>
                    <CTableHeaderCell>Visibility</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {observations.map((o) => (
                    <CTableRow key={o.id}>
                      <CTableDataCell>{formatWhen(o.recordedAt)}</CTableDataCell>
                      <CTableDataCell>{o.coachName || '—'}</CTableDataCell>
                      <CTableDataCell>{o.focusArea || '—'}</CTableDataCell>
                      <CTableDataCell>{o.label}</CTableDataCell>
                      <CTableDataCell>{o.visibility || '—'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </>
        ) : null}
      </CCardBody>
    </CCard>
  )
}
