import React, { useEffect } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'

import useCoachParents from '../hooks/useCoachParents'

function overviewInviteUuid(overviewId) {
  if (typeof overviewId !== 'string') return null
  if (overviewId.startsWith('inv_')) return overviewId.slice(4)
  return null
}

const ParentsOverviewPage = () => {
  const {
    parents,
    loading,
    error,
    actionError,
    resendLoadingId,
    revokeLoadingId,
    loadParentsOverview,
    resendInvite,
    revokeInvite,
    clearActionError,
  } = useCoachParents()

  useEffect(() => {
    loadParentsOverview({ status: 'all' })
  }, [loadParentsOverview])

  const retry = () => loadParentsOverview({ status: 'all' })

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="mb-0">Parents</h2>
          <p className="text-body-secondary small mb-0">
            Linked parents and pending invites (operational directory — not a CRM).
          </p>
        </div>
        <CButton color="secondary" variant="outline" size="sm" onClick={retry} disabled={loading}>
          <CIcon icon={cilReload} className="me-1" />
          Refresh
        </CButton>
      </div>

      {error ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{error.message || 'Unable to load parents.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {actionError ? (
        <CAlert color="warning" dismissible onClose={clearActionError}>
          {actionError.message || 'Action failed.'}
        </CAlert>
      ) : null}

      {loading && !parents.length ? (
        <div className="text-center py-5">
          <CSpinner />
        </div>
      ) : null}

      <CCard>
        <CCardHeader>Overview</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          <CTable hover responsive className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                <CTableHeaderCell scope="col">Type</CTableHeaderCell>
                <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                <CTableHeaderCell scope="col">Students</CTableHeaderCell>
                <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {parents.map((row) => {
                const inviteUuid = row.type === 'invite' ? overviewInviteUuid(row.id) : null
                const students = Array.isArray(row.linkedStudents) ? row.linkedStudents : []
                const studentLabel = students.map((s) => s.name || s.id).join(', ') || '—'
                return (
                  <CTableRow key={row.id}>
                    <CTableDataCell>{row.name}</CTableDataCell>
                    <CTableDataCell className="small">{row.email || '—'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={row.type === 'invite' ? 'info' : 'secondary'}>
                        {row.type}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="light" textColor="dark">
                        {row.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="small">{studentLabel}</CTableDataCell>
                    <CTableDataCell>
                      {inviteUuid && (row.status === 'pending' || row.status === 'expired') ? (
                        <div className="d-flex flex-wrap gap-1">
                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            disabled={resendLoadingId === inviteUuid}
                            onClick={() => {
                              void resendInvite(inviteUuid, 14)
                                .unwrap()
                                .then(() => loadParentsOverview({ status: 'all' }))
                                .catch(() => {})
                            }}
                          >
                            Resend
                          </CButton>
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            disabled={revokeLoadingId === inviteUuid}
                            onClick={() => {
                              void revokeInvite(inviteUuid)
                                .unwrap()
                                .then(() => loadParentsOverview({ status: 'all' }))
                                .catch(() => {})
                            }}
                          >
                            Revoke
                          </CButton>
                        </div>
                      ) : (
                        <span className="text-body-secondary small">—</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentsOverviewPage
