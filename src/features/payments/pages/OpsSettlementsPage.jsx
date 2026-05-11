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
  CFormLabel,
  CFormSelect,
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
 * Platform-admin: per-academy settlements (Phase 5.3).
 *
 * Reinforces the immutable-snapshot rule via UI copy: refunds completed AFTER
 * a period close do not retro-mutate that period — they show up in the period
 * they completed in.
 */
function fmtINR(paise) {
  const n = (Number(paise || 0)) / 100
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

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
  if (s === 'paid') return <CBadge color="success">{s}</CBadge>
  if (s === 'reviewed') return <CBadge color="info">{s}</CBadge>
  if (s === 'disputed') return <CBadge color="danger">{s}</CBadge>
  if (s === 'cancelled') return <CBadge color="secondary">{s}</CBadge>
  return <CBadge color="warning">{s || 'pending'}</CBadge>
}

function StatusModal({ row, onClose, onSaved }) {
  const [status, setStatus] = useState(row?.status || 'pending')
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  if (!row) return null
  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      await opsApi.setSettlementStatus(row.id, {
        status,
        paid_reference: ref || null,
        notes: notes || null,
      })
      onSaved()
    } catch (e) {
      setErr(e?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <CModal visible={!!row} onClose={onClose} backdrop="static">
      <CModalHeader>Update settlement status</CModalHeader>
      <CModalBody>
        {err ? <CAlert color="danger">{err}</CAlert> : null}
        <CFormLabel>Status</CFormLabel>
        <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">pending</option>
          <option value="reviewed">reviewed</option>
          <option value="paid">paid</option>
          <option value="disputed">disputed</option>
          <option value="cancelled">cancelled</option>
        </CFormSelect>
        <CFormLabel className="mt-3">Paid reference (UTR / txn id)</CFormLabel>
        <CFormInput value={ref} onChange={(e) => setRef(e.target.value)} />
        <CFormLabel className="mt-3">Notes</CFormLabel>
        <CFormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={submit} disabled={busy}>
          {busy ? <CSpinner size="sm" /> : 'Save'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default function OpsSettlementsPage() {
  const [academyId, setAcademyId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [genStart, setGenStart] = useState('')
  const [genEnd, setGenEnd] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    if (!academyId) return
    setLoading(true)
    setError(null)
    try {
      const data = await opsApi.listSettlements(academyId)
      setRows(data)
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [academyId])

  useEffect(() => {
    if (academyId) load()
  }, [academyId, load])

  const generate = async () => {
    setError(null)
    setGenerating(true)
    try {
      await opsApi.generateSettlement(academyId, { startAt: genStart, endAt: genEnd })
      setGenStart('')
      setGenEnd('')
      await load()
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="mb-3">Ops · Settlements</h2>
      <CAlert color="info">
        Settlements are immutable snapshots. Refunds completed after a period close land in
        the period they completed in — they do not retro-mutate earlier settlements.
      </CAlert>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Lookup</strong>
        </CCardHeader>
        <CCardBody className="d-flex gap-2 align-items-end">
          <div style={{ flex: 1 }}>
            <CFormLabel htmlFor="aid">Academy ID</CFormLabel>
            <CFormInput
              id="aid"
              value={academyId}
              placeholder="uuid"
              onChange={(e) => setAcademyId(e.target.value.trim())}
            />
          </div>
          <CButton color="primary" onClick={load} disabled={!academyId || loading}>
            {loading ? <CSpinner size="sm" /> : 'Load'}
          </CButton>
        </CCardBody>
      </CCard>

      {academyId ? (
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Generate new settlement</strong>
          </CCardHeader>
          <CCardBody className="d-flex gap-2 align-items-end flex-wrap">
            <div>
              <CFormLabel>Start (ISO)</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={genStart}
                onChange={(e) => setGenStart(e.target.value)}
              />
            </div>
            <div>
              <CFormLabel>End (ISO)</CFormLabel>
              <CFormInput
                type="datetime-local"
                value={genEnd}
                onChange={(e) => setGenEnd(e.target.value)}
              />
            </div>
            <CButton
              color="primary"
              onClick={generate}
              disabled={!genStart || !genEnd || generating}
            >
              {generating ? <CSpinner size="sm" /> : 'Generate'}
            </CButton>
          </CCardBody>
        </CCard>
      ) : null}

      {error ? <CAlert color="danger">{error}</CAlert> : null}

      {academyId && rows.length > 0 ? (
        <CCard>
          <CCardHeader>
            <strong>Settlement history</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover responsive size="sm">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Period</CTableHeaderCell>
                  <CTableHeaderCell>Gross</CTableHeaderCell>
                  <CTableHeaderCell>Refunds</CTableHeaderCell>
                  <CTableHeaderCell>Fee</CTableHeaderCell>
                  <CTableHeaderCell>Net payable</CTableHeaderCell>
                  <CTableHeaderCell>Tx / Refunds</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      {fmtDate(r.settlement_start_at)} → {fmtDate(r.settlement_end_at)}
                    </CTableDataCell>
                    <CTableDataCell>{fmtINR(r.gross_collected_paise)}</CTableDataCell>
                    <CTableDataCell>{fmtINR(r.refund_total_paise)}</CTableDataCell>
                    <CTableDataCell>
                      {fmtINR(r.platform_fee_paise)}
                      <div className="small text-muted">@ {r.platform_fee_percent}%</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{fmtINR(r.net_payable_paise)}</strong>
                    </CTableDataCell>
                    <CTableDataCell>
                      {r.transaction_count} / {r.refund_count}
                    </CTableDataCell>
                    <CTableDataCell>
                      <StatusBadge status={r.status} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="primary" variant="outline" onClick={() => setEditing(r)}>
                        Update
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      ) : null}

      <StatusModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    </div>
  )
}
