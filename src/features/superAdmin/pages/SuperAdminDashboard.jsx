import React, { useCallback, useEffect, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner } from '@coreui/react'
import { Link } from 'react-router-dom'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'
import AttentionPanel from '../components/AttentionPanel'

function Stat({ label, value }) {
  return (
    <div className="p-3 bg-white rounded shadow-sm h-100">
      <div className="text-body-secondary small">{label}</div>
      <div className="fs-4 fw-semibold">{value ?? '—'}</div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOverview(await superAdminApi.getOverview())
    } catch (e) {
      setError(e?.message || 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <CSpinner color="primary" />
  if (error) return <CAlert color="danger">{error}</CAlert>

  const g = overview?.platform_growth || {}
  const h = overview?.operational_health || {}
  const sub = overview?.subscription_status || {}

  const brokenItems = [
    h.failed_jobs > 0 && { label: `${h.failed_jobs} failed webhook jobs (24h)`, detail: 'Check system health' },
    h.notification_failures > 0 && {
      label: `${h.notification_failures} notification failures`,
    },
    h.api_errors > 0 && { label: `${h.api_errors} open payment webhook orphans` },
  ].filter(Boolean)

  const revenueItems = [
    ...(sub.expiring_subscriptions || []).slice(0, 5).map((a) => ({
      key: a.id,
      label: a.name,
      detail: `Expires ${a.subscription_end_date ? new Date(a.subscription_end_date).toLocaleDateString() : 'soon'}`,
    })),
    ...(sub.payment_failures || []).slice(0, 3).map((a) => ({
      key: `pf-${a.id}`,
      label: a.name,
      detail: 'Access lapsed — payment failure',
    })),
  ]

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Platform overview"
        subtitle="What needs attention — operational health, revenue risk, adoption."
      />

      <CRow className="g-3 mb-4">
        <CCol sm={6} md={3}>
          <Stat label="Academies" value={`${g.active_academies ?? 0} active / ${g.total_academies ?? 0}`} />
        </CCol>
        <CCol sm={6} md={3}>
          <Stat label="Coaches" value={g.coaches} />
        </CCol>
        <CCol sm={6} md={3}>
          <Stat label="Students" value={g.students} />
        </CCol>
        <CCol sm={6} md={3}>
          <Stat label="Sessions this week" value={g.sessions_this_week} />
        </CCol>
      </CRow>

      <CRow className="g-3">
        <CCol md={4}>
          <AttentionPanel title="Broken things" items={brokenItems} color="danger" />
          <div className="mt-2 small">
            <Link to="/super-admin/system-health">System health →</Link>
          </div>
        </CCol>
        <CCol md={4}>
          <AttentionPanel title="Expiring revenue" items={revenueItems} emptyText="No urgent subscription risks." />
          <div className="mt-2 small">
            <Link to="/super-admin/subscriptions">Subscriptions →</Link>
          </div>
        </CCol>
        <CCol md={4}>
          <AttentionPanel
            title="Adoption"
            items={(overview?.usage_trends?.most_active_academies || []).map((a) => ({
              key: a.id,
              label: a.name,
              detail: `${a.session_count} sessions this week`,
            }))}
            emptyText="No session activity yet this week."
          />
          <div className="mt-2 small text-body-secondary">
            Sessions today: {overview?.usage_trends?.sessions_per_day ?? 0}
            {overview?.usage_trends?.attendance_capture_rate_pct != null
              ? ` · Attendance capture ${overview.usage_trends.attendance_capture_rate_pct}%`
              : null}
          </div>
        </CCol>
      </CRow>
    </div>
  )
}
