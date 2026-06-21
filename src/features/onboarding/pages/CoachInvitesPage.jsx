import React, { useEffect, useMemo, useState } from 'react'
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
import { hasAcademyAdminCapability, isLegalAcademyOwner } from '../../auth/utils/academyAdminAccess'

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
  const canManage = hasAcademyAdminCapability(user)
  const canAssignAdmin = isLegalAcademyOwner(user)

  const {
    invites,
    staff,
    staffLoading,
    staffError,
    adminActionLoadingId,
    adminActionError,
    listLoading,
    listError,
    submitLoading,
    submitError,
    submitSuccess,
    lastInviteResponse,
    revokeLoadingId,
    revokeError,
    resendLoadingId,
    resendError,
    resendSuccess,
    loadCoachInvites,
    loadAcademyStaff,
    sendCoachInvite,
    revokeCoachInvite,
    resendCoachInvite,
    grantCoachAdmin,
    revokeCoachAdmin,
    clearSubmitState,
    clearRevokeError,
    clearResendState,
    clearAdminActionError,
  } = useCoachInvites()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [adminOverrides, setAdminOverrides] = useState({})

  const visibleStaff = useMemo(() => {
    const byId = new Map()
    for (const row of staff || []) {
      if (row.role === 'academy_owner') continue
      const id = String(row.id)
      byId.set(id, {
        ...row,
        isAcademyAdmin: adminOverrides[id] ?? row.isAcademyAdmin,
      })
    }
    for (const row of invites || []) {
      if (String(row.status || '').toLowerCase() !== 'accepted') continue
      const id = String(row.userId || '')
      if (!id || byId.has(id)) continue
      byId.set(id, {
        id,
        name: row.name,
        email: row.email,
        role: 'coach',
        invited: true,
        password_set: true,
        isAcademyAdmin: adminOverrides[id] ?? false,
      })
    }
    return [...byId.values()]
  }, [adminOverrides, invites, staff])

  const refreshAll = () => {
    loadCoachInvites()
    loadAcademyStaff()
  }

  useEffect(() => {
    if (!canManage) return
    loadCoachInvites()
    loadAcademyStaff()
  }, [canManage, loadCoachInvites, loadAcademyStaff])

  useEffect(() => {
    if (submitSuccess) {
      void loadCoachInvites()
      void loadAcademyStaff()
    }
  }, [submitSuccess, loadCoachInvites, loadAcademyStaff])

  useEffect(() => {
    if (resendSuccess) {
      void loadCoachInvites()
      void loadAcademyStaff()
    }
  }, [resendSuccess, loadCoachInvites, loadAcademyStaff])

  const E164_RE = /^\+[1-9]\d{6,14}$/
  const onSubmit = async (e) => {
    e.preventDefault()
    clearSubmitState()
    const em = email.trim().toLowerCase()
    const nm = name.trim()
    const ph = phone.trim()
    if (!em || !nm || !ph || !E164_RE.test(ph)) return
    const result = await sendCoachInvite({ email: em, name: nm, phoneNumber: ph })
    if (result.meta.requestStatus === 'fulfilled') {
      setEmail('')
      setName('')
      setPhone('')
    }
  }

  const onRevoke = async (userId) => {
    clearRevokeError()
    const result = await revokeCoachInvite(userId)
    if (result.meta.requestStatus === 'fulfilled') {
      void loadCoachInvites()
    }
  }

  const onResend = async (row) => {
    clearResendState()
    const result = await resendCoachInvite(row.userId)
    if (result.meta.requestStatus === 'fulfilled') {
      void loadCoachInvites()
    }
  }

  const onGrantAdmin = async (userId) => {
    clearAdminActionError()
    const result = await grantCoachAdmin(userId)
    if (result.meta.requestStatus === 'fulfilled') {
      setAdminOverrides((prev) => ({ ...prev, [userId]: true }))
      void loadAcademyStaff()
      void loadCoachInvites()
    }
  }

  const onRevokeAdmin = async (userId) => {
    clearAdminActionError()
    const result = await revokeCoachAdmin(userId)
    if (result.meta.requestStatus === 'fulfilled') {
      setAdminOverrides((prev) => ({ ...prev, [userId]: false }))
      void loadAcademyStaff()
      void loadCoachInvites()
    }
  }

  if (!canManage) {
    return (
      <>
        <h2 className="mb-3">Coaches</h2>
        <CAlert color="warning">
          Only <strong>academy owners and admins</strong> can invite coaches. Sign in with an owner
          or admin account to manage invites.
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
            onClick={refreshAll}
            disabled={listLoading || staffLoading}
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

      {resendError ? (
        <CAlert color="danger" dismissible onClose={clearResendState}>
          {resendError.message || 'Resend failed.'}
        </CAlert>
      ) : null}

      {resendSuccess ? (
        <CAlert color="success" dismissible onClose={clearResendState}>
          Invite resent — a fresh sign-up link was emailed with a new 48-hour expiry.
        </CAlert>
      ) : null}

      {adminActionError ? (
        <CAlert color="danger" dismissible onClose={clearAdminActionError}>
          {adminActionError.message || 'Admin role update failed.'}
        </CAlert>
      ) : null}

      {staffError ? (
        <CAlert
          color="warning"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{staffError.message || 'Could not load staff.'}</span>
          <CButton color="warning" variant="outline" size="sm" onClick={() => loadAcademyStaff()}>
            Retry
          </CButton>
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
              <CCol md={6}>
                <CFormLabel htmlFor="coach-invite-phone">Phone number</CFormLabel>
                <CFormInput
                  id="coach-invite-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  placeholder="+919876543210"
                  required
                />
                <small className="text-body-secondary">
                  E.164 format with country code. The coach will use this for mobile sign in.
                </small>
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

      <CCard className="mb-4">
        <CCardHeader>Staff — admin access</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          <p className="px-4 pt-3 mb-2 small text-body-secondary">
            Grant <strong>Academy admin</strong> so a coach can manage billing, invites, and
            settings (same as owner). They keep coach access and can switch perspectives in the
            header.
          </p>
          {staffLoading && !visibleStaff.length ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : null}
          {visibleStaff.length ? (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Role</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Admin</CTableHeaderCell>
                  {canAssignAdmin ? <CTableHeaderCell scope="col"> </CTableHeaderCell> : null}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {visibleStaff.map((row) => {
                  const busy = adminActionLoadingId === row.id
                  return (
                    <CTableRow key={row.id}>
                      <CTableDataCell>{row.name || '—'}</CTableDataCell>
                      <CTableDataCell className="small">{row.email || '—'}</CTableDataCell>
                      <CTableDataCell className="small text-capitalize">{row.role}</CTableDataCell>
                      <CTableDataCell>
                        {row.isAcademyAdmin ? (
                          <CBadge color="primary">Admin</CBadge>
                        ) : (
                          <span className="text-body-secondary small">Coach</span>
                        )}
                      </CTableDataCell>
                      {canAssignAdmin ? (
                        <CTableDataCell>
                          {row.role === 'coach' || row.role === 'admin' ? (
                            <div className="d-flex flex-wrap gap-1">
                              {row.isAcademyAdmin ? (
                                <CButton
                                  color="secondary"
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void onRevokeAdmin(row.id)}
                                >
                                  {busy ? <CSpinner size="sm" /> : 'Remove admin'}
                                </CButton>
                              ) : (
                                <CButton
                                  color="primary"
                                  variant="outline"
                                  size="sm"
                                  disabled={busy || !row.password_set}
                                  onClick={() => void onGrantAdmin(row.id)}
                                >
                                  {busy ? <CSpinner size="sm" /> : 'Make admin'}
                                </CButton>
                              )}
                            </div>
                          ) : (
                            <span className="text-body-secondary small">—</span>
                          )}
                        </CTableDataCell>
                      ) : null}
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          ) : (
            !staffLoading && (
              <p className="p-4 mb-0 text-body-secondary small">No coaches to show yet.</p>
            )
          )}
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
                  const canResend = row.status === 'pending' || row.status === 'expired'
                  const canRevoke = canResend
                  const rowBusy = revokeLoadingId === row.userId || resendLoadingId === row.userId
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
                        {canResend || canRevoke ? (
                          <div className="d-flex flex-wrap gap-1">
                            {canResend ? (
                              <CButton
                                color="primary"
                                variant="outline"
                                size="sm"
                                disabled={rowBusy}
                                onClick={() => void onResend(row)}
                              >
                                {resendLoadingId === row.userId ? <CSpinner size="sm" /> : 'Resend'}
                              </CButton>
                            ) : null}
                            {canRevoke ? (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                disabled={rowBusy}
                                onClick={() => onRevoke(row.userId)}
                              >
                                Revoke
                              </CButton>
                            ) : null}
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
          ) : null}
        </CCardBody>
      </CCard>
    </>
  )
}

export default CoachInvitesPage
