import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CListGroup, CListGroupItem, CSpinner } from '@coreui/react'
import { parentApi } from '../../parent/api/parentApi'

/** Student schedule — reuses parent-scoped schedule API for linked student. */
const StudentSchedulePage = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await parentApi.getSchedule({ limit: 30 })
        const list = Array.isArray(data?.sessions) ? data.sessions : data
        if (!cancelled) setSessions(list || [])
      } catch {
        if (!cancelled) setSessions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-3">Sessions</h2>
      <CCard className="shadow-sm">
        <CCardBody className="p-0">
          <CListGroup flush>
            {sessions.length === 0 ? (
              <CListGroupItem className="text-body-secondary">No upcoming sessions</CListGroupItem>
            ) : (
              sessions.map((s) => (
                <CListGroupItem key={s.id}>
                  <div className="fw-semibold">{s.title || 'Session'}</div>
                  <div className="small text-body-secondary">
                    {s.sessionDate || s.startTimeUtc || '—'}
                  </div>
                </CListGroupItem>
              ))
            )}
          </CListGroup>
        </CCardBody>
      </CCard>
    </>
  )
}

export default StudentSchedulePage
