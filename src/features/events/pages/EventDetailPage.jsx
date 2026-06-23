import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CSpinner, CAlert, CBadge, CCol, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CNav, CNavItem, CNavLink,
  CFormInput, CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilArrowLeft, cilPlus, cilX } from '@coreui/icons'
import http from '../../../api/http'
import useEvents from '../hooks/useEvents'
import EventFormModal from '../components/EventFormModal'
import { StatusBadge, CategoryBadge } from '../components/EventStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function RevenueCard({ metrics }) {
  if (!metrics) return null
  return (
    <CCard className="mb-3 border-success">
      <CCardBody>
        <div className="text-success fw-semibold small text-uppercase mb-1">Revenue Potential</div>
        <div className="fs-5 fw-bold">{metrics.label}</div>
        {metrics.capacity && (
          <div className="small text-body-secondary mt-1">
            {metrics.available_spots} spot{metrics.available_spots !== 1 ? 's' : ''} remaining
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

function StudentSearchPicker({ onAdd, adding, existingIds }) {
  const [query, setQuery] = useState('')
  const [allStudents, setAllStudents] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    http.get('/students').then(({ data }) => setAllStudents(data.students || [])).catch(() => {})
  }, [])

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = query.trim().length >= 1
    ? allStudents.filter(
        (s) => !existingIds.has(s.id) &&
          s.full_name.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div ref={ref} style={{ position: 'relative', maxWidth: 320 }}>
      <CFormInput
        size="sm"
        placeholder="Search students to add…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 100, top: '100%', left: 0,
          minWidth: '100%', width: 'max-content',
          background: 'var(--cui-body-bg, #fff)',
          border: '1px solid var(--cui-border-color, #dee2e6)',
          borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
        }}>
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              className="d-flex align-items-center gap-2 px-3 py-2 w-100 text-start border-0 bg-transparent"
              style={{ fontSize: 14, cursor: adding ? 'not-allowed' : 'pointer' }}
              disabled={adding}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onAdd(s); setQuery(''); setOpen(false) }}
            >
              <span
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}
              >
                {s.full_name.charAt(0).toUpperCase()}
              </span>
              <span>{s.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipantsTab({ eventId, registrationsMap, loadRegistrations, addRegistrations, mutating }) {
  useEffect(() => { if (eventId) loadRegistrations(eventId) }, [eventId])
  const rows = registrationsMap[eventId] || []
  const existingIds = new Set(rows.map((r) => r.student_id))

  const handleAdd = async (student) => {
    await addRegistrations(eventId, [student.id], 'REGISTERED')
    loadRegistrations(eventId)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small text-body-secondary">{rows.length} participant{rows.length !== 1 ? 's' : ''}</span>
        <StudentSearchPicker onAdd={handleAdd} adding={mutating} existingIds={existingIds} />
      </div>
      {!rows.length ? (
        <p className="text-body-secondary">No participants yet. Search above to add students.</p>
      ) : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Student</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>RSVP</CTableHeaderCell>
              <CTableHeaderCell>Source</CTableHeaderCell>
              <CTableHeaderCell>Registered</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((r) => (
              <CTableRow key={r.id}>
                <CTableDataCell className="fw-semibold">{r.student_name}</CTableDataCell>
                <CTableDataCell><CBadge color={r.status === 'REGISTERED' || r.status === 'ATTENDED' ? 'success' : r.status === 'WAITLISTED' ? 'warning' : 'secondary'}>{r.status}</CBadge></CTableDataCell>
                <CTableDataCell>{r.rsvp_status ? <CBadge color="info">{r.rsvp_status}</CBadge> : <span className="text-body-secondary">—</span>}</CTableDataCell>
                <CTableDataCell className="text-body-secondary small">{r.registration_source}</CTableDataCell>
                <CTableDataCell className="small text-body-secondary">{formatDate(r.registered_at)}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  )
}

function ResultsTab({ eventId, resultsMap, loadResults, saveResults, mutating }) {
  useEffect(() => { if (eventId) loadResults(eventId) }, [eventId])
  const rows = resultsMap[eventId] || []
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(false)

  const setEdit = (studentId, field, value) => {
    setEdits((e) => ({
      ...e,
      [studentId]: { ...(e[studentId] || {}), [field]: value },
    }))
  }

  const handleSave = async () => {
    const items = rows.map((r) => ({
      student_id: r.student_id,
      metadata_json: {
        ...(r.metadata_json || {}),
        ...(edits[r.student_id] || {}),
      },
    }))
    await saveResults(eventId, items)
    setEdits({})
  }

  const metaField = (row, field) => {
    const edit = edits[row.student_id]
    if (edit && field in edit) return edit[field]
    return row.metadata_json?.[field] || ''
  }

  return (
    <div>
      {!rows.length ? (
        <p className="text-body-secondary">No results yet.</p>
      ) : (
        <>
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Achievement</CTableHeaderCell>
                <CTableHeaderCell>Remarks</CTableHeaderCell>
                <CTableHeaderCell>Rank</CTableHeaderCell>
                <CTableHeaderCell>Score</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((r) => (
                <CTableRow key={r.id}>
                  <CTableDataCell>{r.student_name}</CTableDataCell>
                  <CTableDataCell>
                    <CFormInput
                      size="sm"
                      value={metaField(r, 'achievement')}
                      onChange={(e) => setEdit(r.student_id, 'achievement', e.target.value)}
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput
                      size="sm"
                      value={metaField(r, 'remarks')}
                      onChange={(e) => setEdit(r.student_id, 'remarks', e.target.value)}
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput
                      size="sm"
                      type="number"
                      value={metaField(r, 'rank')}
                      onChange={(e) => setEdit(r.student_id, 'rank', e.target.value)}
                      style={{ width: 80 }}
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput
                      size="sm"
                      type="number"
                      value={metaField(r, 'score')}
                      onChange={(e) => setEdit(r.student_id, 'score', e.target.value)}
                      style={{ width: 80 }}
                    />
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
          {Object.keys(edits).length > 0 && (
            <CButton color="primary" size="sm" onClick={handleSave} disabled={mutating}>
              {mutating ? <CSpinner size="sm" className="me-1" /> : null}Save Results
            </CButton>
          )}
        </>
      )}
    </div>
  )
}

function TimelineTab({ eventId, timelineMap, loadTimeline }) {
  useEffect(() => { if (eventId) loadTimeline(eventId) }, [eventId])
  const rows = timelineMap[eventId] || []

  return (
    <div>
      {!rows.length ? (
        <p className="text-body-secondary">No timeline milestones yet.</p>
      ) : (
        <ul className="list-unstyled">
          {rows.map((t) => (
            <li key={t.id} className="mb-3 d-flex gap-3">
              <span className="text-body-secondary small" style={{ minWidth: 160 }}>{formatDate(t.occurred_at)}</span>
              <div>
                <CBadge color="secondary" className="me-2">{t.milestone}</CBadge>
                {t.note && <span className="small">{t.note}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function EventDetailPage() {
  const { eventId: id } = useParams()
  const navigate = useNavigate()
  const {
    currentEvent, currentEventLoading, currentEventError,
    registrationsMap, resultsMap, timelineMap,
    mutating, mutateError,
    loadEvent, saveUpdateEvent, doPublish, doCancel, doComplete,
    loadRegistrations, addRegistrations, loadResults, loadTimeline, saveResults,
    resetCurrentEvent,
  } = useEvents()

  const [activeTab, setActiveTab] = useState('overview')
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    // Clear stale data from a previous detail page so we never flash the wrong event.
    resetCurrentEvent()
    if (id) loadEvent(id)
  }, [id])

  const handleUpdate = async (payload) => {
    const result = await saveUpdateEvent(id, payload)
    if (!result.error) {
      setShowEdit(false)
      loadEvent(id)
    }
  }

  if (currentEventLoading || (!currentEvent && !currentEventError)) return <div className="text-center py-5"><CSpinner /></div>
  if (currentEventError) return <CAlert color="danger">{currentEventError.message}</CAlert>
  if (!currentEvent) return null

  const ev = currentEvent

  return (
    <>
      <div className="mb-3">
        <CButton color="secondary" variant="ghost" size="sm" onClick={() => navigate('/coach/events')}>
          <CIcon icon={cilArrowLeft} className="me-1" />Events
        </CButton>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="mb-1">{ev.name}</h2>
          <div className="d-flex gap-2 flex-wrap">
            <CategoryBadge category={ev.category} />
            <StatusBadge status={ev.status} />
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {ev.status === 'DRAFT' && (
            <CButton size="sm" color="success" onClick={() => doPublish(id)}>Publish</CButton>
          )}
          {ev.status === 'PUBLISHED' && (
            <CButton size="sm" color="info" onClick={() => doComplete(id)}>Mark Complete</CButton>
          )}
          {['DRAFT', 'PUBLISHED'].includes(ev.status) && (
            <CButton size="sm" color="danger" variant="outline" onClick={() => doCancel(id)}>Cancel Event</CButton>
          )}
          <CButton size="sm" color="primary" variant="outline" onClick={() => setShowEdit(true)}>
            <CIcon icon={cilPencil} className="me-1" />Edit
          </CButton>
        </div>
      </div>

      {mutateError && <CAlert color="danger" className="mb-3">{mutateError.message}</CAlert>}

      <CNav variant="tabs" className="mb-3">
        {['overview', 'participants', 'results', 'timeline'].map((tab) => (
          <CNavItem key={tab}>
            <CNavLink active={activeTab === tab} onClick={() => setActiveTab(tab)} style={{ cursor: 'pointer' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>

      {activeTab === 'overview' && (
        <div>
          {ev.revenue_metrics && <RevenueCard metrics={ev.revenue_metrics} />}

          <CCard>
            <CCardBody>
              <CRow>
                <CCol md={6}>
                  <dl>
                    <dt className="small text-body-secondary">Date</dt>
                    <dd>{formatDate(ev.start_date)}{ev.end_date ? ` – ${formatDate(ev.end_date)}` : ''}</dd>
                    <dt className="small text-body-secondary">Location</dt>
                    <dd>{ev.location || '—'}</dd>
                    <dt className="small text-body-secondary">Fee</dt>
                    <dd>{ev.fee_amount ? `${ev.fee_currency} ${Number(ev.fee_amount).toLocaleString('en-IN')}` : 'Free'}</dd>
                  </dl>
                </CCol>
                <CCol md={6}>
                  <dl>
                    <dt className="small text-body-secondary">Registration</dt>
                    <dd>
                      {ev.registration_required ? 'Required' : 'Not Required (RSVP only)'}
                      {ev.capacity ? ` · Capacity: ${ev.capacity}` : ''}
                      {ev.waitlist_enabled ? ' · Waitlist on' : ''}
                    </dd>
                    {(ev.registration_open_date || ev.registration_close_date) && (
                      <>
                        <dt className="small text-body-secondary">Registration Window</dt>
                        <dd>
                          {ev.registration_open_date ? formatDate(ev.registration_open_date) : '—'}
                          {' → '}
                          {ev.registration_close_date ? formatDate(ev.registration_close_date) : 'Open'}
                        </dd>
                      </>
                    )}
                    {ev.rsvp_deadline && (
                      <>
                        <dt className="small text-body-secondary">RSVP Deadline</dt>
                        <dd>{formatDate(ev.rsvp_deadline)}</dd>
                      </>
                    )}
                    <dt className="small text-body-secondary">Scope / Audience</dt>
                    <dd>{ev.scope} · {ev.target_audience}</dd>
                    <dt className="small text-body-secondary">Visibility</dt>
                    <dd>{ev.visibility}</dd>
                  </dl>
                </CCol>
              </CRow>
              {ev.description && <p className="mt-2">{ev.description}</p>}
            </CCardBody>
          </CCard>
        </div>
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab
          eventId={id}
          registrationsMap={registrationsMap}
          loadRegistrations={loadRegistrations}
          addRegistrations={addRegistrations}
          mutating={mutating}
        />
      )}

      {activeTab === 'results' && (
        <ResultsTab
          eventId={id}
          resultsMap={resultsMap}
          loadResults={loadResults}
          saveResults={saveResults}
          mutating={mutating}
        />
      )}

      {activeTab === 'timeline' && (
        <TimelineTab
          eventId={id}
          timelineMap={timelineMap}
          loadTimeline={loadTimeline}
        />
      )}

      <EventFormModal
        visible={showEdit}
        event={ev}
        submitting={mutating}
        error={mutateError}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
      />
    </>
  )
}
