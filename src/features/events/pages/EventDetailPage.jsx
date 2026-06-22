import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CSpinner, CAlert, CBadge,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CNav, CNavItem, CNavLink, CTabContent, CTabPanel,
  CFormInput, CFormTextarea, CRow, CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilArrowLeft, cilCheck, cilX } from '@coreui/icons'
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

function ParticipantsTab({ eventId, registrations, registrationsMap, loadRegistrations, updateRegistration }) {
  useEffect(() => { if (eventId) loadRegistrations(eventId) }, [eventId])
  const rows = registrationsMap[eventId] || []

  return (
    <div>
      {!rows.length ? (
        <p className="text-body-secondary">No participants yet.</p>
      ) : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Student</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Source</CTableHeaderCell>
              <CTableHeaderCell>RSVP</CTableHeaderCell>
              <CTableHeaderCell>Registered</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((r) => (
              <CTableRow key={r.id}>
                <CTableDataCell>{r.student_name}</CTableDataCell>
                <CTableDataCell><CBadge color="info">{r.status}</CBadge></CTableDataCell>
                <CTableDataCell className="text-body-secondary small">{r.registration_source}</CTableDataCell>
                <CTableDataCell>{r.rsvp_status || '—'}</CTableDataCell>
                <CTableDataCell className="small">{formatDate(r.registered_at)}</CTableDataCell>
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
    registrationsMap, resultsMap, mediaMap, timelineMap,
    mutating, mutateError,
    loadEvent, saveUpdateEvent, doPublish, doCancel, doComplete,
    loadRegistrations, loadResults, loadMedia, loadTimeline, saveResults,
  } = useEvents()

  const [activeTab, setActiveTab] = useState('overview')
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    if (id) loadEvent(id)
  }, [id])

  const handleUpdate = async (payload) => {
    const result = await saveUpdateEvent(id, payload)
    if (!result.error) {
      setShowEdit(false)
      loadEvent(id)
    }
  }

  if (currentEventLoading) return <div className="text-center py-5"><CSpinner /></div>
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
