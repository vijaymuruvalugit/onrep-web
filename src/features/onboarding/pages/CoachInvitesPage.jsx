import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilReload, cilSend } from '@coreui/icons'

import useCoachInvites from '../hooks/useCoachInvites'

function statusBadgeColor(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'accepted') return 'success'
  if (s === 'pending') return 'warning'
  if (s === 'expired') return 'secondary'
  if (s === 'revoked') return 'dark'
  return 'light'
}

function formatTs(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString()
  } catch {
    return '—'
  }
}

const CoachInvitesPage = () => {
  const user = useSelector((state) => state.auth.user)
  const isOwner = String(user?.role || user?.userRole || '').toLowerCase() === 'academy_owner'

  const {
    invites,
    listLoading,
    listError,
    submitLoading,
    submitError,
    submitSuccess,
    lastInviteResponse,
    revokeLoadingId,
    revokeError,
    loadCoachInvites,
    sendCoachInvite,
    revokeCoachInvite,
    clearSubmitState,
    clearRevokeError,
  } = useCoachInvites()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!isOwner) return
    loadCoachInvites()
  }, [isOwner, loadCoachInvites])

  useEffect(() => {
    if (submitSuccess) {
      void loadCoachInvites()
    }
  }, [submitSuccess, loadCoachInvites])

  const onSubmit = async (e) => {
    e.preventDefault()
    clearSubmitState()
    const em = email.trim().toLowerCase()
    const nm = name.trim()
    if (!em || !nm) return
    const result = await sendCoachInvite({ email: em, name: nm })
    if (result.meta.requestStatus === 'fulfilled') {
      setEmail('')
      setName('')
    }
  }

  const onRevoke = async (userId) => {
    clearRevokeError()
    const result = await revokeCoachInvite(userId)
    if (result.meta.requestStatus === 'fulfilled') {
      void loadCoachInvites()
    }
  }

  if (!isOwner) {
    return (
      <>
        <h2 className="mb-3">Coaches</h2>
        <CAlert color="warning">
          Only <strong>academy owners</strong> can invite coaches. Sign in with an owner account to
          manage invites.
        </CAlert>
      </>
    )
  }

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">
            <CIcon icon={cilPeople} className="me-2" />
            Coaches
          </h2>
          <p className="text-body-secondary small mb-0">
            Invite coaches by email. They complete setup via the link sent to their inbox (same flow
            as the mobile app).
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => loadCoachInvites()}
            disabled={listLoading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {listError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{listError.message || 'Could not load invites.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={() => loadCoachInvites()}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {revokeError ? (
        <CAlert color="danger" dismissible onClose={clearRevokeError}>
          {revokeError.message || 'Revoke failed.'}
        </CAlert>
      ) : null}

      {submitError ? (
        <CAlert color="danger" dismissible onClose={clearSubmitState}>
          {submitError.message || 'Invite failed.'}
          {submitError.raw?.error === 'EMAIL_IN_USE' ||
          String(submitError.message || '').includes('EMAIL_IN_USE')
            ? ' This email is already in use for a non-pending account, or cannot be invited again.'
            : null}
        </CAlert>
      ) : null}

      {submitSuccess && lastInviteResponse ? (
        <CAlert color="success" dismissible onClose={clearSubmitState}>
          {lastInviteResponse.resent
            ? 'Pending invite refreshed — a new link was emailed with an updated expiry.'
            : 'Invite sent — the coach should check email (including spam) for the sign-up link.'}
          {import.meta.env.DEV && lastInviteResponse.inviteToken ? (
            <div className="small mt-2 font-monospace text-break">
              Dev only token: {lastInviteResponse.inviteToken}
            </div>
          ) : null}
        </CAlert>
      ) : null}

      <CCard className="mb-4">
        <CCardHeader>Invite a coach</CCardHeader>
        <CCardBody>
          <CForm onSubmit={onSubmit}>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel htmlFor="coach-invite-email">Email</CFormLabel>
                <CFormInput
                  id="coach-invite-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="coach@example.com"
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="coach-invite-name">Name</CFormLabel>
                <CFormInput
                  id="coach-invite-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  placeholder="Full name"
                  required
                />
              </CCol>
              <CCol xs={12}>
                <CButton type="submit" color="primary" disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilSend} className="me-2" />
                      Send invite
                    </>
                  )}
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>Invites &amp; coach accounts</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          {listLoading && !invites.length ? (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          ) : null}
          {!listLoading && !invites.length ? (
            <p className="p-4 mb-0 text-body-secondary small">No coach invite rows yet.</p>
          ) : null}
          {invites.length ? (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Invite expires</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Created</CTableHeaderCell>
                  <CTableHeaderCell scope="col"> </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {invites.map((row) => {
                  const canRevoke = row.status === 'pending' || row.status === 'expired'
                  return (
                    <CTableRow key={row.userId}>
                      <CTableDataCell>{row.name || '—'}</CTableDataCell>
                      <CTableDataCell className="small">{row.email || '—'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="small">
                        {formatTs(row.inviteExpiresAt)}
                      </CTableDataCell>
                      <CTableDataCell className="small">{formatTs(row.createdAt)}</CTableDataCell>
                      <CTableDataCell>
                        {canRevoke ? (
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            disabled={revokeLoadingId === row.userId}
                            onClick={() => onRevoke(row.userId)}
                          >
                            Revoke
                          </CButton>
                        ) : (
                          <span className="text-body-secondary small">—</span>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          ) : null}
        </CCardBody>
      </CCard>
    </>
  )
}

export default CoachInvitesPage
