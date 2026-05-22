import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CCollapse,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLightbulb } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'

/**
 * Compact operational insights for Coach Home — execution flow first.
 */
const CoachEmbeddedInsights = ({ activeActivityId }) => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!activeActivityId) {
      return undefined
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await analyticsApi.getCoachInsights({ depth: 'embedded' })
        if (!cancelled) setInsights(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeActivityId])

  const embedded = insights?.embedded
  const topObservation = embedded?.repeatedObservations?.[0]
  const topFocus = embedded?.recentFocusTrends?.[0]
  const alertCount = embedded?.attendanceAlerts?.length || 0

  return (
    <CCard className="border-0 onrep-surface-b shadow-none mb-3">
      <CCardHeader className="d-flex align-items-center justify-content-between bg-transparent border-bottom border-light-subtle">
        <span className="d-flex align-items-center gap-2">
          <CIcon icon={cilLightbulb} className="text-primary" />
          <strong>Coaching insights</strong>
          <span className="small text-body-secondary">Last 30 days</span>
        </span>
        <Link className="btn btn-sm btn-link" to="/coach/insights">
          View session trends
        </Link>
      </CCardHeader>
      <CCardBody>
        {loading ? <CSpinner size="sm" /> : null}
        {error ? (
          <CAlert color="warning" className="py-2 mb-0 small">
            {error.message || 'Insights unavailable right now.'}
          </CAlert>
        ) : null}
        {!loading && !error && embedded ? (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 small">
              {topObservation ? (
                <span className="badge bg-body-secondary text-dark">
                  Repeated focus: {topObservation.label}
                </span>
              ) : null}
              {alertCount > 0 ? (
                <span className="badge bg-warning-subtle text-warning-emphasis">
                  {alertCount} participation alert{alertCount === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success-emphasis">
                  No participation alerts
                </span>
              )}
              {topFocus ? (
                <span className="badge bg-info-subtle text-info-emphasis">
                  Coaching emphasis: {topFocus.label}
                </span>
              ) : null}
              <CButton
                color="link"
                size="sm"
                className="p-0 ms-auto"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? 'Hide details' : 'Show details'}
              </CButton>
            </div>
            <CCollapse visible={expanded}>
              <CRow className="g-3 mt-1">
                <CCol md={6}>
                  <div className="small text-body-secondary mb-1">Repeated observations</div>
                  {(embedded.repeatedObservations || []).length === 0 ? (
                    <p className="small text-body-secondary mb-0">No observation patterns yet.</p>
                  ) : (
                    <ul className="small mb-0 ps-3">
                      {embedded.repeatedObservations.map((o) => (
                        <li key={o.label}>
                          {o.label}
                          {o.count != null ? ` (${o.count})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary mb-1">Low participation trend</div>
                  {(embedded.attendanceAlerts || []).length === 0 ? (
                    <p className="small text-body-secondary mb-0">No participation alerts.</p>
                  ) : (
                    <ul className="small mb-0 ps-3">
                      {embedded.attendanceAlerts.map((a) => (
                        <li key={a.studentId}>
                          {a.studentName}
                          {a.attendanceRate != null
                            ? ` · ${a.attendanceRate}% session participation`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary mb-1">Recent focus trends</div>
                  {(embedded.recentFocusTrends || []).length === 0 ? (
                    <p className="small text-body-secondary mb-0">
                      Focus areas appear after observations.
                    </p>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {embedded.recentFocusTrends.map((f) => (
                        <span key={f.label} className="badge bg-body-secondary text-dark">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary mb-1">Most used presets</div>
                  {(embedded.presetUsageHighlights || []).length === 0 ? (
                    <p className="small text-body-secondary mb-0">
                      Preset usage will appear after sessions.
                    </p>
                  ) : (
                    <ul className="small mb-0 ps-3">
                      {embedded.presetUsageHighlights.map((p) => (
                        <li key={p.presetId}>
                          {p.label} · {p.sessionCount} sessions
                        </li>
                      ))}
                    </ul>
                  )}
                </CCol>
              </CRow>
            </CCollapse>
          </>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default CoachEmbeddedInsights
