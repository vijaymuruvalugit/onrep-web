import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CSpinner,
} from '@coreui/react'
import { useBatches } from '../../batches/hooks/useBatches'
import usePlaces from '../../places/hooks/usePlaces'
import { useSchedule } from '../hooks/useSchedule'
import RecurringPatternsList from '../components/RecurringPatternsList'
import PatternEditorDrawer from '../components/PatternEditorDrawer'
import RecurringSetupWizard from '../components/RecurringSetupWizard'
import AdjustNextSessionModal from '../components/AdjustNextSessionModal'
import ScheduleBatchSwitcher from '../components/ScheduleBatchSwitcher'
import CreateOneTimeSessionDrawer from '../components/CreateOneTimeSessionDrawer'
import SessionDetailDrawer from '../components/SessionDetailDrawer'
import CompactSessionRow from '../components/CompactSessionRow'
import {
  compareOperationalSessionsChronological,
  effectiveOperationalSessionDateYmd,
  isOperationalSessionStillUpcoming,
  normalizeSessionDateYmd,
  parseSessionLocalDate,
  sliceUpcomingSessionsForDisplay,
  UPCOMING_SESSIONS_DISPLAY_CAP,
} from '../../classes/utils/sessionDisplay'
import { isOperationalOneOff, isOperationalRecurring } from '../../classes/utils/sessionRow'
import batchesApi from '../../batches/api/batchesApi'
import operationalSessionsApi from '../../../domain/operationalSessions/operationalSessionsApi'
import { canMarkSessionAttendance } from '../../../domain/operationalSessions/helpers/attendanceEligibility'
import { operationalSessionToScheduleCompactRow } from '../../../domain/operationalSessions/adapters/toScheduleCompactRow'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { todayIsoLocal } from '../../batches/utils/batchWorkspaceOperations'
import { listStaffCoaches } from '../../directory/api/directoryApi'
import scheduleApi from '../api/scheduleApi'
import { friendlyScheduleApiMessage } from '../utils/scheduleUserMessages'
import { RECURRING_PATTERN_EDIT_MODE } from '@onrep/contracts/recurring-patterns'
import './SchedulePage.scss'

function materializationEmptyHint(skipped) {
  if (skipped === 'no_active_students') {
    return 'Add students to this batch first. Sessions are created automatically once at least one student is enrolled.'
  }
  if (skipped === 'no_active_patterns') {
    return 'Add a weekly pattern above, or check that its start date is not still in the future.'
  }
  if (skipped === 'overlap_or_conflict') {
    return 'Two sessions overlap at the same time. Edit a pattern or remove the conflicting session, then refresh.'
  }
  if (skipped === 'slots_occupied') {
    return 'Those session times are already taken on the calendar (often from an old deleted schedule). Open Cancelled or refresh again after clearing conflicts.'
  }
  return null
}

