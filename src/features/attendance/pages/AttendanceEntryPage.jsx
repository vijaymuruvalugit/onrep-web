import React, { useCallback, useEffect } from 'react'
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
import { toggleAttendanceStatus } from '../utils/attendanceMarks'
import { sessionAttendanceIneligibleMessage } from '../../../domain/operationalSessions/helpers/attendanceEligibility'

const AttendanceEntryPage = () => {
  const { classId } = useParams()
  const {
    roster,
    draftMarks,
    session,
    attendanceEligible,
    attendanceEligibilityError,
    loadingRoster,
    rosterError,
    saving,
    saveError,
    fetchRoster,
    setMark,
    save,
  } = useAttendance()

  useEffect(() => {
    if (classId) fetchRoster(classId)
  }, [classId, fetchRoster])

  const blockedMessage =
    attendanceEligibilityError ||
    (session ? sessionAttendanceIneligibleMessage(session) : null) ||
    'Start the session before marking attendance.'

  const applyToggle = useCallback(
    (studentId, target, notes) => {
      if (!attendanceEligible) return
      const current = draftMarks[studentId]
      const nextStatus = toggleAttendanceStatus(target, current?.status ?? null)
      setMark({ studentId, status: nextStatus, notes: notes || '' })
      save(classId)
    },
    [attendanceEligible, classId, draftMarks, save, setMark],
  )

  return (
    <CCard>
      <CCardHeader>
        <strong>Mark Attendance</strong>
      </CCardHeader>
      <CCardBody>
        {rosterError ? <CAlert color="danger">{rosterError.message}</CAlert> : null}
        {saveError ? <CAlert color="danger">{saveError.message}</CAlert> : null}
        {!loadingRoster && !attendanceEligible ? (
          <CAlert color="warning">{blockedMessage}</CAlert>
        ) : null}
        {!loadingRoster && attendanceEligible ? (
          <p className="small text-body-secondary mb-3">
            Tap Present or Absent to record a mark. Tap the same button again to clear it.
          </p>
        ) : null}
        {saving ? (
          <div className="text-body-secondary small mb-2">Saving…</div>
        ) : null}

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
              const current = draftMarks[studentId] || { status: null, notes: '' }
              const marked = current.status === 'present' || current.status === 'absent'
              return (
                <div key={studentId} className="border rounded p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <div className="fw-semibold">
                      {student.full_name || student.name || 'Student'}
                      {!marked ? (
                        <span className="text-body-secondary fw-normal small ms-2">Not marked</span>
                      ) : null}
                    </div>
                    <CButtonGroup>
                      <CButton
                        color={current.status === 'present' ? 'success' : 'secondary'}
                        variant={current.status === 'present' ? undefined : 'outline'}
                        size="sm"
                        disabled={!attendanceEligible || saving}
                        onClick={() => applyToggle(studentId, 'present', current.notes)}
                      >
                        Present
                      </CButton>
                      <CButton
                        color={current.status === 'absent' ? 'danger' : 'secondary'}
                        variant={current.status === 'absent' ? undefined : 'outline'}
                        size="sm"
                        disabled={!attendanceEligible || saving}
                        onClick={() => applyToggle(studentId, 'absent', current.notes)}
                      >
                        Absent
                      </CButton>
                    </CButtonGroup>
                  </div>
                  <CFormInput
                    className="mt-2"
                    placeholder="Optional notes"
                    value={current.notes || ''}
                    disabled={!attendanceEligible || saving}
                    onChange={(event) =>
                      setMark({
                        studentId,
                        status: current.status,
                        notes: event.target.value,
                      })
                    }
                    onBlur={() => {
                      if (attendanceEligible) save(classId)
                    }}
                  />
                </div>
              )
            })
          : null}

        {saveError ? (
          <div className="position-sticky bottom-0 bg-body pt-2 mt-3 border-top d-flex flex-column flex-sm-row gap-2 justify-content-sm-end align-items-stretch align-items-sm-center">
            <CButton
              color="warning"
              variant="outline"
              size="sm"
              disabled={saving || !classId}
              onClick={() => save(classId)}
            >
              Retry save
            </CButton>
          </div>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default AttendanceEntryPage
