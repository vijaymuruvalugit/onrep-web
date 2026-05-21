import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

export default function SuperAdminAcademiesPage() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await superAdminApi.listAcademies({ q: q || undefined }))
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    load()
  }, [load])

  const openDetail = async (id) => {
    setDetailLoading(true)
    try {
      setDetail(await superAdminApi.getAcademy(id))
    } catch (e) {
      setError(e?.message || 'Failed to load academy')
    } finally {
      setDetailLoading(false)
    }
  }

  const doSuspend = async () => {
    if (!suspendTarget) return
    await superAdminApi.suspendAcademy(suspendTarget.id, suspendReason)
    setSuspendTarget(null)
    setSuspendReason('')
    load()
    if (detail?.academy?.id === suspendTarget.id) openDetail(suspendTarget.id)
  }

  const doReactivate = async (id) => {
    await superAdminApi.reactivateAcademy(id)
    load()
    if (detail?.academy?.id === id) openDetail(id)
  }

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Academies"
        subtitle="Governance and support — view usage and subscription; avoid coaching micromanagement."
        actions={
          <CFormInput
            placeholder="Search academies"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            style={{ maxWidth: 240 }}
          />
        }
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Plan</CTableHeaderCell>
              <CTableHeaderCell>Students</CTableHeaderCell>
              <CTableHeaderCell>Coaches</CTableHeaderCell>
              <CTableHeaderCell>Sessions/mo</CTableHeaderCell>
              <CTableHeaderCell />
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((a) => (
              <CTableRow key={a.id}>
                <CTableDataCell>{a.name}</CTableDataCell>
                <CTableDataCell>{a.status}</CTableDataCell>
                <CTableDataCell>{a.subscription_plan || '—'}</CTableDataCell>
                <CTableDataCell>{a.student_count}</CTableDataCell>
                <CTableDataCell>{a.coach_count}</CTableDataCell>
                <CTableDataCell>{a.sessions_this_month}</CTableDataCell>
                <CTableDataCell>
                  <CButton size="sm" color="link" onClick={() => openDetail(a.id)}>
                    View
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}

      <CModal visible={!!detail} onClose={() => setDetail(null)} size="lg">
        <CModalHeader>Academy detail</CModalHeader>
        <CModalBody>
          {detailLoading ? (
            <CSpinner size="sm" />
          ) : detail ? (
            <>
              <p>
                <strong>{detail.academy.name}</strong> · {detail.academy.status}
              </p>
              <p className="small text-body-secondary">
                Students: {detail.academy.student_count} · Coaches: {detail.academy.coach_count} · Plan:{' '}
                {detail.academy.subscription_plan || '—'}
              </p>
              <p className="small">Recent sessions: {detail.activity_summary?.recent_sessions?.length || 0}</p>
              <Link to={`/super-admin/support?academy=${detail.academy.id}`}>Support / impersonate →</Link>
            </>
          ) : null}
        </CModalBody>
        <CModalFooter>
          {detail?.academy?.suspended_at ? (
            <CButton color="success" onClick={() => doReactivate(detail.academy.id)}>
              Reactivate
            </CButton>
          ) : (
            <CButton color="warning" onClick={() => setSuspendTarget(detail?.academy)}>
              Suspend
            </CButton>
          )}
          <CButton color="secondary" variant="outline" onClick={() => setDetail(null)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!suspendTarget} onClose={() => setSuspendTarget(null)}>
        <CModalHeader>Suspend {suspendTarget?.name}</CModalHeader>
        <CModalBody>
          <CFormInput
            label="Reason"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Support reason (audited)"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="danger" onClick={doSuspend}>
            Suspend
          </CButton>
          <CButton color="secondary" variant="outline" onClick={() => setSuspendTarget(null)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
