import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import DashboardStatCard from '../../dashboard/components/DashboardStatCard'
import { InsightBarChart, InsightChartCard } from './InsightChartCard'
import { formatInr } from '../../payments/utils/formatInr'

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return `${v}%`
}

/**
 * Academy admin operational metrics — dashboard-first.
 * Only metrics backed by operational sessions, roster, or the fee ledger.
 */
const AcademyOperationsInsights = () => {
  const activeActivityId = useSelector((state) => state.workspace.activeActivityId)
  const [ops, setOps] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!activeActivityId) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await analyticsApi.getAcademyOperations({ depth: 'embedded' })
        if (!cancelled) setOps(data)
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

  const coaches = ops?.coachingOperations?.mostActiveCoaches || []
  const presets = ops?.coachingStructure?.mostUsedPresets || []

  return (
    <CCard className="border-0 shadow-sm mb-3">
      <CCardHeader className="d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center gap-2">
          <CIcon icon={cilChart} />
          <strong>Operations</strong>
          <span className="small text-body-secondary">Last {ops?.windowDays ?? 90} days</span>
        </span>
        <Link className="btn btn-sm btn-link" to="/coach/academy/insights">
          View details
        </Link>
      </CCardHeader>
      <CCardBody>
        {error ? (
          <CAlert color="warning" className="py-2 mb-0 small">
            {error.message || 'Operations insights unavailable.'}
          </CAlert>
        ) : null}
        {loading ? <CSpinner size="sm" /> : null}
        {!loading && ops ? (
          <CRow className="g-3">
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Active students"
                value={ops.academyGrowth?.activeStudents ?? '—'}
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Participation rate"
                value={fmtPct(ops.attendanceTrends?.attendanceRate)}
                hint="Present or late among marked students"
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Sessions completed"
                value={ops.coachingOperations?.sessionsConducted ?? '—'}
                hint="Finished sessions in this period"
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Collected (month)"
                value={
                  ops.paymentsContinuity?.collectedThisMonthInr != null
                    ? `₹${formatInr(ops.paymentsContinuity.collectedThisMonthInr)}`
                    : '—'
                }
                loading={false}
              />
            </CCol>
            {coaches.length ? (
              <CCol lg={presets.length ? 6 : 12}>
                <InsightChartCard
                  title="Coach session load"
                  subtitle="Completed sessions by coach"
                  height={180}
                >
                  <InsightBarChart
                    labels={coaches.map((c) => c.coachName)}
                    values={coaches.map((c) => c.sessionCount || 0)}
                    label="Sessions"
                  />
                </InsightChartCard>
              </CCol>
            ) : null}
            {presets.length ? (
              <CCol lg={coaches.length ? 6 : 12}>
                <InsightChartCard title="Preset usage" subtitle="Named session templates" height={180}>
                  <InsightBarChart
                    labels={presets.map((p) => p.label)}
                    values={presets.map((p) => p.count || 0)}
                    label="Sessions"
                  />
                </InsightChartCard>
              </CCol>
            ) : null}
          </CRow>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default AcademyOperationsInsights
