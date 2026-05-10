import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import { useBatches } from '../../batches/hooks/useBatches'
import usePlaces from '../../places/hooks/usePlaces'
import { useSchedule } from '../hooks/useSchedule'
import ScheduleBuilderCard from '../components/ScheduleBuilderCard'
import ScheduleAdvancedAccordion from '../components/ScheduleAdvancedAccordion'
import SessionDetailDrawer from '../components/SessionDetailDrawer'
import CompactSessionRow from '../components/CompactSessionRow'
import { formatDaysOfWeekList, formatTimeRange } from '../../places/utils/formatScheduleDays'
import {
  formatOperationalSessionRange,
  normalizeSessionDateYmd,
} from '../../classes/utils/sessionDisplay'
import { normalizeTrainingSessionRow } from '../../classes/utils/sessionRow'
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

  const mergedTimeline = useMemo(
    () =>
      mergeBatchSessionInstances(effectiveBatchId, todayBatchClasses, sessionRows, todayIso, 80),
    [effectiveBatchId, todayBatchClasses, sessionRows, todayIso],
  )

  const skippableSessionId = useMemo(() => {
    const row = firstNonCancelledSession(mergedTimeline)
    return row?.sessionId || row?.id || ''
  }, [mergedTimeline])

  const hasSkippableSession = Boolean(skippableSessionId)

  const cadenceSummary = useMemo(() => formatCadenceLine(items), [items])

  const summaryPlace = useMemo(() => {
    const fromBatch = selectedBatch?.location || selectedBatch?.placeName
    const fromSchedule = items.find((s) => s.placeName)?.placeName
    const raw = fromSchedule || fromBatch
    return raw ? stripDemoSuffix(raw) : ''
  }, [items, selectedBatch])

  const nextSummaryLine = useMemo(() => {
    if (!mergedTimeline.length) return 'No upcoming sessions ahead.'
    const row = firstNonCancelledSession(mergedTimeline) || mergedTimeline[0]
    return `Next · ${formatOperationalSessionRange(
      row.sessionDate,
      row.startTime,
      row.endTime ?? row.end_time,
      todayIso,
    )}`
  }, [mergedTimeline, todayIso])

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

  const handleBatchChange = (e) => {
    const id = e.target.value
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('batchId', id)
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

  return (
    <div className="schedule-page">
      <CCard className="mb-4 schedule-page__toolbar onrep-surface-b border-0">
        <CCardHeader className="py-3 px-3 px-md-4 bg-transparent border-0">
          <div className="d-flex flex-column gap-2">
            <strong className="schedule-page__toolbar-title d-block">Schedule</strong>
            <div className="row g-2 align-items-end">
              <CCol xs={12} md={7} lg={6}>
                <CFormLabel className="mb-0 small text-body-secondary">Batch</CFormLabel>
                <CFormSelect
                  value={effectiveBatchId || ''}
                  onChange={handleBatchChange}
                  disabled={!batches.length}
                  aria-label="Select batch"
                >
                  {batches.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {stripDemoSuffix(b.name || '') || 'Untitled batch'}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </div>
          </div>
        </CCardHeader>
      </CCard>

      <section className="mb-5 schedule-page__section-upcoming">
        <div className="d-flex justify-content-between align-items-baseline gap-2 mb-3 flex-wrap">
          <h2 className="schedule-page__section-title mb-0">Upcoming sessions</h2>
        </div>
        <CCard className="schedule-page__upcoming-card onrep-surface-a border-0">
          <CCardBody className="py-3 px-3 px-md-4">
            {effectiveBatchId ? (
              <div className="schedule-page__upcoming-summary mb-4 pb-3 border-bottom border-light-subtle">
                <div className="onrep-type-level2 text-break">
                  {cadenceSummary || 'No weekly pattern saved'}
                </div>
                {summaryPlace ? (
                  <div className="onrep-type-muted mt-2 small text-break">{summaryPlace}</div>
                ) : null}
                <div className="onrep-type-muted mt-2 small">{nextSummaryLine}</div>
              </div>
            ) : null}
            {sessionsError ? <CAlert color="danger">{sessionsError}</CAlert> : null}
            {sessionsLoading ? (
              <div className="text-center py-3">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!sessionsLoading && !mergedTimeline.length ? (
              <div className="onrep-type-muted small">No upcoming sessions in this window.</div>
            ) : null}
            {!sessionsLoading &&
              displayedUpcoming.map((row) => {
                const sid = row.sessionId || row.id
                const ymd = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
                const isTodayRow = Boolean(todayIso && ymd === todayIso)
                const canStartToday = isTodayRow && !row.attendanceMarked && !row.isCancelled
                return (
                  <CompactSessionRow
                    key={sid}
                    row={row}
                    todayIso={todayIso}
                    placeFallback={primaryPlaceFallback}
                    canStartToday={canStartToday}
                    attendancePath={
                      sid ? `/coach/attendance/class/${encodeURIComponent(sid)}` : undefined
                    }
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

      <section className="mb-4 schedule-page__section-weekly">
        <CCard className="onrep-surface-b border-0 mb-3">
          <CCardBody className="py-3 px-3 px-md-4 d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div className="min-w-0 flex-grow-1">
              <div className="onrep-type-label mb-2">Weekly pattern</div>
              <div className="onrep-type-level2 text-break">
                {cadenceSummary || 'No pattern yet'}
              </div>
              {summaryPlace ? (
                <div className="onrep-type-muted small mt-2 text-break">{summaryPlace}</div>
              ) : null}
            </div>
            <CButton
              color="primary"
              size="sm"
              className="flex-shrink-0"
              disabled={!effectiveBatchId}
              onClick={() => setWeeklyPatternOpen((o) => !o)}
            >
              {weeklyPatternOpen ? 'Done' : 'Edit'}
            </CButton>
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

      <section className="mb-5 schedule-page__section-recurring">
        <CCard className="onrep-surface-b border-0 mb-3">
          <CCardBody className="py-3 px-3 px-md-4">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div className="onrep-type-label mb-0">Recurring patterns</div>
              {effectiveBatchId ? (
                <CButton
                  size="sm"
                  color="link"
                  className="text-decoration-none p-0 flex-shrink-0"
                  onClick={() => fetchSchedule(effectiveBatchId)}
                >
                  Refresh
                </CButton>
              ) : null}
            </div>
            {!effectiveBatchId ? (
              <CAlert color="light" className="py-2 mb-0">
                Select a batch first.
              </CAlert>
            ) : null}
            {error ? <CAlert color="danger">{error.message}</CAlert> : null}
            {loading ? (
              <div className="text-center py-3">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!loading && effectiveBatchId && !items.length ? (
              <CAlert color="info" className="py-2 mb-0 small">
                No saved patterns yet—use the weekly pattern editor above.
              </CAlert>
            ) : null}
            {!loading &&
              items.map((schedule) => (
                <div
                  key={schedule.id || schedule._id}
                  className="py-3 border-bottom border-light-subtle small"
                >
                  <div className="fw-semibold">{formatDaysOfWeekList(schedule.daysOfWeek)}</div>
                  <div className="text-body-secondary">
                    {formatTimeRange(
                      schedule.startTime ?? schedule.start_time,
                      schedule.endTime ?? schedule.end_time,
                    )}
                    {schedule.placeName ? ` · ${stripDemoSuffix(schedule.placeName)}` : ''}
                  </div>
                </div>
              ))}
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
