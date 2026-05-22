import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormCheck,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CSpinner,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import { useBatches } from '../hooks/useBatches'
import CompactSessionRow from '../../schedule/components/CompactSessionRow'
import SessionDetailDrawer from '../../schedule/components/SessionDetailDrawer'
import { stripDemoSuffix } from '../utils/batchDisplayUtils'
import {
  computeOperationalFocus,
  formatCadenceLine,
  formatCadenceLines,
  formatHeaderOperationalWhen,
  todayIsoLocal,
} from '../utils/batchWorkspaceOperations'
import {
  compareOperationalSessionsChronological,
  effectiveOperationalSessionDateYmd,
  isOperationalSessionStillUpcoming,
  normalizeSessionDateYmd,
  parseSessionLocalDate,
  sliceUpcomingSessionsForDisplay,
  UPCOMING_SESSIONS_DISPLAY_CAP,
} from '../../classes/utils/sessionDisplay'
import operationalSessionsApi from '../../../domain/operationalSessions/operationalSessionsApi'
import scheduleApi from '../../schedule/api/scheduleApi'

function addDaysYmd(fromYmd, days) {
  const d = parseSessionLocalDate(fromYmd)
  if (!d) return fromYmd
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
import { canMarkSessionAttendance } from '../../../domain/operationalSessions/helpers/attendanceEligibility'
import { operationalSessionToScheduleCompactRow } from '../../../domain/operationalSessions/adapters/toScheduleCompactRow'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'
import { listStaffCoaches } from '../../directory/api/directoryApi'
import { getCoachUiConfig } from '../../academy/api/academyUiApi'
import BatchStudentsTab from '../components/batchStudents/BatchStudentsTab'
import placesApi from '../../places/api/placesApi'
import './BatchWorkspacePage.scss'

const VALID_TABS = new Set(['schedule', 'students', 'settings'])
const WORKSPACE_REQUIRED = 'WORKSPACE_REQUIRED'

const BatchWorkspacePage = () => {
  const activities = useSelector((s) => s.workspace.activities)
  const bootstrapComplete = useSelector((s) => s.workspace.bootstrapComplete)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)
  const { batchId } = useParams()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('schedule')
  const timelineCap = UPCOMING_SESSIONS_DISPLAY_CAP
  const settingsFormRef = useRef(null)
  const didAutoLeadCoachRef = useRef(false)

  const [staffCoaches, setStaffCoaches] = useState([])
  const [coachUiConfig, setCoachUiConfig] = useState({})
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [selectedCoachIds, setSelectedCoachIds] = useState(() => new Set())
  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [defaultPlaceId, setDefaultPlaceId] = useState('')
  const [drawerSessionId, setDrawerSessionId] = useState(null)
  const [drawerSeedRow, setDrawerSeedRow] = useState(null)

  const {
    selectedBatch,
    schedules,
    detailLoading,
    schedulesLoading,
    mutationLoading,
    detailError,
    schedulesError,
    classesError,
    mutationError,
    fetchBatchById,
    fetchBatchSchedules,
    saveBatchSettings,
  } = useBatches()

  const [opBoardRows, setOpBoardRows] = useState([])
  const [opBoardLoading, setOpBoardLoading] = useState(false)
  const reloadOpBoardGenerationRef = useRef(0)
  /** Academy/activity calendar "today" from board API (IANA TZ); avoids browser-TZ skew vs India ops. */
  const [boardOperationalToday, setBoardOperationalToday] = useState(null)

  const navigate = useNavigate()
  const batchWorkspaceMismatch = useMemo(() => {
    if (!selectedBatch || !activeActivityId) return null
    const wid = selectedBatch.activityWorkspaceId ?? selectedBatch.activity_workspace_id
    if (!wid || !isValidUuid(String(wid))) return null
    if (String(wid) === String(activeActivityId)) return null
    const batchAct = activities.find((a) => String(a.id) === String(wid))
    const activeAct = activities.find((a) => String(a.id) === String(activeActivityId))
    return {
      batchActivityName: batchAct?.name || batchAct?.label || 'another program',
      activeWorkspaceName: activeAct?.name || activeAct?.label || 'current workspace',
    }
  }, [selectedBatch, activeActivityId, activities])

  useEffect(() => {
    if (!batchId) return
    fetchBatchById(batchId)
    fetchBatchSchedules(batchId)
  }, [batchId, activeActivityId, fetchBatchById, fetchBatchSchedules])

  const reloadOpBoard = useCallback(async () => {
    if (!batchId || batchWorkspaceMismatch) return
    const generation = reloadOpBoardGenerationRef.current + 1
    reloadOpBoardGenerationRef.current = generation
    const ti = todayIsoLocal()
    const toYmd = addDaysYmd(ti, 90)
    setOpBoardLoading(true)
    try {
      try {
        await scheduleApi.materializeBatchSessions(batchId)
      } catch {
        /* board still loads; materialize is best-effort */
      }
      const { sessions, operationalToday } = await operationalSessionsApi.getBoardRange(
        ti,
        toYmd,
        batchId,
      )
      if (operationalToday && /^\d{4}-\d{2}-\d{2}$/.test(String(operationalToday))) {
        setBoardOperationalToday(String(operationalToday).slice(0, 10))
      }
      const rows = (sessions || [])
        .map((s) => operationalSessionToScheduleCompactRow(s))
        .filter(Boolean)
        .sort(compareOperationalSessionsChronological)
      if (generation !== reloadOpBoardGenerationRef.current) return
      setOpBoardRows(rows)
    } catch {
      if (generation !== reloadOpBoardGenerationRef.current) return
      setOpBoardRows([])
      setBoardOperationalToday(null)
    } finally {
      if (generation === reloadOpBoardGenerationRef.current) {
        setOpBoardLoading(false)
      }
    }
  }, [batchId, batchWorkspaceMismatch])

  /* eslint-disable react-hooks/set-state-in-effect -- mount refresh loads operational board */
  useEffect(() => {
    if (!batchId) return
    void reloadOpBoard()
  }, [batchId, activeActivityId, reloadOpBoard])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    didAutoLeadCoachRef.current = false
  }, [batchId])

  useEffect(() => {
    if (!batchId) return
    let cancelled = false
    setDirectoryLoading(true)
    Promise.all([listStaffCoaches(), getCoachUiConfig()])
      .then(([coaches, cfg]) => {
        if (!cancelled) {
          setStaffCoaches(Array.isArray(coaches) ? coaches : [])
          setCoachUiConfig(cfg && typeof cfg === 'object' ? cfg : {})
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStaffCoaches([])
          setCoachUiConfig({})
        }
      })
      .finally(() => {
        if (!cancelled) setDirectoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [batchId])

  useEffect(() => {
    const ids = selectedBatch?.coachUserIds
    if (Array.isArray(ids)) {
      setSelectedCoachIds(new Set(ids.map(String)))
      return
    }
    const legacy = selectedBatch?.leadCoachUserId ?? selectedBatch?.lead_coach_user_id
    if (legacy) {
      setSelectedCoachIds(new Set([String(legacy)]))
      return
    }
    setSelectedCoachIds(new Set())
  }, [
    selectedBatch?.id,
    selectedBatch?.coachUserIds?.join(','),
    selectedBatch?.leadCoachUserId,
    selectedBatch?.lead_coach_user_id,
  ])

  useEffect(() => {
    const pid = selectedBatch?.defaultPlaceId ?? selectedBatch?.default_place_id
    setDefaultPlaceId(pid ? String(pid) : '')
  }, [selectedBatch?.id, selectedBatch?.defaultPlaceId, selectedBatch?.default_place_id])

  useEffect(() => {
    if (!activeActivityId) return
    let cancelled = false
    setPlacesLoading(true)
    placesApi
      .listPlaces({ status: 'active' })
      .then((data) => {
        if (!cancelled) setPlaces(Array.isArray(data?.places) ? data.places : [])
      })
      .catch(() => {
        if (!cancelled) setPlaces([])
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeActivityId])

  useEffect(() => {
    if (!batchId || directoryLoading || detailLoading || !selectedBatch) return
    const existing =
      (selectedBatch.coachUserIds && selectedBatch.coachUserIds.length > 0) ||
      selectedBatch.leadCoachUserId ||
      selectedBatch.lead_coach_user_id
    if (existing) return
    const coachesOnly = staffCoaches.filter((c) => String(c.role).toLowerCase() === 'coach')
    const defRaw = coachUiConfig?.defaultLeadCoachUserId
    let pick = null
    if (defRaw && coachesOnly.some((c) => String(c.id) === String(defRaw))) {
      pick = String(defRaw)
    } else if (coachesOnly.length === 1) {
      pick = String(coachesOnly[0].id)
    }
    if (!pick || didAutoLeadCoachRef.current) return
    didAutoLeadCoachRef.current = true
    setSelectedCoachIds(new Set([pick]))
    saveBatchSettings(batchId, { coachUserIds: [pick] })
  }, [
    batchId,
    coachUiConfig,
    detailLoading,
    directoryLoading,
    saveBatchSettings,
    selectedBatch,
    staffCoaches,
  ])

  const assignableBatchStaff = useMemo(() => {
    const roles = new Set(['coach', 'academy_owner', 'admin'])
    return [...staffCoaches]
      .filter((c) => roles.has(String(c.role).toLowerCase()))
      .sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, {
          sensitivity: 'base',
        }),
      )
  }, [staffCoaches])

  const toggleCoachSelection = (coachId) => {
    const sid = String(coachId)
    setSelectedCoachIds((prev) => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  useEffect(() => {
    const tab = (searchParams.get('tab') || '').toLowerCase()
    let next = tab
    if (['overview', 'upcoming', 'attendance', 'operations'].includes(tab)) next = 'schedule'
    if (!VALID_TABS.has(next)) next = ''
    queueMicrotask(() => {
      if (VALID_TABS.has(next)) setActiveTab(next)
    })
  }, [batchId, searchParams])

  const todayIso = boardOperationalToday ?? todayIsoLocal()

  const todayFromTimeline = useMemo(
    () =>
      (opBoardRows || []).filter(
        (r) => effectiveOperationalSessionDateYmd(r) === String(todayIso).slice(0, 10),
      ),
    [opBoardRows, todayIso],
  )

  const fullMergedTimeline = opBoardRows

  const upcomingBoardRows = useMemo(() => {
    const now = new Date()
    const today = String(todayIso).slice(0, 10)
    return (fullMergedTimeline || []).filter(
      (r) => !r.isCancelled && isOperationalSessionStillUpcoming(r, now, today),
    )
  }, [fullMergedTimeline, todayIso])

  const compactTimeline = useMemo(
    () => sliceUpcomingSessionsForDisplay(upcomingBoardRows, timelineCap),
    [upcomingBoardRows, timelineCap],
  )

  const primaryPlaceSingle = useMemo(() => {
    const fromSchedule = schedules.find((s) => s.placeName)?.placeName
    const fromBatchDefault = selectedBatch?.defaultPlaceName ?? selectedBatch?.default_place_name
    const raw =
      fromSchedule ||
      fromBatchDefault ||
      selectedBatch?.location ||
      selectedBatch?.placeName ||
      null
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

  const cadenceLine = useMemo(() => formatCadenceLine(schedules), [schedules])
  const cadenceLines = useMemo(() => formatCadenceLines(schedules), [schedules])

  const hasMoreTimeline = upcomingBoardRows.length > timelineCap

  const headerOperational = useMemo(
    () => formatHeaderOperationalWhen(upcomingBoardRows, todayIso),
    [upcomingBoardRows, todayIso],
  )

  const operationalFocus = useMemo(
    () =>
      computeOperationalFocus({
        todayIso,
        todayBatchSessions: todayFromTimeline,
        mergedTimeline: upcomingBoardRows,
      }),
    [todayIso, todayFromTimeline, upcomingBoardRows],
  )

  const primaryAttendanceId =
    operationalFocus.primarySession?.sessionId || operationalFocus.primarySession?.id

  const openSessionPage = useCallback(
    (sessionId) => {
      if (!sessionId) return
      navigate(`/coach/ops/sessions/${encodeURIComponent(sessionId)}`)
    },
    [navigate],
  )

  const handleOpenSessionForRow = useCallback(
    (row) => {
      const sessionId = String(row?.sessionId || row?.id || '').trim()
      if (!sessionId) return
      openSessionPage(sessionId)
    },
    [openSessionPage],
  )

  const handleMarkAttendanceForRow = useCallback(
    (row) => {
      const sessionId = String(row?.sessionId || row?.id || '').trim()
      if (!sessionId) return
      if (canMarkSessionAttendance(row)) {
        navigate(`/coach/skating?session=${encodeURIComponent(sessionId)}`)
        return
      }
      openSessionPage(sessionId)
    },
    [navigate, openSessionPage],
  )

  /** Lightweight same-day status — not a dashboard; bridges the gap after a session ends. */
  const scheduleContinuityLine = useMemo(() => {
    if (operationalFocus.kind === 'attendance_pending') {
      return 'Today · Participation pending'
    }
    if (operationalFocus.kind === 'attendance_done') {
      return 'Completed today'
    }
    if (operationalFocus.kind === 'no_session_today') {
      return 'No session today'
    }
    return null
  }, [operationalFocus])

  const handleSettingsSave = () => {
    if (!settingsFormRef.current) return
    const formData = new FormData(settingsFormRef.current)
    const feeRaw = String(formData.get('feeInr') ?? '').trim()
    const payload = {
      name: String(formData.get('name') || ''),
      coachUserIds: [...selectedCoachIds],
      defaultPlaceId: defaultPlaceId ? defaultPlaceId : null,
    }
    if (feeRaw !== '') {
      const n = Number(feeRaw)
      if (Number.isFinite(n) && n >= 0) payload.feeInr = Math.round(n)
    }
    saveBatchSettings(batchId, payload)
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
      <SessionDetailDrawer
        key={drawerSessionId || 'closed'}
        visible={Boolean(drawerSessionId)}
        sessionId={drawerSessionId}
        initialRow={drawerSeedRow}
        todayIso={todayIso}
        onClose={() => {
          setDrawerSessionId(null)
          setDrawerSeedRow(null)
        }}
        onUpdated={() => {
          fetchBatchSchedules(batchId)
          void reloadOpBoard()
        }}
      />

      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-start gap-3">
          <div className="onrep-batch-header flex-grow-1 min-w-0">
            <div className="onrep-batch-header__primary text-break">{batchTitle}</div>
            {headerOperational.whenLine ? (
              <div className="onrep-batch-header__operational text-break">
                {headerOperational.whenLine}
              </div>
            ) : (
              <div className="onrep-batch-header__operational onrep-batch-header__operational--empty text-break">
                {headerOperational.emptyMessage}
              </div>
            )}
            {scheduleContinuityLine ? (
              <div className="onrep-batch-header__status onrep-type-muted text-break mt-2">
                {scheduleContinuityLine}
              </div>
            ) : null}
            <div className="onrep-batch-header__tertiary-block">
              {primaryPlaceSingle ? (
                <div className="onrep-batch-header__tertiary-line text-break">
                  {primaryPlaceSingle}
                </div>
              ) : (
                <div className="onrep-batch-header__tertiary-line onrep-batch-header__tertiary-line--muted text-break">
                  Add a default place in Settings.
                </div>
              )}
              {activityDisciplineLine ? (
                <div className="onrep-batch-header__tertiary-line text-break">
                  {activityDisciplineLine}
                </div>
              ) : null}
            </div>
          </div>
          {primaryAttendanceId && operationalFocus.kind === 'attendance_pending' ? (
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
              <CButton
                color="primary"
                size="lg"
                className="w-100 w-sm-auto"
                disabled={Boolean(batchWorkspaceMismatch)}
                onClick={() =>
                  canMarkSessionAttendance(operationalFocus.primarySession)
                    ? handleMarkAttendanceForRow(operationalFocus.primarySession)
                    : handleOpenSessionForRow(operationalFocus.primarySession)
                }
              >
                {operationalFocus.primaryLabel || 'Open session'}
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
      {batchWorkspaceMismatch ? (
        <CAlert color="warning" className="mb-3">
          This batch belongs to <strong>{batchWorkspaceMismatch.batchActivityName}</strong>, but you
          are working in <strong>{batchWorkspaceMismatch.activeWorkspaceName}</strong>. Switch
          program in the header to view this batch&apos;s sessions.
        </CAlert>
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
            <CCard className="mb-3 border-0 onrep-surface-b shadow-none">
              <CCardBody className="py-3 px-3">
                <div className="onrep-type-label mb-2">Recurring session patterns</div>
                {cadenceLines.length > 1 ? (
                  <div className="d-flex flex-column gap-1">
                    {cadenceLines.map((entry, idx) => (
                      <div key={entry.id || idx} className="d-flex flex-column">
                        {entry.name ? <span className="fw-medium">{entry.name}</span> : null}
                        <span className={entry.name ? 'text-body-secondary small' : 'fw-medium'}>
                          {entry.line}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : cadenceLine ? (
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
                {opBoardLoading && !compactTimeline.length ? <CSpinner size="sm" /> : null}
                {!opBoardLoading && !compactTimeline.length ? (
                  <div className="small text-body-secondary py-2">Nothing scheduled in view.</div>
                ) : null}
                {compactTimeline.map((row) => {
                  const sid = row.sessionId || row.id
                  const rowDate =
                    effectiveOperationalSessionDateYmd(row) ||
                    normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
                  const isToday = rowDate === todayIso
                  const markAllowed = canMarkSessionAttendance(row)
                  const canMarkAttendanceToday =
                    isToday && !row.attendanceMarked && !row.isCancelled && markAllowed
                  const canOpenSessionToday =
                    isToday && !row.attendanceMarked && !row.isCancelled && !markAllowed
                  return (
                    <CompactSessionRow
                      key={sid ? `${sid}-${row.scheduledStartAt || ''}` : rowDate}
                      row={row}
                      todayIso={todayIso}
                      placeFallback={primaryPlaceSingle || ''}
                      canOpenSessionToday={canOpenSessionToday}
                      canMarkAttendanceToday={canMarkAttendanceToday}
                      onOpenSessionPage={handleOpenSessionForRow}
                      onMarkAttendance={handleMarkAttendanceForRow}
                      onViewSession={(id, r) => {
                        setDrawerSessionId(id)
                        setDrawerSeedRow(r)
                      }}
                    />
                  )
                })}
                {hasMoreTimeline ? (
                  <div className="mt-3 pt-2 border-top border-light-subtle">
                    <Link
                      to={schedulePageHref}
                      className="small text-primary text-decoration-none fw-semibold"
                    >
                      See more on Schedule
                    </Link>
                  </div>
                ) : null}
              </CCardBody>
            </CCard>

            <div className="d-flex justify-content-end mb-4">
              <CButton
                color="link"
                className="text-decoration-none px-0"
                as={Link}
                to={schedulePageHref}
              >
                Open full schedule →
              </CButton>
            </div>
          </div>
        </CTabPane>

        <CTabPane visible={activeTab === 'students'}>
          <BatchStudentsTab
            batchId={batchId}
            batchTitle={batchTitle}
            selectedBatch={selectedBatch}
            tabActive={activeTab === 'students'}
            detailLoading={detailLoading}
          />
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
                    <CFormLabel htmlFor="batch-fee-inr">Monthly batch fee (INR)</CFormLabel>
                    <CFormInput
                      id="batch-fee-inr"
                      name="feeInr"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={
                        selectedBatch?.feeInr != null && selectedBatch?.feeInr !== ''
                          ? String(selectedBatch.feeInr)
                          : ''
                      }
                      placeholder="e.g. 3000"
                    />
                    <div className="small text-body-secondary mt-1">
                      Used for students in this batch unless they have their own fee override.
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="batch-default-place">Default place</CFormLabel>
                    {placesLoading ? (
                      <div className="py-2">
                        <CSpinner size="sm" />
                      </div>
                    ) : (
                      <>
                        <CFormSelect
                          id="batch-default-place"
                          aria-label="Default place for this batch"
                          value={defaultPlaceId}
                          onChange={(e) => setDefaultPlaceId(e.target.value)}
                        >
                          <option value="">No default place</option>
                          {places.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))}
                        </CFormSelect>
                        <div className="small text-body-secondary mt-1">
                          Used when no venue is set on a schedule row or session. Manage venues
                          under Places.
                        </div>
                      </>
                    )}
                  </CCol>
                  <CCol xs={12}>
                    <CFormLabel className="d-block">Coaches on this batch</CFormLabel>
                    <div className="small text-body-secondary mb-2">
                      Select everyone who teaches or assists this group. Session scheduling can
                      still assign a specific coach per class.
                    </div>
                    {directoryLoading ? (
                      <div className="py-2">
                        <CSpinner size="sm" />
                      </div>
                    ) : assignableBatchStaff.length === 0 ? (
                      <div className="small text-body-secondary">
                        No staff accounts yet. Invite coaches under Owner → Coaches.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {assignableBatchStaff.map((c) => {
                          const id = String(c.id)
                          const role = String(c.role).toLowerCase()
                          const suffix =
                            role === 'coach'
                              ? ''
                              : role === 'academy_owner'
                                ? ' (owner)'
                                : ` (${role})`
                          return (
                            <CFormCheck
                              key={id}
                              id={`batch-coach-${id}`}
                              checked={selectedCoachIds.has(id)}
                              onChange={() => toggleCoachSelection(id)}
                              label={`${c.name}${suffix}`}
                            />
                          )
                        })}
                      </div>
                    )}
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
