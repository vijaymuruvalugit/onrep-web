import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCopy, cilPlus, cilReload, cilUser, cilXCircle } from '@coreui/icons'

import useStudentParents from '../hooks/useStudentParents'
import { fetchStudentParents } from '../slices/studentParentsSlice'
import InviteParentModal from './InviteParentModal'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

/**
 * Unified parents list. Each row represents one *person's relationship* with the
 * student — whether they're already linked or only invited so far. Server-side
 * we already exclude `accepted` invites (which become linked rows) and `revoked`
 * invites (dead history), so what we render here is always either:
 *   - linked        — has accepted, has access. Action: Remove.
 *   - invited       — pending invite. Actions: Resend, Revoke, Copy link.
 *   - invite_expired— invite TTL elapsed. Actions: Resend, Revoke.
 */

const STATUS_META = {
  linked: { label: 'Linked', color: 'success' },
  invited: { label: 'Invited', color: 'warning' },
  invite_expired: { label: 'Invite expired', color: 'secondary' },
}

const formatTs = (value) => {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return formatDisplayDateDmy(d)
  } catch {
    return '—'
  }
}

const initialsFromName = (value) =>
  String(value || '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?'

/**
 * Merge linked parents + non-accepted invites into a single sortable list.
 * Sort order: linked first, then invited (most recent first), then expired.
 */
function buildRows(linked, invites) {
  const linkedRows = (linked || []).map((p) => ({
    rowId: `link_${p.userId}`,
    kind: 'linked',
    status: 'linked',
    name: p.name || null,
    email: p.email || null,
    timestamp: p.linkedAt,
    timestampLabel: 'linked',
    userId: p.userId,
    inviteId: null,
    code: null,
    expiresAt: null,
  }))
  const inviteRows = (invites || []).map((inv) => {
    const status = inv.status === 'expired' ? 'invite_expired' : 'invited'
    return {
      rowId: `inv_${inv.id}`,
      kind: 'invite',
      status,
      name: inv.name || null,
      email: inv.email || null,
      timestamp: inv.createdAt,
      timestampLabel: 'invited',
      userId: null,
      inviteId: inv.id,
      code: inv.code,
      expiresAt: inv.expiresAt,
    }
  })

  const order = { linked: 0, invited: 1, invite_expired: 2 }
  return [...linkedRows, ...inviteRows].sort((a, b) => {
    const byStatus = order[a.status] - order[b.status]
    if (byStatus !== 0) return byStatus
    const at = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return bt - at
  })
}

const StudentParentsCard = ({ studentId, studentName }) => {
  const dispatch = useDispatch()
  const {
    linked,
    invites,
    loading,
    error,
    submit,
    actionId,
    actionError,
    invite,
    resend,
    revoke,
    unlink,
    clearSubmit,
    clearActionError,
  } = useStudentParents(studentId)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copiedRowId, setCopiedRowId] = useState(null)

  const reload = useCallback(() => {
    if (studentId) dispatch(fetchStudentParents(studentId))
  }, [dispatch, studentId])

  useEffect(() => {
    reload()
  }, [reload])

  const rows = useMemo(() => buildRows(linked, invites), [linked, invites])
  const linkedCount = rows.filter((r) => r.status === 'linked').length
  const invitedCount = rows.filter((r) => r.status === 'invited').length

  const handleInvite = async ({ email, name, expiresInDays }) => {
    clearSubmit()
    const result = await invite({ email, name, expiresInDays })
    if (result?.meta?.requestStatus === 'fulfilled') {
      setShowInviteModal(false)
      reload()
      clearSubmit()
    }
  }

  const handleResend = async (inviteId) => {
    clearActionError()
    const result = await resend(inviteId)
    if (result?.meta?.requestStatus === 'fulfilled') reload()
  }

  const handleRevoke = async (inviteId) => {
    if (!window.confirm('Revoke this invite? The link will stop working immediately.')) return
    clearActionError()
    const result = await revoke(inviteId)
    if (result?.meta?.requestStatus === 'fulfilled') reload()
  }

  const handleUnlink = async (parentUserId, name) => {
    if (
      !window.confirm(
        `Remove ${name || 'this parent'}'s access to ${studentName || 'this student'}? They'll no longer see fees, attendance, or updates for this child.`,
      )
    )
      return
    clearActionError()
    await unlink(parentUserId)
  }

  const handleCopyCode = async (rowId, code) => {
    if (!code) return
    try {
      const link = `${window.location.origin}/#/accept-parent-invite?code=${encodeURIComponent(code)}`
      await navigator.clipboard.writeText(link)
      setCopiedRowId(rowId)
      window.setTimeout(() => setCopiedRowId((cur) => (cur === rowId ? null : cur)), 1500)
    } catch {
      // ignore
    }
  }

  const summary = (() => {
    if (loading && rows.length === 0) return 'Loading…'
    if (rows.length === 0) return 'No parents yet'
    const parts = []
    if (linkedCount > 0) parts.push(`${linkedCount} linked`)
    if (invitedCount > 0) parts.push(`${invitedCount} invited`)
    return parts.join(' · ') || `${rows.length} on this student`
  })()

  const renderRowActions = (row) => {
    // Compare against the id this row owns; both null sides would otherwise
    // match a cleared `actionId === null` and falsely mark every row busy.
    const rowActionId = row.kind === 'linked' ? row.userId : row.inviteId
    const busy = actionId != null && rowActionId != null && actionId === rowActionId

    if (row.kind === 'linked') {
      return (
        <CButton
          color="danger"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => handleUnlink(row.userId, row.name)}
          title="Remove parent's access to this student"
        >
          {busy ? (
            <CSpinner size="sm" />
          ) : (
            <>
              <CIcon icon={cilXCircle} className="me-1" />
              Remove
            </>
          )}
        </CButton>
      )
    }

    return (
      <>
        {row.code ? (
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => handleCopyCode(row.rowId, row.code)}
            title="Copy invite link"
          >
            <CIcon icon={cilCopy} className="me-1" />
            {copiedRowId === row.rowId ? 'Copied!' : 'Copy link'}
          </CButton>
        ) : null}
        <CButton
          color="primary"
          variant="outline"
          size="sm"
          disabled={busy || (row.status !== 'invited' && row.status !== 'invite_expired')}
          onClick={() => handleResend(row.inviteId)}
        >
          {busy ? <CSpinner size="sm" /> : 'Resend'}
        </CButton>
        <CButton
          color="danger"
          variant="outline"
          size="sm"
          disabled={busy || row.status !== 'invited'}
          onClick={() => handleRevoke(row.inviteId)}
          title={row.status === 'invited' ? 'Revoke invite' : 'Already inactive'}
        >
          Revoke
        </CButton>
      </>
    )
  }

  return (
    <CCard>
      <CCardHeader className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
        <div>
          <strong>Parents &amp; guardians</strong>
          <div className="small text-body-secondary">{summary}</div>
        </div>
        <div className="d-flex gap-2">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
          <CButton color="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            <CIcon icon={cilPlus} className="me-1" />
            Invite parent
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        {error?.message ? (
          <CAlert
            color="danger"
            className="py-2 d-flex align-items-center justify-content-between gap-2"
          >
            <span>{error.message}</span>
            <CButton color="danger" variant="outline" size="sm" onClick={reload}>
              Retry
            </CButton>
          </CAlert>
        ) : null}

        {actionError?.message ? (
          <CAlert color="danger" className="py-2" dismissible onClose={clearActionError}>
            {actionError.message}
          </CAlert>
        ) : null}

        {loading && rows.length === 0 ? (
          <div className="text-center py-4">
            <CSpinner size="sm" />
          </div>
        ) : null}

        {!loading && rows.length === 0 ? (
          <div className="text-center text-body-secondary py-4">
            <CIcon icon={cilUser} size="xl" className="mb-2" />
            <div>No parents yet. Send an invite to give a parent access to this student.</div>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="list-unstyled mb-0">
            {rows.map((row) => {
              const meta = STATUS_META[row.status] || STATUS_META.invited
              const tsText =
                row.kind === 'linked'
                  ? `linked ${formatTs(row.timestamp)}`
                  : row.status === 'invite_expired'
                    ? `invited ${formatTs(row.timestamp)} · expired ${formatTs(row.expiresAt)}`
                    : `invited ${formatTs(row.timestamp)}${row.expiresAt ? ` · expires ${formatTs(row.expiresAt)}` : ''}`
              const avatarClass =
                row.status === 'linked'
                  ? 'bg-success-subtle text-success'
                  : 'bg-body-secondary text-body-secondary'
              return (
                <li
                  key={row.rowId}
                  className="d-flex flex-wrap align-items-center gap-3 border-bottom py-2"
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center fw-semibold ${avatarClass}`}
                    style={{ width: 36, height: 36, minWidth: 36 }}
                    aria-hidden
                  >
                    {initialsFromName(row.name || row.email)}
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="fw-semibold text-truncate">{row.name || row.email || '—'}</div>
                    <div className="small text-body-secondary text-truncate">
                      {row.name && row.email ? `${row.email} · ` : ''}
                      {tsText}
                    </div>
                  </div>
                  <CBadge color={meta.color}>{meta.label}</CBadge>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {renderRowActions(row)}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </CCardBody>

      <InviteParentModal
        visible={showInviteModal}
        studentName={studentName}
        submitting={submit.loading}
        error={submit.error}
        onClose={() => {
          if (submit.loading) return
          clearSubmit()
          setShowInviteModal(false)
        }}
        onSubmit={handleInvite}
      />
    </CCard>
  )
}

export default StudentParentsCard
