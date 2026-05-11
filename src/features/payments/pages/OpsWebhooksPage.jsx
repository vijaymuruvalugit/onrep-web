import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
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
import { opsApi } from '../api/opsApi'

/**
 * Platform-admin ops: webhook orphans + processed events queue (Phase 4.1).
 *
 * UI rule: this is an EXCEPTION queue. Each row should be resolvable in 1–2
 * clicks. We deliberately omit free-text reports, charts, or filters that
 * encourage browsing — ops should only land here when something is wrong.
 */
function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN')
  } catch {
    return String(d)
  }
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return <CBadge color="success">{s}</CBadge>
  if (s === 'processing') return <CBadge color="info">{s}</CBadge>
  if (s === 'failed') return <CBadge color="danger">{s}</CBadge>
  return <CBadge color="secondary">{s || '—'}</CBadge>
}

function ResolveOrphanModal({ orphan, onClose, onResolved }) {
  const [obligationId, setObligationId] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  if (!orphan) return null

  const submit = async (action) => {
    setError(null)
    if (action === 'attach' && !obligationId) {
      setError('Obligation ID required to attach payment.')
      return
    }
    setBusy(true)
    try {
      await opsApi.resolveOrphan(orphan.id, {
        action,
        obligationId: action === 'attach' ? obligationId : null,
        notes: notes || null,
      })
      onResolved()
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={!!orphan} onClose={onClose} backdrop="static">
      <CModalHeader>Resolve orphaned payment</CModalHeader>
      <CModalBody>
        {error ? <CAlert color="danger">{error}</CAlert> : null}
        <dl className="row">
          <dt className="col-sm-4">Razorpay payment</dt>
          <dd className="col-sm-8">
            <code>{orphan.razorpay_payment_id}</code>
          </dd>
          <dt className="col-sm-4">Amount</dt>
          <dd className="col-sm-8">₹{(Number(orphan.paid_paise) / 100).toFixed(2)}</dd>
          <dt className="col-sm-4">Academy</dt>
          <dd className="col-sm-8">{orphan.academy_id || '—'}</dd>
        </dl>
        <hr />
        <label className="form-label">Attach to obligation ID</label>
        <CFormInput value={obligationId} onChange={(e) => setObligationId(e.target.value)} />
        <label className="form-label mt-3">Ops notes (optional)</label>
        <CFormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" disabled={busy} onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="danger" variant="outline" disabled={busy} onClick={() => submit('reject')}>
          Reject
        </CButton>
        <CButton color="primary" disabled={busy} onClick={() => submit('attach')}>
          {busy ? <CSpinner size="sm" /> : 'Attach'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default function OpsWebhooksPage() {
  const [orphans, setOrphans] = useState([])
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('open')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [o, e] = await Promise.all([
        opsApi.listOrphans({ status }),
        opsApi.listProcessedEvents({ limit: 50 }),
      ])
      setOrphans(o)
      setEvents(e)
    } catch (err) {
      setError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <div className="p-4">
      <h2 className="mb-3">Ops · Webhooks</h2>
      {error ? <CAlert color="danger">{error}</CAlert> : null}

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Parent-payment orphans</strong>
          <CButtonGroup>
            <CButton
              size="sm"
              color="secondary"
              variant={status === 'open' ? 'outline' : 'ghost'}
              onClick={() => setStatus('open')}
            >
              Open
            </CButton>
            <CButton
              size="sm"
              color="secondary"
              variant={status === 'resolved' ? 'outline' : 'ghost'}
              onClick={() => setStatus('resolved')}
            >
              Resolved
            </CButton>
            <CButton size="sm" color="primary" onClick={reload}>
              Refresh
            </CButton>
          </CButtonGroup>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner size="sm" />
          ) : orphans.length === 0 ? (
            <em>No {status} orphans.</em>
          ) : (
            <CTable hover responsive size="sm">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Received</CTableHeaderCell>
                  <CTableHeaderCell>Payment ID</CTableHeaderCell>
                  <CTableHeaderCell>Amount</CTableHeaderCell>
                  <CTableHeaderCell>Academy</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {orphans.map((o) => (
                  <CTableRow key={o.id}>
                    <CTableDataCell>{fmtDate(o.created_at)}</CTableDataCell>
                    <CTableDataCell>
                      <code className="small">{o.razorpay_payment_id}</code>
                    </CTableDataCell>
                    <CTableDataCell>₹{(Number(o.paid_paise) / 100).toFixed(2)}</CTableDataCell>
                    <CTableDataCell>{o.academy_id ? o.academy_id.slice(0, 8) : '—'}</CTableDataCell>
                    <CTableDataCell>
                      {o.resolved_at ? (
                        <CBadge color="success">{o.resolution_action || 'resolved'}</CBadge>
                      ) : (
                        <CButton size="sm" color="primary" onClick={() => setResolving(o)}>
                          Resolve
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>Processed webhook events</strong>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner size="sm" />
          ) : events.length === 0 ? (
            <em>No webhook events yet.</em>
          ) : (
            <CTable hover responsive size="sm">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Created</CTableHeaderCell>
                  <CTableHeaderCell>Event</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Attempts</CTableHeaderCell>
                  <CTableHeaderCell>Error</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {events.map((e) => (
                  <CTableRow key={e.razorpay_event_id}>
                    <CTableDataCell>{fmtDate(e.created_at)}</CTableDataCell>
                    <CTableDataCell>{e.event_type}</CTableDataCell>
                    <CTableDataCell>
                      <StatusBadge status={e.processing_status} />
                    </CTableDataCell>
                    <CTableDataCell>{e.attempt_count || 0}</CTableDataCell>
                    <CTableDataCell className="text-truncate" style={{ maxWidth: 320 }}>
                      <span className="small text-muted">{e.error_message || '—'}</span>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <ResolveOrphanModal
        orphan={resolving}
        onClose={() => setResolving(null)}
        onResolved={() => {
          setResolving(null)
          reload()
        }}
      />
    </div>
  )
}
