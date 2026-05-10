import React, { useEffect, useMemo } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
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
import { formatShortDate } from '../utils/formatParentDate'

const ParentAttendancePage = () => {
  const { attendance, attendanceLoading, attendanceError, loadAttendance } = useParent()

  useEffect(() => {
    loadAttendance({ limit: 200, offset: 0 })
  }, [loadAttendance])

  const stats = useMemo(() => {
    const total = attendance.length
    const present = attendance.filter((a) => String(a.status).toUpperCase() === 'PRESENT').length
    const pct = total > 0 ? Math.round((100 * present) / total) : null
    return { total, present, pct }
  }, [attendance])

  const retry = () => loadAttendance({ limit: 200, offset: 0 })

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">Attendance</h2>
          <p className="text-body-secondary small mb-0">
            Session attendance history for your linked athletes.
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={attendanceLoading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {attendanceError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{attendanceError.message || 'Unable to load attendance.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      <CRow className="g-3 mb-4">
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>Overall (this list)</CCardHeader>
            <CCardBody>
              {attendanceLoading && !attendance.length ? <CSpinner size="sm" /> : null}
              {stats.total === 0 && !attendanceLoading ? (
                <p className="text-body-secondary small mb-0">No attendance rows yet.</p>
              ) : null}
              {stats.total > 0 && stats.pct != null ? (
                <>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Present rate</span>
                    <span className="fw-semibold">{stats.pct}%</span>
                  </div>
                  <CProgress color={stats.pct >= 80 ? 'success' : 'warning'} value={stats.pct} />
                  <div className="small text-body-secondary mt-2">
                    {stats.present} present of {stats.total} marks shown (paged list).
                  </div>
                </>
              ) : null}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {attendanceLoading && !attendance.length ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}

      <CCard>
        <CCardHeader>Session attendance</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          <CTable hover responsive className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                <CTableHeaderCell scope="col">Session</CTableHeaderCell>
                <CTableHeaderCell scope="col">Athlete</CTableHeaderCell>
                <CTableHeaderCell scope="col">Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {attendance.map((a) => (
                <CTableRow key={a.id}>
                  <CTableDataCell>
                    {formatShortDate(a.markedAt || a.sessionDate || a.session_date)}
                  </CTableDataCell>
                  <CTableDataCell>{a.sessionTitle || a.session_title || '—'}</CTableDataCell>
                  <CTableDataCell>{a.studentName || a.student_name || '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge
                      color={String(a.status).toUpperCase() === 'PRESENT' ? 'success' : 'danger'}
                    >
                      {a.status}
                    </CBadge>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentAttendancePage
