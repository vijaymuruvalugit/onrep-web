import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert, CButton, CCard, CCardBody, CBadge, CSpinner,
  CNav, CNavItem, CNavLink,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import useEvents from '../hooks/useEvents'
import { CategoryBadge } from '../components/EventStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function regBadge(regs) {
  if (!regs?.length) return null
  return regs.map((r) => (
    <span key={r.student_id} className="me-2 small">
      <strong>{r.student_name || 'Child'}</strong>
      {' — '}
      <CBadge color={r.status === 'REGISTERED' || r.status === 'ATTENDED' ? 'success' : r.status === 'WAITLISTED' ? 'warning' : 'secondary'}>
        {r.status}
      </CBadge>
    </span>
  ))
}

function EventCard({ ev, onClick }) {
  return (
    <CCard className="mb-3" style={{ cursor: 'pointer' }} onClick={onClick}>
      {ev.cover_image_url && (
        <img src={ev.cover_image_url} alt={ev.name} style={{ height: 140, objectFit: 'cover', borderRadius: '0.375rem 0.375rem 0 0' }} />
      )}
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <div className="fw-semibold">{ev.name}</div>
          <CategoryBadge category={ev.category} />
        </div>
        <div className="small text-body-secondary mb-2">
          {formatDate(ev.start_date)}
          {ev.location ? ` · ${ev.location}` : ''}
          {ev.fee_amount ? ` · ${ev.fee_currency} ${Number(ev.fee_amount).toLocaleString('en-IN')}` : ' · Free'}
        </div>
        {ev.children_registrations?.length > 0 ? (
          <div>{regBadge(ev.children_registrations)}</div>
        ) : (
          ev.registration_required
            ? <CBadge color="warning">Register Now</CBadge>
            : <CBadge color="secondary">RSVP Available</CBadge>
        )}
      </CCardBody>
    </CCard>
  )
}

export default function ParentEventsPage() {
  const navigate = useNavigate()
  const { parentEvents, parentEventsLoading, parentEventsError, loadParentEvents } = useEvents()
  const [tab, setTab] = useState('upcoming')

  const load = () => loadParentEvents({ past: tab === 'past' ? 'true' : 'false' })

  useEffect(() => { load() }, [tab])

  return (
    <>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="mb-0">Events</h2>
          <p className="text-body-secondary small mb-0">Academy events for your children.</p>
        </div>
        <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={parentEventsLoading}>
          <CIcon icon={cilReload} className="me-1" />Refresh
        </CButton>
      </div>

      {parentEventsError && (
        <CAlert color="danger" className="d-flex gap-2 align-items-center">
          <span>{parentEventsError.message || 'Unable to load events.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={load}>Retry</CButton>
        </CAlert>
      )}

      <CNav variant="tabs" className="mb-3">
        {['upcoming', 'past'].map((t) => (
          <CNavItem key={t}>
            <CNavLink active={tab === t} onClick={() => setTab(t)} style={{ cursor: 'pointer' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>

      {parentEventsLoading && !parentEvents.length ? (
        <div className="text-center py-4"><CSpinner /></div>
      ) : !parentEvents.length ? (
        <CAlert color="info">No {tab} events.</CAlert>
      ) : (
        parentEvents.map((ev) => (
          <EventCard key={ev.id} ev={ev} onClick={() => navigate(`/parent/events/${ev.id}`)} />
        ))
      )}
    </>
  )
}