function addDaysYmd(fromYmd, days) {
  const d = parseSessionLocalDate(fromYmd)
  if (!d) return fromYmd
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Board query window for upcoming list. */
function boardRangeYmd() {
  const fromYmd = todayIsoLocal()
  return { fromYmd, toYmd: addDaysYmd(fromYmd, 90) }
}

const SchedulePage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activities = useSelector((s) => s.workspace.activities)
  const bootstrapComplete = useSelector((s) => s.workspace.bootstrapComplete)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)

  const { items: batches, fetchBatches } = useBatches()
  const { activePlaces, fetchPlaces, listLoading: placesLoading, createPlace } = usePlaces()
  const {
    items,
    loading,
    saving,
    error,
    mutationError,
    fetchSchedule,
    updatePattern,
    deactivatePattern,
    clearErrors,
  } = useSchedule()
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)
  const [sessionsEmptyHint, setSessionsEmptyHint] = useState(null)
  const [sessionRows, setSessionRows] = useState([])
  const [drawerSessionId, setDrawerSessionId] = useState(null)
  const [drawerSeedRow, setDrawerSeedRow] = useState(null)
  const [createOneTimeOpen, setCreateOneTimeOpen] = useState(false)
  const [sessionKindFilter, setSessionKindFilter] = useState(
    () => /** @type {'all' | 'regular' | 'one_off' | 'cancelled'} */ ('all'),
  )
  const [patternDrawerOpen, setPatternDrawerOpen] = useState(false)
  const [patternDrawerMode, setPatternDrawerMode] = useState('create')
  const [patternDrawerSeed, setPatternDrawerSeed] = useState(null)
  const [adjustNextOpen, setAdjustNextOpen] = useState(false)
  const [adjustNextSession, setAdjustNextSession] = useState(null)
  const [adjustNextError, setAdjustNextError] = useState(null)
  const [adjustNextBusy, setAdjustNextBusy] = useState(false)
  const [pageNotice, setPageNotice] = useState(null)
  const [quickAddPlaceSaving, setQuickAddPlaceSaving] = useState(false)
  const [quickAddPlaceError, setQuickAddPlaceError] = useState(null)
  const [coaches, setCoaches] = useState([])
  /** Academy/activity calendar "today" from board API; null until first successful load. */
  const [operationalTodayYmd, setOperationalTodayYmd] = useState(null)
  /** Ignore stale board responses when batch changes or a newer refresh started. */
  const loadSessionsGenerationRef = useRef(0)

  const todayIso = operationalTodayYmd ?? todayIsoLocal()

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const ensurePlacesLoaded = useCallback(() => {
    if (!bootstrapComplete || !activeActivityId) return Promise.resolve()
    return fetchPlaces({ status: 'active', limit: 200 })
  }, [bootstrapComplete, activeActivityId, fetchPlaces])

  const handleQuickAddPlace = useCallback(
    async ({ name, address }) => {
      setQuickAddPlaceSaving(true)
      setQuickAddPlaceError(null)
      try {
        const place = await createPlace({
          name: String(name || '').trim(),
          address: address ? String(address).trim() : null,
        }).unwrap()
        await ensurePlacesLoaded()
        setPageNotice({ type: 'success', text: `Venue “${place.name}” added.` })
        return place
      } catch (e) {
        const message = e?.message || 'Could not add venue.'
        setQuickAddPlaceError(message)
        throw new Error(message)
      } finally {
        setQuickAddPlaceSaving(false)
      }
    },
    [createPlace, ensurePlacesLoaded],
  )

  useEffect(() => {
    ensurePlacesLoaded()
  }, [ensurePlacesLoaded])

  useEffect(() => {
    let cancelled = false
    listStaffCoaches()
      .then((rows) => {
        if (cancelled) return
        setCoaches(
          (rows || [])
            .map((r) => ({
              id: String(r.id || r.userId || r.user_id || ''),
              name: r.name || r.fullName || '',
            }))
            .filter((r) => r.id),
        )
      })
      .catch(() => {
        if (!cancelled) setCoaches([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const batchIdFromUrl = searchParams.get('batchId')

  const effectiveBatchId = useMemo(() => {
    if (!batches.length) return ''
    const first = String(batches[0].id || batches[0]._id || '')
    if (batchIdFromUrl && batches.some((b) => String(b.id || b._id) === batchIdFromUrl)) {
      return batchIdFromUrl
    }
    return first
  }, [batches, batchIdFromUrl])

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b.id || b._id) === String(effectiveBatchId)) || null,
    [batches, effectiveBatchId],
  )

  useEffect(() => {
    if (!batches.length || !effectiveBatchId) return
    const q = searchParams.get('batchId')
    if (!q || !batches.some((b) => String(b.id || b._id) === q)) {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          n.set('batchId', effectiveBatchId)
          return n
        },
        { replace: true },
      )
    }
  }, [batches, effectiveBatchId, searchParams, setSearchParams])

  useEffect(() => {
    if (!effectiveBatchId) return
    fetchSchedule(effectiveBatchId)
  }, [effectiveBatchId, fetchSchedule])

  useEffect(() => {
    loadSessionsGenerationRef.current += 1
    setOperationalTodayYmd(null)
  }, [effectiveBatchId, activeActivityId])

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

  const loadSessions = useCallback(async () => {
    if (!effectiveBatchId || batchWorkspaceMismatch) return
    const generation = loadSessionsGenerationRef.current + 1
    loadSessionsGenerationRef.current = generation
    setSessionsLoading(true)
    setSessionsError(null)
    setSessionsEmptyHint(null)
    try {
      const { fromYmd, toYmd } = boardRangeYmd()
      try {
        const mat = await scheduleApi.materializeBatchSessions(effectiveBatchId)
        const skipped = mat?.materialization?.skipped || mat?.skipped
        const hint = materializationEmptyHint(skipped)
        if (hint) setSessionsEmptyHint(hint)
      } catch (matErr) {
        const body = matErr?.response?.data
        const skipped = body?.materialization?.skipped || body?.skipped
        const hint = materializationEmptyHint(skipped) || friendlyScheduleApiMessage(matErr)
        setSessionsEmptyHint(hint)
      }

      const { sessions, operationalToday } = await operationalSessionsApi.getBoardRange(
        fromYmd,
        toYmd,
        effectiveBatchId,
      )
      if (operationalToday && /^\d{4}-\d{2}-\d{2}$/.test(String(operationalToday))) {
        setOperationalTodayYmd(String(operationalToday).slice(0, 10))
      }
      const rows = Array.isArray(sessions)
        ? sessions
            .map((s) => operationalSessionToScheduleCompactRow(s))
            .filter(Boolean)
            .sort(compareOperationalSessionsChronological)
        : []
      if (generation !== loadSessionsGenerationRef.current) return
      setSessionRows(rows)
    } catch (e) {
      if (generation !== loadSessionsGenerationRef.current) return
      setSessionsError(friendlyScheduleApiMessage(e))
      setSessionRows([])
    } finally {
      if (generation === loadSessionsGenerationRef.current) {
        setSessionsLoading(false)
      }
    }
  }, [effectiveBatchId, batchWorkspaceMismatch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadSessions() owns its loading/error state; setState happens inside its async body, not in this effect
    loadSessions()
  }, [loadSessions])

  const sortedSessionRows = useMemo(
    () => [...(sessionRows || [])].sort(compareOperationalSessionsChronological),
    [sessionRows],
  )

  const upcomingSessionRows = useMemo(() => {
    const now = new Date()
    const today = String(todayIso).slice(0, 10)
    return sortedSessionRows.filter(
      (r) => !r.isCancelled && isOperationalSessionStillUpcoming(r, now, today),
    )
  }, [sortedSessionRows, todayIso])

  /** Main timeline: keep completed/cancelled on academy-local dates (do not drop via still-upcoming). */
  const boardTimelineRows = useMemo(() => {
    const today = String(todayIso).slice(0, 10)
    return sortedSessionRows.filter((r) => {
      const ymd =
        effectiveOperationalSessionDateYmd(r) ||
        normalizeSessionDateYmd(r.sessionDate ?? r.session_date)
      if (today && ymd && ymd < today) return false
      return true
    })
  }, [sortedSessionRows, todayIso])

  const mergedTimelineRaw = boardTimelineRows

  const mergedTimeline = useMemo(() => {
    if (sessionKindFilter === 'cancelled') {
      return sortedSessionRows.filter((r) => r.isCancelled)
    }
    const base = boardTimelineRows
    if (sessionKindFilter === 'one_off') return base.filter((r) => isOperationalOneOff(r))
    if (sessionKindFilter === 'regular') return base.filter((r) => isOperationalRecurring(r))
    return base
  }, [sortedSessionRows, boardTimelineRows, sessionKindFilter])

  // Per-pattern "next session" map for the kebab menu (Skip next / Adjust next).
  // Uses the same merged timeline but groups by `schedule_id` so each pattern's
  // own next session is found independently. Sessions with no schedule_id are
  // excluded (they're one-offs / ad-hoc, edited via the session detail drawer).
  const nextSessionByPatternId = useMemo(() => {
    const map = {}
    for (const r of upcomingSessionRows) {
      const pid = r.scheduleId || r.schedule_id
      if (!pid) continue
      const key = String(pid)
      if (!map[key]) map[key] = r
    }
    return map
  }, [upcomingSessionRows])

  const hasUpcomingByPatternId = useMemo(() => {
    const out = {}
    for (const [pid, row] of Object.entries(nextSessionByPatternId)) {
      out[pid] = Boolean(row)
    }
    return out
  }, [nextSessionByPatternId])

  const activePatterns = useMemo(() => items.filter((p) => p.isActive !== false), [items])

  const displayedUpcoming = useMemo(
    () => sliceUpcomingSessionsForDisplay(mergedTimeline, UPCOMING_SESSIONS_DISPLAY_CAP),
    [mergedTimeline],
  )

  const hasMoreUpcoming = displayedUpcoming.length < mergedTimeline.length

  const primaryPlaceFallback = useMemo(() => {
    const fromSchedule = items.find((s) => s.placeName)?.placeName
    return stripDemoSuffix(
      fromSchedule || selectedBatch?.location || selectedBatch?.placeName || '',
    )
  }, [items, selectedBatch])

  const handleBatchChange = (batchId) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('batchId', batchId)
      return n
    })
    setDrawerSessionId(null)
    setDrawerSeedRow(null)
  }

  const refreshAll = useCallback(async () => {
    clearErrors()
    setSessionsEmptyHint(null)
    const tasks = [loadSessions()]
    if (effectiveBatchId) {
      tasks.unshift(fetchSchedule(effectiveBatchId))
    }
    tasks.push(fetchBatches(), ensurePlacesLoaded())
    await Promise.all(tasks)
  }, [effectiveBatchId, fetchSchedule, loadSessions, fetchBatches, ensurePlacesLoaded, clearErrors])

  const handleOpenSessionPage = useCallback(
    (row) => {
      const sid = row.sessionId || row.id
      if (!sid) return
      navigate(`/coach/ops/sessions/${encodeURIComponent(sid)}`)
    },
    [navigate],
  )

  const handleMarkAttendance = useCallback(
    (row) => {
      const sid = row.sessionId || row.id
      if (!sid) return
      if (canMarkSessionAttendance(row)) {
        navigate(`/coach/skating?session=${encodeURIComponent(sid)}`)
        return
      }
      navigate(`/coach/ops/sessions/${encodeURIComponent(sid)}`)
    },
    [navigate],
  )

  // -------------------- pattern card actions --------------------

  const openAddPattern = useCallback(() => {
    clearErrors()
    setQuickAddPlaceError(null)
    setPatternDrawerMode('create')
    setPatternDrawerSeed(null)
    setPatternDrawerOpen(true)
  }, [clearErrors])

  const openEditPattern = useCallback(
    (pattern) => {
      clearErrors()
      setQuickAddPlaceError(null)
      setPatternDrawerMode('edit')
      setPatternDrawerSeed(pattern)
      setPatternDrawerOpen(true)
    },
    [clearErrors],
  )

  const editOccurrenceCutoverDate = useMemo(() => {
    if (!patternDrawerSeed?.id) return null
    const row = nextSessionByPatternId[String(patternDrawerSeed.id)]
    return (
      effectiveOperationalSessionDateYmd(row) ||
      normalizeSessionDateYmd(row?.sessionDate ?? row?.session_date) ||
      null
    )
  }, [patternDrawerSeed, nextSessionByPatternId])

  const handleSavePattern = useCallback(
    async ({ payload, editMode, effectiveFrom, occurrenceCutoverDate }) => {
      if (!effectiveBatchId || !patternDrawerSeed?.id) return
      try {
        const response = await updatePattern({
          patternId: patternDrawerSeed.id,
          mode: editMode,
          effectiveFrom:
            editMode === RECURRING_PATTERN_EDIT_MODE.NEW_FROM ? effectiveFrom : undefined,
          occurrenceCutoverDate:
            editMode === RECURRING_PATTERN_EDIT_MODE.UPDATE_UPCOMING
              ? occurrenceCutoverDate || undefined
              : undefined,
          changes: payload,
        }).unwrap()
        const deleted = response?.deletedFutureSessions ?? 0
        const kept = response?.keptFutureSessions ?? 0
        const generated = response?.generatedFutureSessions ?? 0
        setPageNotice({
          type: 'success',
          text: `Schedule updated. ${generated} upcoming regenerated, ${kept} past kept on the old schedule${
            deleted ? `, ${deleted} planned removed` : ''
          }.`,
        })
        setPatternDrawerOpen(false)
        await refreshAll()
      } catch (err) {
        // mutationError surfaces via the drawer alert
        void err
      }
    },
    [effectiveBatchId, patternDrawerSeed, updatePattern, refreshAll],
  )

  const handleWizardCreated = useCallback(
    async (result, { patternCount } = {}) => {
      const count =
        Number(patternCount) || (Array.isArray(result?.patterns) ? result.patterns.length : 1)
      const matStatus = result?.materialization?.status
      const generated = Number(result?.materialization?.created ?? 0)
      const slotsSkipped = Number(result?.materialization?.slotsSkipped ?? 0)
      if (result?.idempotent || result?.materialization?.idempotent) {
        setPageNotice({
          type: 'success',
          text: 'That recurring session was already saved. Refreshing calendar sessions…',
        })
      } else if (matStatus === 'started') {
        setPageNotice({
          type: 'success',
          text:
            count > 1
              ? `${count} recurring patterns added. Generating calendar sessions…`
              : 'Recurring session added. Generating calendar sessions…',
        })
      } else if (generated < 1 && slotsSkipped > 0) {
        setPageNotice({
          type: 'warning',
          text: 'Schedule saved, but those times are already taken on the calendar. Cancel conflicting sessions or refresh to reclaim slots from deleted schedules.',
        })
      } else if (generated < 1 && matStatus == null) {
        setPageNotice({
          type: 'success',
          text:
            count > 1
              ? `${count} recurring patterns added. Refreshing calendar…`
              : 'Recurring session added. Refreshing calendar…',
        })
      } else if (generated < 1) {
        setPageNotice({
          type: 'warning',
          text: 'Schedule saved. Tap Refresh to load generated sessions, or add students to this batch if none are enrolled.',
        })
      } else {
        setPageNotice({
          type: 'success',
          text: `Recurring session added. ${generated} session${generated === 1 ? '' : 's'} added to the calendar.`,
        })
      }
      setPatternDrawerOpen(false)
      await refreshAll()
    },
    [refreshAll],
  )

  const handleDeactivatePattern = useCallback(
    async (pattern) => {
      if (!pattern?.id) return
      if (
        !window.confirm(
          `Delete “${pattern.name || 'this schedule'}”?\n\nStops new sessions. Past sessions and attendance are not affected.`,
        )
      ) {
        return
      }
      try {
        const res = await deactivatePattern({ patternId: pattern.id }).unwrap()
        const deleted = res?.deletedFutureSessions ?? 0
        const kept = res?.keptFutureSessions ?? 0
        setPageNotice({
          type: 'success',
          text: `Schedule deleted. ${deleted} future planned removed${kept ? `, ${kept} kept` : ''}.`,
        })
        refreshAll()
      } catch (e) {
        setPageNotice({
          type: 'danger',
          text: e?.response?.data?.error || e?.message || 'Could not delete schedule.',
        })
      }
    },
    [deactivatePattern, refreshAll],
  )

  const handleSkipNextForPattern = useCallback(
    async (pattern) => {
      const row = nextSessionByPatternId[pattern.id]
      const sid = row?.sessionId || row?.id
      if (!sid) return
      if (!window.confirm('Skip this session? It will show as cancelled for students.')) return
      try {
        await batchesApi.cancelSession(sid, { reason: 'Skipped from schedule' })
        setPageNotice({
          type: 'success',
          text: `Skipped next session on “${pattern.name || 'this schedule'}”.`,
        })
        refreshAll()
      } catch (e) {
        setPageNotice({
          type: 'danger',
          text: e?.response?.data?.error || e?.message || 'Could not skip session.',
        })
      }
    },
    [nextSessionByPatternId, refreshAll],
  )

  const openAdjustNext = useCallback(
    (pattern) => {
      const row = nextSessionByPatternId[pattern.id]
      if (!row?.sessionId && !row?.id) return
      setAdjustNextSession({
        id: row.sessionId || row.id,
        sessionDate: row.sessionDate || row.session_date || null,
        startTime: row.startTime ? String(row.startTime).slice(0, 5) : '',
        endTime: row.endTime ? String(row.endTime).slice(0, 5) : '',
      })
      setAdjustNextError(null)
      setAdjustNextOpen(true)
    },
    [nextSessionByPatternId],
  )

  const handleAdjustNextSave = useCallback(
    async ({ sessionId, startTime, endTime }) => {
      if (!sessionId) return
      setAdjustNextBusy(true)
      setAdjustNextError(null)
      try {
        await batchesApi.patchSession(sessionId, { startTime, endTime })
        setAdjustNextOpen(false)
        setAdjustNextSession(null)
        setPageNotice({ type: 'success', text: 'Session time updated.' })
        refreshAll()
      } catch (e) {
        setAdjustNextError(e?.response?.data?.error || e?.message || 'Could not update.')
      } finally {
        setAdjustNextBusy(false)
      }
    },
    [refreshAll],
  )

  return (
    <div className="schedule-page">
      <CCard className="mb-4 schedule-page__toolbar onrep-surface-b border-0">
        <CCardHeader className="py-3 px-3 px-md-4 bg-transparent border-0">
          <div className="d-flex flex-column gap-2">
            <strong className="schedule-page__toolbar-title d-block">Schedule</strong>
            <div className="row g-2 align-items-end">
              <CCol xs={12} md={8} lg={7}>
                <CFormLabel className="mb-0 small text-body-secondary">Batch</CFormLabel>
                <ScheduleBatchSwitcher
                  batches={batches}
                  activities={activities}
                  value={effectiveBatchId || ''}
                  onChange={handleBatchChange}
                />
              </CCol>
            </div>
          </div>
        </CCardHeader>
      </CCard>

      <section className="mb-5 schedule-page__section-weekly">
        {pageNotice ? (
          <CAlert
            color={pageNotice.type || 'info'}
            className="py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
            dismissible
            onClose={() => setPageNotice(null)}
          >
            <span>{pageNotice.text}</span>
          </CAlert>
        ) : null}
        <RecurringPatternsList
          patterns={items}
          loading={loading}
          error={error}
          batchId={effectiveBatchId}
          hasUpcomingByPatternId={hasUpcomingByPatternId}
          onAdd={openAddPattern}
          onAddOneOff={() => setCreateOneTimeOpen(true)}
          onEdit={openEditPattern}
          onSkipNext={handleSkipNextForPattern}
          onAdjustNext={openAdjustNext}
          onDeactivate={handleDeactivatePattern}
          onRefresh={refreshAll}
        />
      </section>

      <section className="mb-5 schedule-page__section-upcoming">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3 mb-3">
          <h2 className="schedule-page__section-title mb-0">Upcoming sessions</h2>
          <div className="schedule-page__filters-toolbar">
            <div
              className="schedule-page__session-filters"
              role="group"
              aria-label="Session filters"
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'regular', label: 'Regular' },
                { key: 'one_off', label: 'One-off' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map(({ key, label }) => (
                <CButton
                  key={key}
                  color="primary"
                  size="sm"
                  variant={sessionKindFilter === key ? undefined : 'outline'}
                  active={sessionKindFilter === key}
                  onClick={() => setSessionKindFilter(key)}
                >
                  {label}
                </CButton>
              ))}
            </div>
          </div>
        </div>
        <CCard className="schedule-page__upcoming-card onrep-surface-a border-0">
          <CCardBody className="py-3 px-3 px-md-4">
            {batchWorkspaceMismatch ? (
              <CAlert color="warning">
                This batch belongs to <strong>{batchWorkspaceMismatch.batchActivityName}</strong>,
                but you are working in <strong>{batchWorkspaceMismatch.activeWorkspaceName}</strong>
                . Switch program in the header to view this batch&apos;s sessions.
              </CAlert>
            ) : null}
            {sessionsError ? (
              <CAlert
                color="danger"
                className="py-2 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2"
              >
                <span>Could not load sessions. {sessionsError}</span>
                <CButton
                  size="sm"
                  color="danger"
                  variant="outline"
                  className="align-self-sm-center"
                  onClick={() => loadSessions()}
                >
                  Retry
                </CButton>
              </CAlert>
            ) : null}
            {sessionsEmptyHint && !sessionsError ? (
              <CAlert color="info" className="py-2">
                {sessionsEmptyHint}
              </CAlert>
            ) : null}
            {sessionsLoading ? (
              <div className="text-center py-3">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!sessionsLoading && !sessionsError && !mergedTimeline.length && !sessionsEmptyHint ? (
              <div className="onrep-type-muted small">
                {mergedTimelineRaw.length
                  ? 'No sessions match this filter.'
                  : 'No upcoming sessions in the next few weeks. Add a weekly pattern or a one-off session.'}
              </div>
            ) : null}
            {!sessionsLoading &&
              displayedUpcoming.map((row) => {
                const sid = row.sessionId || row.id
                const ymd = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
                const isTodayRow = Boolean(todayIso && ymd === todayIso)
                const markAllowed = canMarkSessionAttendance(row)
                const canMarkAttendanceToday =
                  isTodayRow && !row.attendanceMarked && !row.isCancelled && markAllowed
                const canOpenSessionToday =
                  isTodayRow && !row.attendanceMarked && !row.isCancelled && !markAllowed
                return (
                  <CompactSessionRow
                    key={sid}
                    row={row}
                    todayIso={todayIso}
                    placeFallback={primaryPlaceFallback}
                    canOpenSessionToday={canOpenSessionToday}
                    canMarkAttendanceToday={canMarkAttendanceToday}
                    onOpenSessionPage={handleOpenSessionPage}
                    onMarkAttendance={handleMarkAttendance}
                    onViewSession={(id, r) => {
                      setDrawerSessionId(id)
                      setDrawerSeedRow(r)
                    }}
                  />
                )
              })}
            {!sessionsLoading && !sessionsError && mergedTimeline.length > 0 ? (
              <div className="onrep-type-muted small mt-2">
                Showing next {displayedUpcoming.length} of {mergedTimeline.length} session
                {mergedTimeline.length === 1 ? '' : 's'}
              </div>
            ) : null}
            {!sessionsLoading && hasMoreUpcoming && effectiveBatchId ? (
              <div className="mt-3 pt-2 border-top border-light-subtle">
                <CButton
                  color="link"
                  className="px-0 text-decoration-none"
                  onClick={() =>
                    navigate(
                      `/coach/batches/${encodeURIComponent(effectiveBatchId)}/workspace?tab=schedule`,
                    )
                  }
                >
                  View full schedule in batch workspace
                </CButton>
              </div>
            ) : null}
          </CCardBody>
        </CCard>
      </section>

      <CreateOneTimeSessionDrawer
        visible={createOneTimeOpen}
        batch={selectedBatch}
        places={activePlaces}
        placesLoading={placesLoading}
        coaches={coaches}
        patterns={activePatterns}
        onClose={() => setCreateOneTimeOpen(false)}
        onCreated={refreshAll}
        onEnsurePlaces={ensurePlacesLoaded}
        onQuickAddPlace={handleQuickAddPlace}
        quickAddSaving={quickAddPlaceSaving}
        quickAddError={quickAddPlaceError}
      />

      {patternDrawerMode === 'create' ? (
        <RecurringSetupWizard
          visible={patternDrawerOpen}
          batch={selectedBatch}
          batchId={effectiveBatchId}
          places={activePlaces}
          placesLoading={placesLoading}
          coaches={coaches}
          onClose={() => setPatternDrawerOpen(false)}
          onCreated={handleWizardCreated}
          onEnsurePlaces={ensurePlacesLoaded}
          onQuickAddPlace={handleQuickAddPlace}
          quickAddSaving={quickAddPlaceSaving}
          quickAddError={quickAddPlaceError}
        />
      ) : (
        <PatternEditorDrawer
          visible={patternDrawerOpen}
          mode="edit"
          pattern={patternDrawerSeed}
          batch={selectedBatch}
          places={activePlaces}
          placesLoading={placesLoading}
          coaches={coaches}
          occurrenceCutoverDate={editOccurrenceCutoverDate}
          onClose={() => setPatternDrawerOpen(false)}
          onEnsurePlaces={ensurePlacesLoaded}
          onQuickAddPlace={handleQuickAddPlace}
          quickAddSaving={quickAddPlaceSaving}
          quickAddError={quickAddPlaceError}
          onSubmit={handleSavePattern}
          saving={saving}
          mutationError={mutationError}
        />
      )}

      <AdjustNextSessionModal
        visible={adjustNextOpen}
        session={adjustNextSession}
        onClose={() => {
          setAdjustNextOpen(false)
          setAdjustNextSession(null)
        }}
        onSave={handleAdjustNextSave}
        busy={adjustNextBusy}
        error={adjustNextError}
      />

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
        onUpdated={refreshAll}
      />
    </div>
  )
}

export default SchedulePage
