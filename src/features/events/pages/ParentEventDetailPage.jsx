import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CSpinner, CAlert, CBadge,
  CNav, CNavItem, CNavLink, CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import useEvents from '../hooks/useEvents'
import { CategoryBadge } from '../components/EventStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function RegistrationStatusBadge({ status }) {
  const color = status === 'REGISTERED' || status === 'ATTENDED' ? 'success'
    : status === 'WAITLISTED' ? 'warning'
    : status === 'CANCELLED' ? 'danger'
    : 'secondary'
  return <CBadge color={color}>{status}</CBadge>
}

function FamilyRegisterSection({ event, registrations, onRegister, loading, result, error }) {
  const regMap = Object.fromEntries((registrations || []).map((r) => [r.student_id, r]))
  const children = registrations || []

  // We need a list of children from the user context — for now derive from registrations + the event
  // In practice the parent's children are accessible from event.children_registrations
  const [selected, setSelected] = useState({})

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }))

  const unregistered = children.filter((r) => !['REGISTERED', 'ATTENDED', 'WAITLISTED'].includes(r.status))
  const registered = children.filter((r) => ['REGISTERED', 'ATTENDED', 'WAITLISTED'].includes(r.status))

  if (!event.registration_required) return null

  const regIsOpen = () => {
    const now = new Date()
    if (event.registration_open_date && now < new Date(event.registration_open_date)) return false
    if (event.registration_close_date && now > new Date(event.registration_close_date)) return false
    return true
  }

  const canRegister = event.status === 'PUBLISHED' && regIsOpen()

  return (
    <CCard className="mb-3">
      <CCardHeader className="fw-semibold">Registration</CCardHeader>
      <CCardBody>
        {registered.map((r) => (
          <div key={r.student_id} className="d-flex justify-content-between align-items-center mb-2">
            <span>{r.student_name}</span>
            <RegistrationStatusBadge status={r.status} />
          </div>
        ))}

        {canRegister && (
          <>
            {result?.results ? (
              <div>
                {result.results.map((r) => (
                  <div key={r.student_id} className="d-flex justify-content-between mb-1">
                    <span className="small">{r.student_id}</span>
                    <CBadge color={r.outcome === 'WAITLISTED' ? 'warning' : r.outcome === 'ALREADY_REGISTERED' ? 'secondary' : 'success'}>
                      {r.outcome}
                    </CBadge>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {error && <CAlert color="danger" className="py-2 mb-2">{error.message || 'Registration failed'}</CAlert>}
                <p className="small text-body-secondary mb-2">Select children to register:</p>
                {children.filter((r) => !['REGISTERED', 'ATTENDED', 'WAITLISTED'].includes(r.status)).map((r) => (
                  <CFormCheck
                    key={r.student_id}
                    id={`reg-${r.student_id}`}
                    label={r.student_name}
                    checked={!!selected[r.student_id]}
                    onChange={() => toggle(r.student_id)}
                    className="mb-1"
                  />
                ))}
                {event.fee_amount && (
                  <p className="small text-body-secondary mt-2">
                    Fee: {event.fee_currency} {Number(event.fee_amount).toLocaleString('en-IN')} per child
                    {Object.values(selected).filter(Boolean).length > 0 && (
                      <> → Total: {event.fee_currency} {(Number(event.fee_amount) * Object.values(selected).filter(Boolean).length).toLocaleString('en-IN')}</>
                    )}
                  </p>
                )}
                {event.capacity && (
                  <p className="small text-body-secondary">
                    {event.waitlist_enabled ? 'Waitlist available if capacity is full.' : 'Limited spots — register soon.'}
                  </p>
                )}
                <CButton
                  color="primary"
                  size="sm"
                  className="mt-2"
                  disabled={loading || !Object.values(selected).some(Boolean)}
                  onClick={() => onRegister(Object.entries(selected).filter(([, v]) => v).map(([id]) => ({ student_id: id })))}
                >
                  {loading ? <><CSpinner size="sm" className="me-1" />Registering…</> : 'Register Selected Children'}
                </CButton>
              </>
            )}
          </>
        )}

        {!canRegister && !registered.length && (
          <p className="text-body-secondary small mb-0">
            {event.status !== 'PUBLISHED' ? 'Event not published yet.' : 'Registration is currently closed.'}
          </p>
        )}
      </CCardBody>
    </CCard>
  )
}

function RsvpSection({ event, registrations, onRsvp }) {
  if (event.registration_required) return null

  return (
    <CCard className="mb-3">
      <CCardHeader className="fw-semibold">RSVP</CCardHeader>
      <CCardBody>
        {(registrations || []).map((r) => (
          <div key={r.student_id} className="d-flex justify-content-between align-items-center mb-2">
            <span>{r.student_name}</span>
            <div className="d-flex gap-1">
              {['YES', 'NO', 'MAYBE'].map((opt) => (
                <CButton
                  key={opt}
                  size="sm"
                  color={r.rsvp_status === opt ? 'primary' : 'secondary'}
                  variant={r.rsvp_status === opt ? undefined : 'outline'}
                  onClick={() => onRsvp(r.student_id, opt)}
                >
                  {opt}
                </CButton>
              ))}
            </div>
          </div>
        ))}
      </CCardBody>
    </CCard>
  )
}

export default function ParentEventDetailPage() {
  const { eventId: id } = useParams()
  const navigate = useNavigate()
  const {
    parentCurrentEvent, parentCurrentEventLoading, parentCurrentEventError,
    familyRegisterResult, familyRegisterLoading, familyRegisterError,
    timelineMap, resultsMap,
    loadParentEvent, doFamilyRegister, doRsvp,
    loadTimeline,
  } = useEvents()

  const [tab, setTab] = useState('details')

  useEffect(() => {
    if (id) {
      loadParentEvent(id)
      loadTimeline(id)
    }
  }, [id])

  if (parentCurrentEventLoading) return <div className="text-center py-5"><CSpinner /></div>
  if (parentCurrentEventError) return <CAlert color="danger">{parentCurrentEventError.message}</CAlert>
  if (!parentCurrentEvent) return null

  const ev = parentCurrentEvent
  const timeline = timelineMap[id] || []

  return (
    <>
      <div className="mb-3">
        <CButton color="secondary" variant="ghost" size="sm" onClick={() => navigate('/parent/events')}>
          <CIcon icon={cilArrowLeft} className="me-1" />Events
        </CButton>
      </div>

      {ev.cover_image_url && (
        <img src={ev.cover_image_url} alt={ev.name} className="w-100 mb-3 rounded" style={{ height: 200, objectFit: 'cover' }} />
      )}

      <div className="mb-3">
        <h2 className="mb-1">{ev.name}</h2>
        <CategoryBadge category={ev.category} />
        <p className="text-body-secondary small mt-2 mb-0">
          {formatDate(ev.start_date)}
          {ev.location ? ` · ${ev.location}` : ''}
          {ev.fee_amount ? ` · ${ev.fee_currency} ${Number(ev.fee_amount).toLocaleString('en-IN')}` : ' · Free'}
        </p>
      </div>

      {ev.description && <p className="mb-3">{ev.description}</p>}

      <FamilyRegisterSection
        event={ev}
        registrations={ev.children_registrations}
        onRegister={(regs) => doFamilyRegister(id, regs)}
        loading={familyRegisterLoading}
        result={familyRegisterResult}
        error={familyRegisterError}
      />

      <RsvpSection
        event={ev}
        registrations={ev.children_registrations}
        onRsvp={(studentId, rsvpStatus) => doRsvp(id, studentId, rsvpStatus)}
      />

      {timeline.length > 0 && (
        <CCard className="mb-3">
          <CCardHeader className="fw-semibold">Timeline</CCardHeader>
          <CCardBody>
            <ul className="list-unstyled mb-0">
              {timeline.map((t) => (
                <li key={t.id} className="mb-2 small">
                  <CBadge color="secondary" className="me-2">{t.milestone}</CBadge>
                  {t.note && <span>{t.note} · </span>}
                  <span className="text-body-secondary">{formatDate(t.occurred_at)}</span>
                </li>
              ))}
            </ul>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}
