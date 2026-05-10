import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CAvatar,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CPlaceholder,
  CRow,
} from '@coreui/react'
import { useStudents } from '../hooks/useStudents'
import StudentStatusBadge from '../components/StudentStatusBadge'
import StudentParentsCard from '../components/StudentParentsCard'
import StudentSkatingSnapshotCard from '../../skating/components/StudentSkatingSnapshotCard'
import { getStudentActivity, getStudentBatch, getStudentDisplayName } from '../utils/studentMappers'
import { sanitizeStudentNotesForDisplay } from '../../batches/utils/batchDisplayUtils'

const initialsFromName = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

const DetailLoadingState = () => (
  <CCard>
    <CCardBody>
      <CPlaceholder animation="glow">
        <CPlaceholder xs={8} />
        <CPlaceholder xs={10} />
        <CPlaceholder xs={6} />
      </CPlaceholder>
    </CCardBody>
  </CCard>
)

const StudentDetailPage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const {
    selectedStudent,
    detailLoading,
    detailError,
    fetchStudentById,
    clearSelected,
    mutationError,
  } = useStudents()

  useEffect(() => {
    fetchStudentById(studentId)
    return () => clearSelected()
  }, [fetchStudentById, studentId, clearSelected])

  if (detailLoading && !selectedStudent) return <DetailLoadingState />

  if (detailError) {
    return (
      <CAlert color="danger">{detailError.message || 'Failed to load student details.'}</CAlert>
    )
  }

  if (!selectedStudent) {
    return <CAlert color="warning">Student not found.</CAlert>
  }

  const name = getStudentDisplayName(selectedStudent)

  return (
    <>
      {mutationError?.message ? <CAlert color="danger">{mutationError.message}</CAlert> : null}
      <CCard className="mb-3">
        <CCardBody className="d-flex flex-column flex-md-row align-items-md-center gap-3">
          <CAvatar color="primary" size="xl" textColor="white">
            {initialsFromName(name)}
          </CAvatar>
          <div className="flex-grow-1">
            <h4 className="mb-1">{name}</h4>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <StudentStatusBadge status={selectedStudent.status} />
              <span className="small text-body-secondary">
                {getStudentActivity(selectedStudent)}
              </span>
              <span className="small text-body-secondary">{getStudentBatch(selectedStudent)}</span>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <CButton color="light" variant="outline" onClick={() => navigate('/coach/students')}>
              Back
            </CButton>
            <CButton
              color="primary"
              variant="outline"
              onClick={() =>
                navigate(
                  `/coach/payments?studentId=${encodeURIComponent(
                    studentId,
                  )}&studentName=${encodeURIComponent(name)}`,
                )
              }
            >
              Add fee
            </CButton>
            <CButton color="primary" onClick={() => navigate(`/coach/students/${studentId}/edit`)}>
              Edit
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      <CRow className="g-3">
        <CCol xs={12}>
          <StudentSkatingSnapshotCard studentId={studentId} />
        </CCol>
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Profile Information</CCardHeader>
            <CCardBody>
              <div className="mb-2">
                <strong>Gender:</strong> {selectedStudent.gender || '—'}
              </div>
              <div className="mb-2">
                <strong>Date of birth:</strong>{' '}
                {selectedStudent.date_of_birth
                  ? new Date(selectedStudent.date_of_birth).toLocaleDateString()
                  : '—'}
              </div>
              <div className="mb-2">
                <strong>Medical notes:</strong> {selectedStudent.medical_notes || '—'}
              </div>
              <div className="mb-0">
                <strong>Notes:</strong> {sanitizeStudentNotesForDisplay(selectedStudent.notes)}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <StudentParentsCard studentId={studentId} studentName={name} />
        </CCol>
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Emergency contact</CCardHeader>
            <CCardBody>
              <div className="mb-2">
                <strong>Name:</strong> {selectedStudent.emergency_contact_name || '—'}
              </div>
              <div className="mb-0">
                <strong>Phone:</strong> {selectedStudent.emergency_contact_phone || '—'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Enrollment & Activity</CCardHeader>
            <CCardBody>
              <div className="mb-2">
                <strong>Group:</strong> {selectedStudent.group_name || '—'}
              </div>
              <div className="mb-2">
                <strong>Batches:</strong>{' '}
                {(() => {
                  const b = getStudentBatch(selectedStudent)
                  return b === 'Not assigned' ? '—' : b
                })()}
              </div>
              <div className="mb-0">
                <strong>Status:</strong> <StudentStatusBadge status={selectedStudent.status} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Status & Metadata</CCardHeader>
            <CCardBody>
              <div className="mb-2">
                <strong>Attendance summary:</strong>{' '}
                {selectedStudent.attendance_percent
                  ? `${selectedStudent.attendance_percent}%`
                  : '—'}
              </div>
              <div className="mb-2">
                <strong>Payment summary:</strong>{' '}
                {selectedStudent.coach_monthly_fee_status || 'Pending'}
              </div>
              <div className="mb-0">
                <strong>Created:</strong>{' '}
                {selectedStudent.created_at
                  ? new Date(selectedStudent.created_at).toLocaleString()
                  : '—'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default StudentDetailPage
