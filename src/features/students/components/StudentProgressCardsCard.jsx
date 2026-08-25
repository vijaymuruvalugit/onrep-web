import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CPlaceholder,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import studentsApi from '../api/studentsApi'

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

function formatMs(ms) {
  if (ms == null) return '—'
  return `${(Number(ms) / 1000).toFixed(2)}s`
}

function stateBadge(state, stale) {
  if (stale) return <CBadge color="warning">Stale</CBadge>
  if (state === 'published') return <CBadge color="success">Published</CBadge>
  if (state === 'draft') return <CBadge color="secondary">Draft</CBadge>
  if (state === 'revoked') return <CBadge color="danger">Revoked</CBadge>
  return <CBadge color="light">{state || '—'}</CBadge>
}

/**
 * Read-only progress cards oversight on Student Detail (Slice 1F).
 * Metric fields cannot be edited here.
 */
export default function StudentProgressCardsCard({ studentId }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cards, setCards] = useState([])

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError(null)
    try {
      const rows = await studentsApi.getStudentProgressCards(studentId, { limit: 30 })
      setCards(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e?.message || 'Could not load progress cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <CCard className="mb-3">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Progress cards</span>
        {!loading && error ? (
          <CButton color="primary" size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </CButton>
        ) : null}
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <CSpinner size="sm" />
            <CPlaceholder animation="glow" className="flex-grow-1">
              <CPlaceholder xs={10} />
              <CPlaceholder xs={8} />
            </CPlaceholder>
          </div>
        ) : error ? (
          <CAlert color="warning" className="mb-0 small">
            {error}
          </CAlert>
        ) : cards.length === 0 ? (
          <div className="small text-body-secondary fst-italic">
            No progress cards for this athlete yet.
          </div>
        ) : (
          <CTable small responsive hover className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Event</CTableHeaderCell>
                <CTableHeaderCell>Result</CTableHeaderCell>
                <CTableHeaderCell>Classification</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Published</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {cards.map((c) => {
                const snap = c.factualSnapshot || {}
                return (
                  <CTableRow key={c.id}>
                    <CTableDataCell>
                      <div>{snap.eventTitle || 'Race'}</div>
                      <div className="small text-body-secondary">{snap.eventDate || '—'}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      {snap.resultStatus === 'dnf' || snap.resultStatus === 'dns'
                        ? String(snap.resultStatus).toUpperCase()
                        : formatMs(snap.numericValue)}
                    </CTableDataCell>
                    <CTableDataCell className="small">
                      {snap.classification || '—'}
                      {snap.pbBadge ? (
                        <div className="text-body-secondary">{snap.pbBadge}</div>
                      ) : null}
                    </CTableDataCell>
                    <CTableDataCell>
                      {stateBadge(c.state, c.stale)}
                      {c.publishedByName ? (
                        <div className="small text-body-secondary mt-1">{c.publishedByName}</div>
                      ) : null}
                    </CTableDataCell>
                    <CTableDataCell className="small">
                      {formatWhen(c.publishedAt)}
                      {c.revokedAt ? (
                        <div className="text-danger">Revoked {formatWhen(c.revokedAt)}</div>
                      ) : null}
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}
