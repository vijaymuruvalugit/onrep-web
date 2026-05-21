import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
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

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [entityType, setEntityType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLogs(
        await superAdminApi.listAuditLogs({
          entity_type: entityType || undefined,
          limit: 100,
        }),
      )
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [entityType])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Audit logs"
        subtitle="Impersonation, subscriptions, governance, flags, and presets."
        actions={
          <>
            <CFormInput
              placeholder="Filter entity_type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <CButton color="primary" size="sm" onClick={load}>
              Refresh
            </CButton>
          </>
        }
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>When</CTableHeaderCell>
              <CTableHeaderCell>Action</CTableHeaderCell>
              <CTableHeaderCell>Entity</CTableHeaderCell>
              <CTableHeaderCell>Actor</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {logs.map((l) => (
              <CTableRow key={l.id}>
                <CTableDataCell>{new Date(l.created_at).toLocaleString()}</CTableDataCell>
                <CTableDataCell>{l.action}</CTableDataCell>
                <CTableDataCell>
                  {l.entity_type} / {l.entity_id?.slice?.(0, 8) || l.entity_id}
                </CTableDataCell>
                <CTableDataCell>{l.actor_user_id?.slice(0, 8) || '—'}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  )
}
