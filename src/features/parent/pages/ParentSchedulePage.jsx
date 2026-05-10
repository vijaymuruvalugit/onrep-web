import React, { useEffect, useMemo } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'

import useParent from '../hooks/useParent'
import { formatSessionWhen } from '../utils/formatParentDate'

function weekRangeIso() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 14)
  return { from: start.toISOString(), to: end.toISOString() }
}

const ParentSchedulePage = () => {
  const { scheduleSessions, scheduleLoading, scheduleError, loadSchedule } = useParent()

  useEffect(() => {
    const { from, to } = weekRangeIso()
    loadSchedule({ from, to, limit: 100, offset: 0 })
  }, [loadSchedule])

  const grouped = useMemo(() => {
    const map = new Map()
    scheduleSessions.forEach((s) => {
      const key =
        s.sessionDate || s.session_date || formatSessionWhen(s).split('·')[0].trim() || 'Upcoming'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    })
    return map
  }, [scheduleSessions])

  const retry = () => {
    const { from, to } = weekRangeIso()
    loadSchedule({ from, to, limit: 100, offset: 0 })
  }

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">Schedule</h2>
          <p className="text-body-secondary small mb-0">
            Upcoming training sessions for linked athletes (next two weeks in this view).
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={scheduleLoading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {scheduleError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{scheduleError.message || 'Unable to load schedule.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {scheduleLoading && !scheduleSessions.length ? (
        <div className="text-center py-5">
          <CSpinner />
        </div>
      ) : null}

      {!scheduleLoading && !scheduleSessions.length && !scheduleError ? (
        <CAlert color="info">No upcoming sessions in this window.</CAlert>
      ) : null}

      <div className="d-none d-md-block">
        <CCard>
          <CCardHeader>Sessions</CCardHeader>
          <CCardBody className="p-0 overflow-auto">
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">When</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Session</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Athlete</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Place</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {scheduleSessions.map((s) => (
                  <CTableRow key={s.id}>
                    <CTableDataCell>{formatSessionWhen(s)}</CTableDataCell>
                    <CTableDataCell>{s.title || '—'}</CTableDataCell>
                    <CTableDataCell>{s.student?.name || s.student_name || '—'}</CTableDataCell>
                    <CTableDataCell>{s.place || '—'}</CTableDataCell>
                    <CTableDataCell>
                      {s.status ? (
                        <CBadge color="light" textColor="dark">
                          {s.status}
                        </CBadge>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </div>

      <div className="d-md-none">
        {Array.from(grouped.entries()).map(([dayKey, rows]) => (
          <CCard key={dayKey} className="mb-3">
            <CCardHeader>{dayKey}</CCardHeader>
            <CCardBody>
              <ul className="list-unstyled mb-0">
                {rows.map((s) => (
                  <li key={s.id} className="mb-3 pb-3 border-bottom border-light">
                    <div className="fw-semibold">{s.title || 'Session'}</div>
                    <div className="small text-body-secondary">{formatSessionWhen(s)}</div>
                    <div className="small">{s.student?.name || s.student_name}</div>
                    <div className="small">{s.place || 'Location TBD'}</div>
                  </li>
                ))}
              </ul>
            </CCardBody>
          </CCard>
        ))}
      </div>
    </>
  )
}

export default ParentSchedulePage
