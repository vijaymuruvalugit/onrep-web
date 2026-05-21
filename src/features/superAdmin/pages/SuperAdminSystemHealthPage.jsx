import React, { useEffect, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner } from '@coreui/react'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

function Signal({ label, value, warn }) {
  return (
    <div className={`p-3 rounded shadow-sm h-100 ${warn ? 'bg-danger-subtle' : 'bg-white'}`}>
      <div className="text-body-secondary small">{label}</div>
      <div className={`fs-4 fw-semibold ${warn ? 'text-danger' : ''}`}>{value ?? 0}</div>
    </div>
  )
}

export default function SuperAdminSystemHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    superAdminApi
      .getHealth()
      .then(setHealth)
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="System health"
        subtitle="Lightweight operational signals — not enterprise monitoring."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CRow className="g-3">
          <CCol sm={6} md={4}>
            <Signal label="Failed jobs (webhooks)" value={health?.failed_jobs} warn={health?.failed_jobs > 0} />
          </CCol>
          <CCol sm={6} md={4}>
            <Signal
              label="Session generation errors"
              value={health?.session_generation_errors}
              warn={health?.session_generation_errors > 0}
            />
          </CCol>
          <CCol sm={6} md={4}>
            <Signal label="Import failures" value={health?.import_failures} warn={health?.import_failures > 0} />
          </CCol>
          <CCol sm={6} md={4}>
            <Signal label="Notification failures" value={health?.notification_failures} warn={health?.notification_failures > 0} />
          </CCol>
          <CCol sm={6} md={4}>
            <Signal label="Open payment orphans" value={health?.api_errors} warn={health?.api_errors > 0} />
          </CCol>
        </CRow>
      )}
    </div>
  )
}
