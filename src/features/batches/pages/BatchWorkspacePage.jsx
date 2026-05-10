import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CNav,
  CNavItem,
  CNavLink,
  CFormCheck,
  CRow,
  CSpinner,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import { useBatches } from '../hooks/useBatches'
import { useStudents } from '../../students/hooks/useStudents'
import useClasses from '../../classes/hooks/useClasses'
import { getStudentParent } from '../../students/utils/studentMappers'
import { formatOperationalSessionRange } from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../utils/batchDisplayUtils'
import {
  computeOperationalFocus,
  formatCadenceLine,
  formatHeaderOperationalWhen,
  mergeBatchSessionInstances,
  showTomorrowDivider,
  todayIsoLocal,
} from '../utils/batchWorkspaceOperations'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'
import { setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import './BatchWorkspacePage.scss'

const VALID_TABS = new Set(['schedule', 'students', 'settings'])
const WORKSPACE_REQUIRED = 'WORKSPACE_REQUIRED'

const BatchWorkspacePage = () => {
  const dispatch = useDispatch()
  const activities = useSelector((s) => s.workspace.activities)
  const bootstrapComplete = useSelector((s) => s.workspace.bootstrapComplete)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)
  const { batchId } = useParams()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('schedule')
  const [timelineExpanded, setTimelineExpanded] = useState(false)
  const settingsFormRef = useRef(null)

  const {
    selectedBatch,
    schedules,
    upcomingClasses,
    detailLoading,
    schedulesLoading,
    classesLoading,
    mutationLoading,
    detailError,
    schedulesError,
    classesError,
    mutationError,
    fetchBatchById,
    fetchBatchSchedules,
    fetchBatchUpcomingClasses,
    saveBatchSettings,
    assignBatchStudents,
  } = useBatches()

  const { items: students, fetchStudents } = useStudents()
  const { today, fetchTodayClasses } = useClasses()

  const refreshSessions = useCallback(() => {
    if (!batchId) return
    fetchBatchUpcomingClasses({ batchId })
    fetchTodayClasses()
    fetchBatchSchedules(batchId)
  }, [batchId, fetchBatchUpcomingClasses, fetchTodayClasses, fetchBatchSchedules])

  /** Infer x-activity-id from batch → sub_activity → activity (API: activity_workspace_id). Scoped routes need it; GET /batches is exempt. */
  useEffect(() => {
    if (!bootstrapComplete || !selectedBatch || !batchId) return
    if (String(selectedBatch.id) !== String(batchId)) return
    const wid = selectedBatch.activityWorkspaceId
    if (!wid || !isValidUuid(String(wid))) return
    if (activities.length && !activities.some((a) => String(a.id) === String(wid))) return
    if (String(activeActivityId || '') === String(wid)) return
    dispatch(setActiveWorkspace(String(wid)))
  }, [batchId, bootstrapComplete, selectedBatch, activities, activeActivityId, dispatch])

  useEffect(() => {
    if (!batchId) return
    fetchBatchById(batchId)
    fetchBatchSchedules(batchId)
    fetchBatchUpcomingClasses({ batchId })
    fetchTodayClasses()
    fetchStudents({ page: 1, pageSize: 200 })
  }, [
    batchId,
    activeActivityId,
    fetchBatchById,
    fetchBatchSchedules,
    fetchBatchUpcomingClasses,
    fetchTodayClasses,
    fetchStudents,
  ])

  useEffect(() => {
    const tab = (searchParams.get('tab') || '').toLowerCase()
    let next = tab
    if (['overview', 'upcoming', 'attendance', 'operations'].includes(tab)) next = 'schedule'
    if (!VALID_TABS.has(next)) next = ''
    queueMicrotask(() => {
      if (VALID_TABS.has(next)) setActiveTab(next)
    })
  }, [batchId, searchParams])

  const todayIso = todayIsoLocal()

  const selectedStudentIds = useMemo(() => {
    const directIds = selectedBatch?.studentIds || []
    if (directIds.length > 0) return new Set(directIds.map((id) => String(id)))

    const derivedIds = students
      .filter((student) =>
        Array.isArray(student?.batchIds)
          ? student.batchIds.some((id) => String(id) === String(batchId))
          : false,
      )
      .map((student) => student.id || student._id)
      .filter(Boolean)
    return new Set(derivedIds.map((id) => String(id)))
  }, [selectedBatch, students, batchId])

  const todayBatchClasses = useMemo(() => {
    return today.filter((item) => String(item.batchId || item.batch?.id || '') === String(batchId))
  }, [today, batchId])

  const primaryPlaceSingle = useMemo(() => {
    const fromSchedule = schedules.find((s) => s.placeName)?.placeName
    const raw = fromSchedule || selectedBatch?.location || selectedBatch?.placeName || null
    return raw ? stripDemoSuffix(raw) : null
  }, [schedules, selectedBatch])

  const activityDisciplineLine = useMemo(() => {
    const wid = selectedBatch?.activityWorkspaceId
    const act = activities.find((a) => String(a.id) === String(wid))
    const actName = stripDemoSuffix(act?.name || '')
    const sub = stripDemoSuffix(selectedBatch?.subActivityName || '')
    const parts = [actName, sub].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  }, [activities, selectedBatch])

  const fullMergedTimeline = useMemo(
    () => mergeBatchSessionInstances(batchId, todayBatchClasses, upcomingClasses, todayIso, 48),
    [batchId, todayBatchClasses, upcomingClasses, todayIso],
  )

  const visibleTimeline = useMemo(() => {
    const cap = timelineExpanded ? 12 : 6
    return fullMergedTimeline.slice(0, cap)
  }, [fullMergedTimeline, timelineExpanded])

  const cadenceLine = useMemo(() => formatCadenceLine(schedules), [schedules])

  const sessionsTodayList = useMemo(() => {
    return fullMergedTimeline.filter((r) => {
      const d = String(r.sessionDate || '').match(/(\d{4}-\d{2}-\d{2})/)?.[1] || ''
      return d === todayIso
    })
  }, [fullMergedTimeline, todayIso])

  const heroSession = useMemo(() => {
    if (sessionsTodayList.length) return sessionsTodayList[0]
    return fullMergedTimeline[0] || null
  }, [sessionsTodayList, fullMergedTimeline])

  const heroIsToday = useMemo(() => {
    if (!heroSession) return false
    const d = String(heroSession.sessionDate || '').match(/(\d{4}-\d{2}-\d{2})/)?.[1] || ''
    return d === todayIso
  }, [heroSession, todayIso])

  const headerOperational = useMemo(
    () => formatHeaderOperationalWhen(fullMergedTimeline, todayIso),
    [fullMergedTimeline, todayIso],
  )

  const operationalFocus = useMemo(
    () =>
      computeOperationalFocus({
        todayIso,
        todayBatchSessions: todayBatchClasses,
        mergedTimeline: fullMergedTimeline,
      }),
    [todayIso, todayBatchClasses, fullMergedTimeline],
  )

  const primaryAttendanceId =
    operationalFocus.primarySession?.sessionId || operationalFocus.primarySession?.id

  const coachLabelForSession = useCallback(
    (row) => {
      const fromRow = row?.coachName ?? row?.coach_name
      if (fromRow && String(fromRow).trim()) return String(fromRow).trim()
      const c = selectedBatch?.coachName ?? selectedBatch?.coach_name
      if (c && String(c).trim()) return String(c).trim()
      return null
    },
    [selectedBatch],
  )

  /** Lightweight same-day status — not a dashboard; bridges the gap after a session ends. */
  const scheduleContinuityLine = useMemo(() => {
    if (operationalFocus.kind === 'attendance_pending') {
      return 'Today · Attendance pending'
    }
    if (operationalFocus.kind === 'attendance_done') {
      return 'Completed today'
    }
    if (operationalFocus.kind === 'no_session_today') {
      return 'No session today'
    }
    return null
  }, [operationalFocus])

  const handleStudentToggle = (studentId, checked) => {
    const current = new Set(selectedStudentIds)
    if (checked) current.add(studentId)
    else current.delete(studentId)
    assignBatchStudents(batchId, [...current])
  }

  const handleSettingsSave = () => {
    if (!settingsFormRef.current) return
    const formData = new FormData(settingsFormRef.current)
    saveBatchSettings(batchId, {
      name: String(formData.get('name') || ''),
      location: String(formData.get('location') || ''),
      coachName: String(formData.get('coachName') || ''),
    })
  }

  const loading = detailLoading && !selectedBatch

  const workspaceGateError = useMemo(
    () => [detailError, classesError, schedulesError].find((e) => e?.code === WORKSPACE_REQUIRED),
    [detailError, classesError, schedulesError],
  )

  const batchTitle = stripDemoSuffix(selectedBatch?.name || '') || 'This batch'

  const schedulePageHref = `/coach/schedule?batchId=${encodeURIComponent(batchId || '')}`

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-start gap-3">
          <div className="onrep-batch-header flex-grow-1 min-w-0">
            <div className="onrep-batch-header__primary text-break">{batchTitle}</div>
            {headerOperational.whenLine ? (
              <div className="onrep-batch-header__operational text-break">{headerOperational.whenLine}</div>
            ) : (
              <div className="onrep-batch-header__operational onrep-batch-header__operational--empty text-break">
                {headerOperational.emptyMessage}
              </div>
            )}
            <div className="onrep-batch-header__tertiary-block">
              {primaryPlaceSingle ? (
                <div className="onrep-batch-header__tertiary-line text-break">{primaryPlaceSingle}</div>
              ) : (
                <div className="onrep-batch-header__tertiary-line onrep-batch-header__tertiary-line--muted text-break">
                  Add a default place in Settings.
                </div>
              )}
              {activityDisciplineLine ? (
                <div className="onrep-batch-header__tertiary-line text-break">{activityDisciplineLine}</div>
              ) : null}
            </div>
          </div>
          {primaryAttendanceId && operationalFocus.kind === 'attendance_pending' ? (
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
              <CButton
                as={Link}
                color="primary"
                size="lg"
                className="w-100 w-sm-auto"
                to={`/coach/attendance/class/${encodeURIComponent(primaryAttendanceId)}`}
              >
                {operationalFocus.primaryLabel || 'Start session'}
              </CButton>
            </div>
          ) : null}
        </CCardHeader>
      </CCard>

      <CNav variant="tabs" role="tablist" className="mb-3 flex-nowrap overflow-auto">
        {[
          { key: 'schedule', label: 'Schedule' },
          { key: 'students', label: 'Students' },
          { key: 'settings', label: 'Settings' },
        ].map(({ key, label }) => (
          <CNavItem key={key}>
            <CNavLink
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {label}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>

      {workspaceGateError ? (
        <div className="onrep-batch-workspace-hint mb-3">{workspaceGateError.message}</div>
      ) : null}
      {detailError && detailError.code !== WORKSPACE_REQUIRED ? (
        <CAlert color="danger">{detailError.message}</CAlert>
      ) : null}
      {classesError && classesError.code !== WORKSPACE_REQUIRED ? (
        <CAlert color="danger">{classesError.message}</CAlert>
      ) : null}
      {mutationError ? <CAlert color="danger">{mutationError.message}</CAlert> : null}

      <CTabContent>
        <CTabPane visible={activeTab === 'schedule'}>
          <div className="onrep-batch-ops-stack">
            <CCard className="mb-3 border-0 onrep-surface-a onrep-surface-a--accent onrep-batch-ops-hero shadow-none">
              <CCardBody className="py-4 px-3 px-md-4">
                {loading ? <CSpinner /> : null}
                {!loading && scheduleContinuityLine ? (
                  <div className="onrep-type-muted mb-3">{scheduleContinuityLine}</div>
                ) : null}
                {!loading && heroSession ? (
                  <>
                    <div className="onrep-type-label mb-2">
                      {heroIsToday ? 'Session today' : 'Next session'}
                    </div>
                    <div className="onrep-type-hero">
                      {formatOperationalSessionRange(
                        heroSession.sessionDate,
                        heroSession.startTime,
                        heroSession.endTime ?? heroSession.end_time,
                        todayIso,
                      )}
                    </div>
                    {(heroSession.placeName || heroSession.location || primaryPlaceSingle) && (
                      <div className="onrep-type-meta mt-2">
                        {stripDemoSuffix(
                          heroSession.placeName || heroSession.location || primaryPlaceSingle || '',
                        )}
                      </div>
                    )}
                    {coachLabelForSession(heroSession) ? (
                      <div className="onrep-type-muted mt-3">
                        Coach: <span className="text-body">{coachLabelForSession(heroSession)}</span>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {!loading && !heroSession ? (
                  <div className="text-body-secondary">No upcoming session scheduled.</div>
                ) : null}
              </CCardBody>
            </CCard>

            <CCard className="mb-3 border-0 onrep-surface-b shadow-none">
              <CCardBody className="py-3 px-3">
                <div className="onrep-type-label mb-2">Regular schedule</div>
                {cadenceLine ? (
                  <div className="fw-medium">{cadenceLine}</div>
                ) : (
                  <div className="text-body-secondary">No recurring schedule yet.</div>
                )}
              </CCardBody>
            </CCard>

            <CCard className="mb-3 border-0 onrep-surface-a shadow-none">
              <CCardHeader className="bg-transparent border-0 pb-0 pt-3 px-3">
                <span className="onrep-type-label">Upcoming sessions</span>
              </CCardHeader>
              <CCardBody className="pt-2 px-3">
                {classesLoading && !visibleTimeline.length ? <CSpinner size="sm" /> : null}
                {!classesLoading && !visibleTimeline.length ? (
                  <div className="small text-body-secondary py-2">Nothing scheduled in view.</div>
                ) : null}
                {visibleTimeline.map((row, idx) => {
                  const prev = visibleTimeline[idx - 1]
                  const sid = row.sessionId || row.id
                  const rowDate =
                    String(row.sessionDate || '').match(/(\d{4}-\d{2}-\d{2})/)?.[1] || ''
                  const isToday = rowDate === todayIso
                  const divider = showTomorrowDivider(prev, row, todayIso)
                  const canStartToday = isToday && !row.attendanceMarked
                  const sessionCta = canStartToday ? 'Start session' : 'View session'
                  const whenLine = formatOperationalSessionRange(
                    row.sessionDate,
                    row.startTime,
                    row.endTime ?? row.end_time,
                    todayIso,
                  )
                  return (
                    <React.Fragment key={sid || idx}>
                      {divider ? (
                        <div className="onrep-batch-timeline-divider small text-body-secondary pt-2 pb-1">
                          Tomorrow
                        </div>
                      ) : null}
                      <div
                        className={[
                          'onrep-batch-timeline-row d-flex flex-column flex-sm-row justify-content-between gap-2 gap-sm-3 align-items-start align-items-sm-center',
                          isToday ? 'onrep-batch-timeline-row--today' : '',
                          !isToday ? 'onrep-batch-timeline-row--later' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className="min-w-0">
                          <div className="onrep-batch-timeline-when">
                            {whenLine}
                            {row.isExtraSession ? (
                              <span className="text-body-secondary fw-normal"> · Extra</span>
                            ) : null}
                          </div>
                          <div className="onrep-type-muted text-truncate">
                            {stripDemoSuffix(
                              row.placeName || row.location || primaryPlaceSingle || '',
                            ) || ''}
                          </div>
                        </div>
                        {sid ? (
                          <CButton
                            as={Link}
                            size="sm"
                            color="primary"
                            variant="outline"
                            className="flex-shrink-0 align-self-stretch align-self-sm-center"
                            to={`/coach/attendance/class/${encodeURIComponent(sid)}`}
                          >
                            {sessionCta}
                          </CButton>
                        ) : null}
                      </div>
                    </React.Fragment>
                  )
                })}
                {fullMergedTimeline.length > 6 ? (
                  <CButton
                    color="link"
                    className="px-0 mt-2"
                    onClick={() => setTimelineExpanded((e) => !e)}
                  >
                    {timelineExpanded ? 'Show fewer' : 'Show more'}
                  </CButton>
                ) : null}
              </CCardBody>
            </CCard>

            <div className="d-flex justify-content-end mb-4">
              <CButton color="primary" variant="outline" as={Link} to={schedulePageHref}>
                Open full schedule →
              </CButton>
            </div>
          </div>
        </CTabPane>

        <CTabPane visible={activeTab === 'students'}>
          <CCard>
            <CCardHeader>
              <strong>Group members</strong>
            </CCardHeader>
            <CCardBody className="onrep-batch-students-body p-0">
              {!students.length ? (
                <CAlert color="info" className="m-3">
                  No students available to assign.
                </CAlert>
              ) : null}
              {students.slice(0, 200).map((student) => {
                const studentId = student.id || student._id
                const parent = getStudentParent(student)
                const showParent = parent && parent !== '—'
                const title =
                  showParent && (student.full_name || student.name)
                    ? `${student.full_name || student.name} — ${parent}`
                    : undefined
                return (
                  <div
                    key={studentId}
                    className="onrep-batch-student-row d-flex justify-content-between align-items-center gap-3 border-bottom px-3"
                  >
                    <div className="min-w-0 py-2 flex-grow-1">
                      <Link
                        to={`/coach/students/${encodeURIComponent(studentId)}`}
                        className="d-block text-body text-decoration-none fw-semibold text-break"
                        title={title}
                      >
                        {student.full_name || student.name}
                      </Link>
                    </div>
                    <CFormCheck
                      switch
                      reverse
                      className="onrep-batch-membership-switch flex-shrink-0 mb-0"
                      id={`in-batch-${studentId}`}
                      label="In batch"
                      checked={selectedStudentIds.has(studentId)}
                      onChange={(event) => handleStudentToggle(studentId, event.target.checked)}
                      aria-label={`${selectedStudentIds.has(studentId) ? 'Remove' : 'Add'} ${student.full_name || student.name || 'student'} ${selectedStudentIds.has(studentId) ? 'from' : 'to'} this batch`}
                    />
                  </div>
                )
              })}
            </CCardBody>
          </CCard>
        </CTabPane>

        <CTabPane visible={activeTab === 'settings'}>
          <CCard className="onrep-batch-settings-muted">
            <CCardHeader>
              <strong>Batch settings</strong>
            </CCardHeader>
            <CCardBody>
              <form
                ref={settingsFormRef}
                key={selectedBatch?.id || selectedBatch?._id || 'batch-settings'}
              >
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel>Batch name</CFormLabel>
                    <CFormInput name="name" defaultValue={selectedBatch?.name || ''} />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Default place</CFormLabel>
                    <CFormInput
                      name="location"
                      defaultValue={selectedBatch?.location || selectedBatch?.placeName || ''}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Lead coach / instructor</CFormLabel>
                    <CFormInput name="coachName" defaultValue={selectedBatch?.coachName || ''} />
                  </CCol>
                </CRow>
              </form>
              <div className="mt-3 d-flex justify-content-end">
                <CButton color="primary" disabled={mutationLoading} onClick={handleSettingsSave}>
                  {mutationLoading ? 'Saving…' : 'Save settings'}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CTabPane>
      </CTabContent>
    </>
  )
}

export default BatchWorkspacePage
