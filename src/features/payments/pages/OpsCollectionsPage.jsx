import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
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
 * Platform-admin cross-academy collections summary (Phase 4.2).
 * Bounded by indexed time window — default 90 days, hard cap 18 months.
 */
function fmtINR(amount) {
  const n = Number(amount || 0)
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function defaultStart() {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().slice(0, 10)
}

function defaultEnd() {
  return new Date().toISOString().slice(0, 10)
}

export default function OpsCollectionsPage() {
  const [start, setStart] = useState(defaultStart())
  const [end, setEnd] = useState(defaultEnd())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await opsApi.getCollections({ start, end })
      setRows(data?.rows || [])
    } catch (e) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => {
    load()
  }, [load])

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      const csv = await opsApi.getCollections({ start, end, format: 'csv' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `onrep_collections_${start}_${end}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e?.message || 'Failed to download')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="mb-3">Ops · Collections</h2>
      {error ? <CAlert color="danger">{error}</CAlert> : null}

      <CCard className="mb-4">
        <CCardBody className="d-flex align-items-end gap-3 flex-wrap">
          <div>
            <CFormLabel htmlFor="opsStart">Start</CFormLabel>
            <CFormInput id="opsStart" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <CFormLabel htmlFor="opsEnd">End</CFormLabel>
            <CFormInput id="opsEnd" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <CButtonGroup>
            <CButton color="primary" onClick={load}>
              Apply
            </CButton>
            <CButton color="secondary" variant="outline" onClick={downloadCsv} disabled={downloading}>
              {downloading ? <CSpinner size="sm" /> : 'Download CSV'}
            </CButton>
          </CButtonGroup>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>Per-academy collections</strong>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner size="sm" />
          ) : rows.length === 0 ? (
            <em>No collections in this window.</em>
          ) : (
            <CTable hover responsive size="sm">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Academy</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Collected</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Online</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Manual</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Tx</CTableHeaderCell>
                  <CTableHeaderCell>Last payment</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r) => (
                  <CTableRow key={r.academy_id}>
                    <CTableDataCell>{r.academy_name || r.academy_id}</CTableDataCell>
                    <CTableDataCell className="text-end">{fmtINR(r.collected)}</CTableDataCell>
                    <CTableDataCell className="text-end">{fmtINR(r.online)}</CTableDataCell>
                    <CTableDataCell className="text-end">{fmtINR(r.manual)}</CTableDataCell>
                    <CTableDataCell className="text-end">{r.tx_count}</CTableDataCell>
                    <CTableDataCell>
                      {r.last_payment_date
                        ? new Date(r.last_payment_date).toLocaleDateString('en-IN')
                        : '—'}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}
