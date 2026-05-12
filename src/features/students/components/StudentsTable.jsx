import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CPlaceholder,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilPlus } from '@coreui/icons'
import {
  getAttendanceSummary,
  getCreatedDate,
  getEnrollmentStatus,
  getPaymentStatus,
  getStudentActivity,
  getStudentAge,
  getStudentBatch,
  getStudentDisplayName,
  getStudentParent,
} from '../utils/studentMappers'
import StudentStatusBadge from './StudentStatusBadge'
import { buildRowNavProps } from '../../../utils/rowNav'

const COLUMN_COUNT = 7

const PlaceholderRows = () =>
  [...Array(5)].map((_, index) => (
    <CTableRow key={`skeleton-${index}`}>
      {[...Array(COLUMN_COUNT)].map((__, colIdx) => (
        <CTableDataCell key={`cell-${colIdx}`}>
          <CPlaceholder animation="glow">
            <CPlaceholder xs={8} />
          </CPlaceholder>
        </CTableDataCell>
      ))}
    </CTableRow>
  ))

const StudentsTable = ({ students, loading, onRetry, error, canRetry = false }) => {
  const navigate = useNavigate()

  const rows = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        name: getStudentDisplayName(student),
        age: getStudentAge(student),
        parent: getStudentParent(student),
        activity: getStudentActivity(student),
        batch: getStudentBatch(student),
        status: getEnrollmentStatus(student),
        attendance: getAttendanceSummary(student),
        payment: getPaymentStatus(student),
        createdAt: getCreatedDate(student),
      })),
    [students],
  )

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>Students</strong>
        <CButton as={Link} color="primary" size="sm" to="/coach/students/new">
          <CIcon icon={cilPlus} className="me-1" />
          Add Student
        </CButton>
      </CCardHeader>
      <CCardBody className="p-0">
        {error ? (
          <div className="p-3 border-bottom">
            <div className="text-danger fw-semibold mb-2">
              {error.message || 'Failed to load students.'}
            </div>
            {canRetry ? (
              <CButton color="light" size="sm" onClick={onRetry}>
                Retry
              </CButton>
            ) : null}
          </div>
        ) : null}

        <div className="table-responsive">
          <CTable align="middle" hover className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Batch/Activity</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-lg-table-cell">Parent</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-lg-table-cell">Age</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-xl-table-cell">Attendance</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-xl-table-cell">Created</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? <PlaceholderRows /> : null}
              {!loading && rows.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={COLUMN_COUNT}>
                    <div className="text-center py-5">
                      <CIcon icon={cilPeople} size="xl" className="text-body-secondary mb-2" />
                      <div className="fw-semibold">No students added yet.</div>
                      <div className="text-body-secondary small mb-3">
                        Start by creating the first student profile.
                      </div>
                      <CButton as={Link} color="primary" to="/coach/students/new">
                        Add Student
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : null}
              {!loading &&
                rows.map((row) => {
                  const detailPath = `/coach/students/${row.id}`
                  return (
                    <CTableRow key={row.id} {...buildRowNavProps(navigate, detailPath)}>
                      <CTableDataCell>
                        <Link to={detailPath} className="fw-semibold text-decoration-none">
                          {row.name}
                        </Link>
                        <div className="small text-body-secondary">{row.payment}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <StudentStatusBadge status={row.status} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{row.batch}</div>
                        <div className="small text-body-secondary">{row.activity}</div>
                      </CTableDataCell>
                      <CTableDataCell className="d-none d-lg-table-cell">
                        {row.parent}
                      </CTableDataCell>
                      <CTableDataCell className="d-none d-lg-table-cell">{row.age}</CTableDataCell>
                      <CTableDataCell className="d-none d-xl-table-cell">
                        {row.attendance}
                      </CTableDataCell>
                      <CTableDataCell className="d-none d-xl-table-cell">
                        {row.createdAt}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
            </CTableBody>
          </CTable>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default StudentsTable
