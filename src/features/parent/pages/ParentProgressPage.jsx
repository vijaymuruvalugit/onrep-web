import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import { familyApi } from '../../family/api/familyApi'

const ParentProgressPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const overview = await familyApi.getParentOverview()
        if (!cancelled) setData(overview)
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <CAlert color="warning">{error.message || 'Could not load progress.'}</CAlert>
  }

  const children = data?.children || []

  return (
    <>
      <h2 className="mb-3">Progress</h2>
      <CRow className="g-3">
        {children.length === 0 ? (
          <CCol xs={12}>
            <CAlert color="info">Link a child account to see progress summaries.</CAlert>
          </CCol>
        ) : (
          children.map((c) => (
            <CCol key={c.studentId} md={6}>
              <CCard className="shadow-sm h-100">
                <CCardHeader className="fw-semibold">{c.studentName}</CCardHeader>
                <CCardBody>
                  {(c.focusAreas || []).length > 0 ? (
                    <div className="mb-3">
                      <div className="small text-body-secondary mb-1">Focus areas</div>
                      <ul className="small mb-0 ps-3">
                        {c.focusAreas.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(c.recentCoachSummaries || []).map((s) => (
                    <div key={s.id} className="mb-2 p-2 bg-body-tertiary rounded small">
                      {s.todayFocus ? <div className="fw-semibold">{s.todayFocus}</div> : null}
                      {s.improvements ? <div>{s.improvements}</div> : null}
                      {s.nextFocus ? (
                        <div className="text-body-secondary mt-1">Next: {s.nextFocus}</div>
                      ) : null}
                    </div>
                  ))}
                </CCardBody>
              </CCard>
            </CCol>
          ))
        )}
      </CRow>
    </>
  )
}

export default ParentProgressPage
