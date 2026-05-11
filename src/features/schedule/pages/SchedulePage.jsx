import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCollapse,
  CCol,
  CFormLabel,
  CSpinner,
} from '@coreui/react'
import { useBatches } from '../../batches/hooks/useBatches'
import usePlaces from '../../places/hooks/usePlaces'
import { useSchedule } from '../hooks/useSchedule'
import ScheduleBuilderCard from '../components/ScheduleBuilderCard'
import ScheduleAdvancedAccordion from '../components/ScheduleAdvancedAccordion'
import ScheduleBatchSwitcher from '../components/ScheduleBatchSwitcher'
import CreateOneTimeSessionDrawer from '../components/CreateOneTimeSessionDrawer'
import SessionDetailDrawer from '../components/SessionDetailDrawer'
import CompactSessionRow from '../components/CompactSessionRow'
import { normalizeSessionDateYmd } from '../../classes/utils/sessionDisplay'
import {
  isOperationalOneOff,
  isOperationalRecurring,
  normalizeTrainingSessionRow,
} from '../../classes/utils/sessionRow'
import batchesApi from '../../batches/api/batchesApi'
import useClasses from '../../classes/hooks/useClasses'
import {
  mergeBatchSessionInstances,
  todayIsoLocal,
  formatCadenceLine,
  firstNonCancelledSession,
} from '../../batches/utils/batchWorkspaceOperations'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'
import { setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { useIsScheduleWide } from '../../../hooks/useMediaQuery'
import './SchedulePage.scss'

const SchedulePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activities = useSelector((s) => s.workspace.activities)
  const bootstrapComplete = useSelector((s) => s.workspace.bootstrapComplete)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)

  const { items: batches, fetchBatches } = useBatches()
  const { items: places, listLoading: placesLoading, fetchPlaces } = usePlaces()
  const { items, loading, saving, error, mutationError, fetchSchedule, createSchedule } =
    useSchedule()
  const { today, fetchTodayClasses } = useClasses()

  const isWide = useIsScheduleWide()
  const upcomingCap = isWide ? 4 : 3

  const [placeId, setPlaceId] = useState('')
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)
  const [sessionRows, setSessionRows] = useState([])
  const [weeklyPatternOpen, setWeeklyPatternOpen] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [drawerSessionId, setDrawerSessionId] = useState(null)
  const [drawerSeedRow, setDrawerSeedRow] = useState(null)
  const [createOneTimeOpen, setCreateOneTimeOpen] = useState(false)
  const [sessionKindFilter, setSessionKindFilter] = useState(
    () => /** @type {'all' | 'regular' | 'one_off' | 'cancelled'} */ ('all'),
  )

  const todayIso = todayIsoLocal()

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  useEffect(() => {
    fetchPlaces({ status: 'active', limit: 200 })
  }, [fetchPlaces])

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
    const fromQuery = searchParams.get('placeId')
    if (fromQuery) {
      setPlaceId(fromQuery)
      return
    }
    if (!places.length || placesLoading) return
    const active = places.filter((p) => p.isActive !== false)
    if (active.length === 1) setPlaceId(active[0].id)
  }, [searchParams, places, placesLoading])

  useEffect(() => {
    if (!effectiveBatchId) return
    fetchSchedule(effectiveBatchId)
  }, [effectiveBatchId, fetchSchedule])

  useEffect(() => {
    if (!bootstrapComplete || !selectedBatch || !effectiveBatchId) return
    if (String(selectedBatch.id || selectedBatch._id) !== String(effectiveBatchId)) return
    const wid = selectedBatch.activityWorkspaceId
    if (!wid || !isValidUuid(String(wid))) return
    if (activities.length && !activities.some((a) => String(a.id) === String(wid))) return
    if (String(activeActivityId || '') === String(wid)) return
    dispatch(setActiveWorkspace(String(wid)))
  }, [bootstrapComplete, selectedBatch, effectiveBatchId, activities, activeActivityId, dispatch])

  const loadSessions = useCallback(async () => {
    if (!effectiveBatchId) return
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const end = new Date()
      end.setDate(end.getDate() + 90)
      const y = end.getFullYear()
      const m = String(end.getMonth() + 1).padStart(2, '0')
      const d = String(end.getDate()).padStart(2, '0')
      const { sessions } = await batchesApi.listClasses({
        batchId: effectiveBatchId,
        fromDate: todayIso,
        toDate: `${y}-${m}-${d}`,
        includeCancelled: true,
      })
      const rows = Array.isArray(sessions)
        ? sessions.map((s) => normalizeTrainingSessionRow(s))
        : []
      setSessionRows(rows)
    } catch (e) {
      setSessionsError(e?.response?.data?.error || e?.message || 'Unable to load sessions.')
      setSessionRows([])
    } finally {
      setSessionsLoading(false)
    }
  }, [effectiveBatchId, todayIso])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    fetchTodayClasses()
  }, [fetchTodayClasses, effectiveBatchId])

  const todayBatchClasses = useMemo(() => {
    return today.filter(
      (item) => String(item.batchId || item.batch?.id || '') === String(effectiveBatchId),
    )
  }, [today, effectiveBatchId])

  const mergedTimelineRaw = useMemo(
    () =>
      mergeBatchSessionInstances(effectiveBatchId, todayBatchClasses, sessionRows, todayIso, 80),
    [effectiveBatchId, todayBatchClasses, sessionRows, todayIso],
  )

  const mergedTimeline = useMemo(() => {
    return mergedTimelineRaw.filter((r) => {
      if (sessionKindFilter === 'cancelled') return r.isCancelled
      if (sessionKindFilter === 'one_off') return isOperationalOneOff(r)
      if (sessionKindFilter === 'regular') return isOperationalRecurring(r)
      return true
    })
  }, [mergedTimelineRaw, sessionKindFilter])

  const skippableSessionId = useMemo(() => {
    const row = firstNonCancelledSession(mergedTimelineRaw)
    return row?.sessionId || row?.id || ''
  }, [mergedTimelineRaw])

  const hasSkippableSession = Boolean(skippableSessionId)

  const cadenceSummary = useMemo(() => formatCadenceLine(items), [items])

  const summaryPlace = useMemo(() => {
    const fromBatch = selectedBatch?.location || selectedBatch?.placeName
    const fromSchedule = items.find((s) => s.placeName)?.placeName
    const raw = fromSchedule || fromBatch
    return raw ? stripDemoSuffix(raw) : ''
  }, [items, selectedBatch])

  const displayedUpcoming = useMemo(() => {
    if (showAllUpcoming || mergedTimeline.length <= upcomingCap) return mergedTimeline
    return mergedTimeline.slice(0, upcomingCap)
  }, [mergedTimeline, showAllUpcoming, upcomingCap])

  const hasMoreUpcoming = mergedTimeline.length > upcomingCap

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
    setShowAllUpcoming(false)
    setDrawerSessionId(null)
    setDrawerSeedRow(null)
  }

  const refreshAll = () => {
    if (effectiveBatchId) fetchSchedule(effectiveBatchId)
    loadSessions()
    fetchTodayClasses()
  }

  const handleStartSession = useCallback(
    async (row) => {
      const sid = row.sessionId || row.id
      if (!sid) return
      if (
        !window.confirm(
          'Start this session now? We will record the start time and open attendance.',
        )
      ) {
        return
      }
      try {
        await batchesApi.patchSession(String(sid), {
          actualStartTime: new Date().toISOString(),
        })
        refreshAll()
        navigate(`/coach/attendance/class/${encodeURIComponent(sid)}`)
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Could not start session'
        window.alert(msg)
      }
    },
    [navigate, refreshAll],
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
        <CCard className="onrep-surface-b border-0 mb-3">
          <CCardBody className="py-3 px-3 px-md-4 d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div className="min-w-0 flex-grow-1">
              <div className="onrep-type-label mb-2">Weekly schedule</div>
              <div className="onrep-type-level2 text-break">
                {cadenceSummary || 'No schedule saved yet'}
              </div>
              {summaryPlace ? (
                <div className="onrep-type-muted small mt-2 text-break">{summaryPlace}</div>
              ) : null}
              {effectiveBatchId && error ? (
                <CAlert color="danger" className="mt-3 mb-0 py-2">
                  {error.message}
                </CAlert>
              ) : null}
              {effectiveBatchId && loading ? (
                <div className="d-flex align-items-center gap-2 mt-3 text-body-secondary small">
                  <CSpinner size="sm" /> Loading schedule…
                </div>
              ) : null}
              {!effectiveBatchId ? (
                <CAlert color="light" className="mt-3 mb-0 py-2 small">
                  Select a batch above to view and edit the weekly schedule.
                </CAlert>
              ) : null}
              {!loading && effectiveBatchId && !items.length && !error ? (
                <CAlert color="info" className="mt-3 mb-0 py-2 small">
                  No saved pattern yet—use Edit to add your weekly schedule.
                </CAlert>
              ) : null}
            </div>
            <div className="d-flex flex-wrap gap-2 flex-shrink-0 align-items-center">
              {effectiveBatchId ? (
                <CButton
                  size="sm"
                  color="secondary"
                  variant="outline"
                  className="text-decoration-none"
                  onClick={() => fetchSchedule(effectiveBatchId)}
                  disabled={loading}
                >
                  Refresh
                </CButton>
              ) : null}
              <CButton
                color="primary"
                size="sm"
                disabled={!effectiveBatchId}
                onClick={() => setWeeklyPatternOpen((o) => !o)}
              >
                {weeklyPatternOpen ? 'Done' : 'Edit'}
              </CButton>
            </div>
          </CCardBody>
          <CCollapse visible={weeklyPatternOpen}>
            <div className="border-top border-light-subtle px-3 px-md-4 pb-4 pt-3">
              <div className="schedule-page__pattern-editor mx-auto">
                <ScheduleBuilderCard
                  embedded
                  batchId={effectiveBatchId}
                  places={places}
                  placeId={placeId}
                  onPlaceIdChange={setPlaceId}
                  onSave={async (payload) => {
                    try {
                      await createSchedule(payload).unwrap()
                      if (effectiveBatchId) fetchSchedule(effectiveBatchId)
                    } catch {
                      /* mutationError */
                    }
                  }}
                  saving={saving}
                  mutationError={mutationError}
                />
              </div>
            </div>
          </CCollapse>
        </CCard>
      </section>

      <section className="mb-5 schedule-page__section-upcoming">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3 mb-3">
          <h2 className="schedule-page__section-title mb-0">Upcoming sessions</h2>
          <div className="schedule-page__filters-toolbar">
            <div className="schedule-page__session-filters" role="group" aria-label="Session filters">
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
            <CButton
              color="primary"
              size="sm"
              className="schedule-page__add-one-off-btn"
              disabled={!effectiveBatchId}
              onClick={() => setCreateOneTimeOpen(true)}
            >
              + One-off session
            </CButton>
          </div>
        </div>
        <CCard className="schedule-page__upcoming-card onrep-surface-a border-0">
          <CCardBody className="py-3 px-3 px-md-4">
            {sessionsError ? <CAlert color="danger">{sessionsError}</CAlert> : null}
            {sessionsLoading ? (
              <div className="text-center py-3">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!sessionsLoading && !mergedTimeline.length ? (
              <div className="onrep-type-muted small">
                {mergedTimelineRaw.length
                  ? 'No sessions match this filter.'
                  : 'No upcoming sessions in this window.'}
              </div>
            ) : null}
            {!sessionsLoading &&
              displayedUpcoming.map((row) => {
                const sid = row.sessionId || row.id
                const ymd = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
                const isTodayRow = Boolean(todayIso && ymd === todayIso)
                const hasActualStart = Boolean(row.actualStartTime ?? row.actual_start_time)
                const canStartToday =
                  isTodayRow &&
                  !row.attendanceMarked &&
                  !row.isCancelled &&
                  !hasActualStart
                return (
                  <CompactSessionRow
                    key={sid}
                    row={row}
                    todayIso={todayIso}
                    placeFallback={primaryPlaceFallback}
                    canStartToday={canStartToday}
                    onStartSession={handleStartSession}
                    onViewSession={(id, r) => {
                      setDrawerSessionId(id)
                      setDrawerSeedRow(r)
                    }}
                  />
                )
              })}
            {!sessionsLoading && hasMoreUpcoming ? (
              <div className="mt-3 pt-2 border-top border-light-subtle">
                <CButton
                  color="link"
                  className="px-0 text-decoration-none"
                  onClick={() => setShowAllUpcoming((v) => !v)}
                >
                  {showAllUpcoming ? 'Show fewer sessions' : 'View all upcoming sessions'}
                </CButton>
              </div>
            ) : null}
          </CCardBody>
        </CCard>
      </section>

      <section className="schedule-page__section-advanced mb-5">
        <div className="onrep-surface-c px-3 py-4 px-md-4 rounded-3 border border-light-subtle shadow-none">
          <ScheduleAdvancedAccordion
            batchId={effectiveBatchId}
            placeId={placeId}
            skippableSessionId={skippableSessionId}
            hasSkippableSession={hasSkippableSession}
            todayIso={todayIso}
            onDone={refreshAll}
          />
        </div>
      </section>

      <CreateOneTimeSessionDrawer
        visible={createOneTimeOpen}
        batch={selectedBatch}
        places={places}
        onClose={() => setCreateOneTimeOpen(false)}
        onCreated={refreshAll}
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
