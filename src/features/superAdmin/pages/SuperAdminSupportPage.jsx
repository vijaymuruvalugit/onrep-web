import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  CFormTextarea,
  CSpinner,
} from '@coreui/react'
import { useSearchParams } from 'react-router-dom'
import { authStorage } from '../../../api/authStorage'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

export default function SuperAdminSupportPage() {
  const [params] = useSearchParams()
  const [targetUserId, setTargetUserId] = useState(params.get('user') || '')
  const [reason, setReason] = useState('')
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    superAdminApi.listActiveImpersonations(true).then(setSessions).catch(() => {})
  }, [success])

  const startSession = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const out = await superAdminApi.startImpersonation({
        targetUserId,
        reason,
        readOnly: true,
      })
      authStorage.setToken(out.token)
      setSuccess(
        `Read-only support session started as ${out.target_user?.email}. Open coach app in this tab; end session when done.`,
      )
    } catch (e) {
      setError(e?.message || 'Failed to start impersonation')
    } finally {
      setLoading(false)
    }
  }

  const endSession = async (sessionId) => {
    await superAdminApi.endImpersonation(sessionId)
    setSuccess('Impersonation ended.')
  }

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Support"
        subtitle="Temporary scoped impersonation — read-only by default, fully audited."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {success ? <CAlert color="success">{success}</CAlert> : null}
      <div className="p-4 bg-white rounded shadow-sm" style={{ maxWidth: 480 }}>
        <CFormInput
          className="mb-3"
          label="Target user ID"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="UUID from Users search"
        />
        <CFormTextarea
          className="mb-3"
          label="Reason (audited)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <CButton color="primary" disabled={loading || !targetUserId || reason.length < 3} onClick={startSession}>
          {loading ? <CSpinner size="sm" /> : 'Start read-only support session'}
        </CButton>
      </div>
      <h6 className="mt-4">Your active sessions</h6>
      {sessions.length === 0 ? (
        <p className="small text-body-secondary">No active impersonation sessions.</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id} className="small">
              {s.target_email} — started {new Date(s.started_at).toLocaleString()}
              <CButton size="sm" color="link" className="ms-2" onClick={() => endSession(s.id)}>
                End
              </CButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
