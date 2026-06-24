import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CSpinner, CAlert,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CNav, CNavItem, CNavLink, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload } from '@coreui/icons'
import useEvents from '../hooks/useEvents'
import EventFormModal from '../components/EventFormModal'
import { CategoryBadge } from '../components/EventStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EventsListPage() {
  const navigate = useNavigate()
  const {
    events, eventsLoading, eventsError,
    mutating, mutateError,
    loadEvents, saveCreateEvent,
  } = useEvents()

  const [activeTab, setActiveTab] = useState('active')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    loadEvents({ tab: activeTab })
  }, [activeTab, loadEvents])

  useEffect(() => { load() }, [load])

  const handleCreate = async (payload) => {
    const result = await saveCreateEvent(payload)
    if (!result.error) {
      setShowForm(false)
      setActiveTab('active')
    }
  }

  const tabs = [
    { key: 'active', label: 'Events' },
    { key: 'past', label: 'Past' },
  ]

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="mb-0">Events</h2>
          <p className="text-body-secondary small mb-0">Competitions, workshops, camps and more.</p>
        </div>
        <div className="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={eventsLoading}>
            <CIcon icon={cilReload} className="me-1" />Refresh
          </CButton>
          <CButton color="primary" size="sm" onClick={() => setShowForm(true)}>
            <CIcon icon={cilPlus} className="me-1" />New Event
          </CButton>
        </div>
      </div>

      {eventsError && (
        <CAlert color="danger" className="d-flex gap-2 align-items-center">
          <span>{eventsError.message || 'Failed to load events.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={load}>Retry</CButton>
        </CAlert>
      )}

      <div className="mb-3">
        <CNav variant="tabs">
          {tabs.map(({ key, label }) => (
            <CNavItem key={key}>
              <CNavLink active={activeTab === key} onClick={() => setActiveTab(key)} style={{ cursor: 'pointer' }}>
                {label}
              </CNavLink>
            </CNavItem>
          ))}
        </CNav>
      </div>

      <CCard>
        <CCardBody className="p-0 overflow-auto">
          {eventsLoading && !events.length ? (
            <div className="text-center py-4"><CSpinner /></div>
          ) : !events.length ? (
            <div className="p-4 text-body-secondary text-center">
              No {activeTab === 'active' ? 'events' : 'past events'} yet.
            </div>
          ) : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Category</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Registered</CTableHeaderCell>
                  <CTableHeaderCell> </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {events.map((ev) => {
                  const isDraft = ev.status === 'DRAFT'
                  return (
                    <CTableRow
                      key={ev.id}
                      style={{ cursor: 'pointer', opacity: isDraft ? 0.85 : 1 }}
                      onClick={() => navigate(`/coach/events/${ev.id}`)}
                    >
                      <CTableDataCell>
                        <span className="fw-semibold">{ev.name}</span>
                        {isDraft && (
                          <CBadge color="warning" textColor="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                            Draft — publish to make visible
                          </CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell><CategoryBadge category={ev.category} /></CTableDataCell>
                      <CTableDataCell>
                        {formatDate(ev.start_date)}
                        {ev.end_date && ev.end_date !== ev.start_date ? ` – ${formatDate(ev.end_date)}` : ''}
                      </CTableDataCell>
                      <CTableDataCell>
                        {ev.registered_count || 0}
                        {ev.capacity ? ` / ${ev.capacity}` : ''}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton size="sm" color="primary" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/coach/events/${ev.id}`) }}>
                          {isDraft ? 'Edit & Publish' : 'View'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <EventFormModal
        visible={showForm}
        submitting={mutating}
        error={mutateError}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </>
  )
}
