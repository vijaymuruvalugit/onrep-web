import React, { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CSpinner,
} from '@coreui/react'
import useAttendance from '../hooks/useAttendance'

const AttendanceEntryPage = () => {
  const { classId } = useParams()
  const {
    roster,
    draftMarks,
    loadingRoster,
    rosterError,
    saving,
    saveError,
    saveSuccess,
    fetchRoster,
    setMark,
    save,
  } = useAttendance()

  useEffect(() => {
    if (classId) fetchRoster(classId)
  }, [classId, fetchRoster])

  const marks = useMemo(() => Object.values(draftMarks), [draftMarks])

  return (
    <CCard>
      <CCardHeader>
        <strong>Mark Attendance</strong>
      </CCardHeader>
      <CCardBody>
        {rosterError ? <CAlert color="danger">{rosterError.message}</CAlert> : null}
        {saveError ? <CAlert color="danger">{saveError.message}</CAlert> : null}
        {saveSuccess ? <CAlert color="success">Attendance saved.</CAlert> : null}

        {loadingRoster ? (
          <div className="text-center py-4">
            <CSpinner />
          </div>
        ) : null}

        {!loadingRoster && !roster.length ? (
          <CAlert color="info">No students found for this class.</CAlert>
        ) : null}

        {!loadingRoster && roster.length
          ? roster.map((student) => {
              const studentId = student.id || student.studentId || student._id
              const current = draftMarks[studentId] || { status: 'present', notes: '' }
              return (
                <div key={studentId} className="border rounded p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <div className="fw-semibold">
                      {student.full_name || student.name || 'Student'}
                    </div>
                    <CButtonGroup>
                      <CButton
                        color={current.status === 'present' ? 'success' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          setMark({ studentId, status: 'present', notes: current.notes })
                        }
                      >
                        Present
                      </CButton>
                      <CButton
                        color={current.status === 'absent' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          setMark({ studentId, status: 'absent', notes: current.notes })
                        }
                      >
                        Absent
                      </CButton>
                    </CButtonGroup>
                  </div>
                  <CFormInput
                    className="mt-2"
                    placeholder="Optional notes"
                    value={current.notes || ''}
                    onChange={(event) =>
                      setMark({
                        studentId,
                        status: current.status || 'present',
                        notes: event.target.value,
                      })
                    }
                  />
                </div>
              )
            })
          : null}

        <div className="position-sticky bottom-0 bg-body pt-2 mt-3 border-top d-flex flex-column flex-sm-row gap-2 justify-content-sm-end align-items-stretch align-items-sm-center">
          {saveError ? (
            <CButton
              color="warning"
              variant="outline"
              size="sm"
              className="order-1 order-sm-0"
              disabled={saving || !classId}
              onClick={() => save(classId, marks)}
            >
              Retry save
            </CButton>
          ) : null}
          <CButton
            color="primary"
            className="w-100 w-sm-auto"
            disabled={saving || !classId}
            onClick={() => save(classId, marks)}
          >
            {saving ? 'Saving…' : 'Save attendance'}
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default AttendanceEntryPage
