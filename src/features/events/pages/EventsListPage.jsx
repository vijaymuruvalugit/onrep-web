import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CSpinner, CAlert,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CTabs, CTabList, CTab, CTabContent, CTabPanel,
  CNav, CNavItem, CNavLink,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload } from '@coreui/icons'
import useEvents from '../hooks/useEvents'
import EventFormModal from '../components/EventFormModal'
import { StatusBadge, CategoryBadge } from '../components/EventStatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EventsListPage() {
  const navigate = useNavigate()
  const {
    events, eventsLoading, eventsError,
    mutating, mutateError,
    loadEvents, saveCreateEvent, clearMutateError,
  } = useEvents()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [showForm, setShowForm] = useState(false)

  const statusFilter = { upcoming: 'PUBLISHED', drafts: 'DRAFT', past: 'COMPLETED' }

  const load = useCallback(() => {
    loadEvents({ status: statusFilter[activeTab] })
  }, [activeTab, loadEvents])

  useEffect(() => { load() }, [load])

  const handleCreate = async (payload) => {
    const result = await saveCreateEvent(payload)
    if (!result.error) {
      setShowForm(false)
      load()
    }
  }

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
          {['upcoming', 'drafts', 'past'].map((tab) => (
            <CNavItem key={tab}>
              <CNavLink active={activeTab === tab} onClick={() => setActiveTab(tab)} style={{ cursor: 'pointer' }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              No {activeTab} events.
            </div>
          ) : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Category</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Registered</CTableHeaderCell>
                  <CTableHeaderCell> </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {events.map((ev) => (
                  <CTableRow key={ev.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/coach/events/${ev.id}`)}>
                    <CTableDataCell className="fw-semibold">{ev.name}</CTableDataCell>
                    <CTableDataCell><CategoryBadge category={ev.category} /></CTableDataCell>
                    <CTableDataCell>{formatDate(ev.start_date)}{ev.end_date && ev.end_date !== ev.start_date ? ` – ${formatDate(ev.end_date)}` : ''}</CTableDataCell>
                    <CTableDataCell><StatusBadge status={ev.status} /></CTableDataCell>
                    <CTableDataCell>
                      {ev.registered_count || 0}
                      {ev.capacity ? ` / ${ev.capacity}` : ''}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="primary" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/coach/events/${ev.id}`) }}>
                        View
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
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
