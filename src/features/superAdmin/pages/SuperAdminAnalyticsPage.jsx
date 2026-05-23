import React, { useEffect, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner } from '@coreui/react'
import analyticsApi from '../../analytics/api/analyticsApi'
import {
  InsightBarChart,
  InsightChartCard,
  InsightLineChart,
} from '../../analytics/components/InsightChartCard'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

export default function SuperAdminAnalyticsPage() {
  const [governance, setGovernance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    analyticsApi
      .getPlatformGovernance()
      .then(setGovernance)
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Platform governance"
        subtitle="Broken things, revenue risk, growth, and adoption — not academy coaching micromanagement."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CRow className="g-3">
          <CCol xs={12}>
            <div className="p-3 bg-white rounded shadow-sm">
              <h6 className="text-danger">Needs attention</h6>
              <ul className="mb-0 small">
                {(governance?.brokenThings || []).map((item, i) => (
                  <li key={i}>
                    {item.label}
                    {item.count > 0 ? ` (${item.count})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </CCol>
          <CCol md={4}>
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="text-body-secondary small">Active academies</div>
              <div className="fs-4">{governance?.platformGrowth?.activeAcademies ?? 0}</div>
              <div className="small text-body-secondary">
                {governance?.platformGrowth?.totalAcademies ?? 0} total
              </div>
            </div>
          </CCol>
          <CCol md={4}>
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="text-body-secondary small">Sessions this week</div>
              <div className="fs-4">{governance?.platformGrowth?.sessionsThisWeek ?? 0}</div>
            </div>
          </CCol>
          <CCol md={4}>
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="text-body-secondary small">Active coaches</div>
              <div className="fs-4">{governance?.usageTrends?.activeCoaches ?? 0}</div>
            </div>
          </CCol>
          <CCol md={6}>
            <div className="p-3 bg-white rounded shadow-sm">
              <h6>Revenue risk</h6>
              <div className="small text-body-secondary mb-1">Expiring subscriptions</div>
              <ul className="small mb-2">
                {(governance?.revenueRisk?.expiringSubscriptions || []).slice(0, 5).map((a) => (
                  <li key={a.id}>{a.name}</li>
                ))}
              </ul>
              <div className="small text-body-secondary mb-1">Payment failures</div>
              <ul className="small mb-0">
                {(governance?.revenueRisk?.paymentFailures || []).slice(0, 5).map((a) => (
                  <li key={a.id}>{a.name}</li>
                ))}
              </ul>
            </div>
          </CCol>
          <CCol md={6}>
            <InsightChartCard
              title="Top presets"
              subtitle="Platform-wide session templates"
              height={220}
            >
              <InsightBarChart
                labels={(governance?.featureAdoption?.mostUsedPresets || []).map((p) => p.label)}
                values={(governance?.featureAdoption?.mostUsedPresets || []).map(
                  (p) => p.sessionCount || 0,
                )}
                label="Sessions"
              />
            </InsightChartCard>
          </CCol>
          <CCol md={6}>
            <InsightChartCard title="Academy growth" subtitle="New academies per week" height={220}>
              <InsightLineChart
                labels={(governance?.platformGrowth?.academyGrowthTrend || []).map((w) =>
                  formatDisplayDateDmy(w.week),
                )}
                datasets={[
                  {
                    label: 'New academies',
                    data: (governance?.platformGrowth?.academyGrowthTrend || []).map(
                      (w) => w.newAcademies || 0,
                    ),
                  },
                ]}
              />
            </InsightChartCard>
          </CCol>
          <CCol md={12}>
            <InsightChartCard
              title="Session volume"
              subtitle="Daily sessions across the platform"
              height={260}
            >
              <InsightLineChart
                labels={(governance?.usageTrends?.sessionVolume || [])
                  .slice(-14)
                  .map((d) => formatDisplayDateDmy(d.day))}
                datasets={[
                  {
                    label: 'Sessions',
                    data: (governance?.usageTrends?.sessionVolume || [])
                      .slice(-14)
                      .map((d) => d.sessions || 0),
                  },
                ]}
              />
            </InsightChartCard>
          </CCol>
        </CRow>
      )}
    </div>
  )
}
