import React, { useEffect, useMemo } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'

import useParent from '../hooks/useParent'
import ParticipationTimeline from '../../participation/components/ParticipationTimeline'
import { FAMILY_PARTICIPATION_COPY } from '../../../core/productCopy'

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
          <h2 className="mb-0">{FAMILY_PARTICIPATION_COPY.pageTitle}</h2>
          <p className="text-body-secondary small mb-0">{FAMILY_PARTICIPATION_COPY.pageSubtitle}</p>
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
          <span>{attendanceError.message || 'Unable to load participation history.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      <CRow className="g-3 mb-4">
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader>{FAMILY_PARTICIPATION_COPY.consistency}</CCardHeader>
            <CCardBody>
              {attendanceLoading && !attendance.length ? <CSpinner size="sm" /> : null}
              {stats.total === 0 && !attendanceLoading ? (
                <p className="text-body-secondary small mb-0">No session participation yet.</p>
              ) : null}
              {stats.total > 0 && stats.pct != null ? (
                <>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Session consistency</span>
                    <span className="fw-semibold">{stats.pct}%</span>
                  </div>
                  <CProgress color={stats.pct >= 80 ? 'success' : 'warning'} value={stats.pct} />
                  <div className="small text-body-secondary mt-2">
                    {stats.present} attended of {stats.total} sessions in this view.
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
        <CCardHeader>Session participation history</CCardHeader>
        <CCardBody>
          <ParticipationTimeline
            rows={attendance}
            showStudentName
            emptyMessage="No session participation records yet."
          />
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentAttendancePage
