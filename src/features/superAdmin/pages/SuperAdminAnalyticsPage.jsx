import React, { useEffect, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner } from '@coreui/react'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

export default function SuperAdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    superAdminApi
      .getAnalytics()
      .then(setAnalytics)
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Platform analytics"
        subtitle="Platform health and adoption — not academy coaching micromanagement."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CRow className="g-3">
          <CCol md={4}>
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="text-body-secondary small">Active coaches (30d)</div>
              <div className="fs-4">{analytics?.active_coaches ?? 0}</div>
            </div>
          </CCol>
          <CCol md={8}>
            <div className="p-3 bg-white rounded shadow-sm">
              <h6>Top presets (30d)</h6>
              <ul className="mb-0 small">
                {(analytics?.preset_usage || []).map((p) => (
                  <li key={p.session_preset_id}>
                    {p.session_preset_id}: {p.n} sessions
                  </li>
                ))}
              </ul>
            </div>
          </CCol>
          <CCol md={6}>
            <div className="p-3 bg-white rounded shadow-sm">
              <h6>Academy growth (weekly)</h6>
              <ul className="mb-0 small">
                {(analytics?.academy_growth || []).map((w, i) => (
                  <li key={i}>
                    {w.week ? new Date(w.week).toLocaleDateString() : '—'}: +{w.new_academies}
                  </li>
                ))}
              </ul>
            </div>
          </CCol>
          <CCol md={6}>
            <div className="p-3 bg-white rounded shadow-sm">
              <h6>Session volume (daily)</h6>
              <ul className="mb-0 small" style={{ maxHeight: 200, overflow: 'auto' }}>
                {(analytics?.session_volume || []).slice(-14).map((d, i) => (
                  <li key={i}>
                    {d.day ? new Date(d.day).toLocaleDateString() : '—'}: {d.sessions}
                  </li>
                ))}
              </ul>
            </div>
          </CCol>
        </CRow>
      )}
    </div>
  )
}
