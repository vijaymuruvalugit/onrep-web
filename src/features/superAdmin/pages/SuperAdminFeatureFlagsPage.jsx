import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CFormSelect,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

export default function SuperAdminFeatureFlagsPage() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setFlags(await superAdminApi.listFeatureFlags())
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (flag, status) => {
    await superAdminApi.updateFeatureFlag(flag.id, { status })
    load()
  }

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Feature flags"
        subtitle="Gradual rollout tools — not permanent per-academy customization."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Key</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Global</CTableHeaderCell>
              <CTableHeaderCell>Overrides</CTableHeaderCell>
              <CTableHeaderCell />
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {flags.map((f) => (
              <CTableRow key={f.id}>
                <CTableDataCell>
                  <code>{f.key}</code>
                  <div className="small text-body-secondary">{f.description}</div>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge color={f.status === 'on' ? 'success' : f.status === 'beta' ? 'info' : 'secondary'}>
                    {f.status}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{f.global_enabled ? 'Yes' : 'No'}</CTableDataCell>
                <CTableDataCell>{f.override_count}</CTableDataCell>
                <CTableDataCell>
                  <CFormSelect
                    size="sm"
                    value={f.status}
                    onChange={(e) => updateStatus(f, e.target.value)}
                    style={{ maxWidth: 100 }}
                  >
                    <option value="off">off</option>
                    <option value="beta">beta</option>
                    <option value="on">on</option>
                  </CFormSelect>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  )
}
