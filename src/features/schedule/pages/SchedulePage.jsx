import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import { useBatches } from '../../batches/hooks/useBatches'
import usePlaces from '../../places/hooks/usePlaces'
import { useSchedule } from '../hooks/useSchedule'
import ScheduleBuilderCard from '../components/ScheduleBuilderCard'
import ScheduleSessionActionsSection from '../components/ScheduleSessionActionsSection'
import { formatDaysOfWeekList, formatTimeRange } from '../../places/utils/formatScheduleDays'
import { formatOperationalSessionRange } from '../../classes/utils/sessionDisplay'
import { normalizeTrainingSessionRow } from '../../classes/utils/sessionRow'
import batchesApi from '../../batches/api/batchesApi'
import useClasses from '../../classes/hooks/useClasses'
import { mergeBatchSessionInstances, todayIsoLocal } from '../../batches/utils/batchWorkspaceOperations'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'
import { setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
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

  const [placeId, setPlaceId] = useState('')
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)
  const [sessionRows, setSessionRows] = useState([])

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
  }, [
    bootstrapComplete,
    selectedBatch,
    effectiveBatchId,
    activities,
    activeActivityId,
    dispatch,
  ])

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
      })
      const rows = Array.isArray(sessions) ? sessions.map((s) => normalizeTrainingSessionRow(s)) : []
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
      mergeBatchSessionInstances(
        effectiveBatchId,
        todayBatchClasses,
        sessionRows,
        todayIso,
        80,
      ),
    [effectiveBatchId, todayBatchClasses, sessionRows, todayIso],
  )

  const firstTimelineId = mergedTimeline[0]?.sessionId || mergedTimeline[0]?.id || ''

  const handleBatchChange = (e) => {
    const id = e.target.value
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('batchId', id)
      return n
    })
  }

  const refreshAll = () => {
    if (effectiveBatchId) fetchSchedule(effectiveBatchId)
    loadSessions()
    fetchTodayClasses()
  }

  return (
    <div className="schedule-page">
      <CCard className="mb-4 schedule-page__toolbar onrep-surface-b border-0">
        <CCardHeader className="py-3 bg-transparent border-0">
          <div className="d-flex flex-column gap-2">
            <strong className="d-block">Schedule</strong>
            <div className="row g-2 align-items-end">
              <CCol xs={12} md={6}>
                <CFormLabel className="mb-0 small">Batch</CFormLabel>
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

      <section className="mb-4 schedule-page__section-upcoming">
        <h2 className="schedule-page__section-title mb-3">Upcoming sessions</h2>
        <CCard className="schedule-page__upcoming-card onrep-surface-a onrep-surface-a--accent border-0">
          <CCardBody className="py-4 px-3 px-md-4">
            {sessionsError ? <CAlert color="danger">{sessionsError}</CAlert> : null}
            {sessionsLoading ? (
              <div className="text-center py-2">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!sessionsLoading && !mergedTimeline.length ? (
              <div className="text-body-secondary small">No upcoming sessions in this window.</div>
            ) : null}
            {!sessionsLoading &&
              mergedTimeline.map((row) => {
                const sid = row.sessionId || row.id
                const line = formatOperationalSessionRange(
                  row.sessionDate,
                  row.startTime,
                  row.endTime ?? row.end_time,
                  todayIso,
                )
                return (
                  <div
                    key={sid}
                    className="d-flex flex-column flex-sm-row justify-content-between gap-2 py-2 border-bottom border-light-subtle"
                  >
                    <div className="min-w-0">
                      <div className="schedule-page__session-time">{line}</div>
                      <div className="schedule-page__session-place small text-truncate">
                        {stripDemoSuffix(row.placeName || row.location || '') || ''}
                      </div>
                    </div>
                    {sid ? (
                      <CButton
                        as={Link}
                        size="sm"
                        color="secondary"
                        variant="outline"
                        className="align-self-start"
                        to={`/coach/attendance/class/${encodeURIComponent(sid)}`}
                      >
                        View session
                      </CButton>
                    ) : null}
                  </div>
                )
              })}
          </CCardBody>
        </CCard>
      </section>

      <section className="mb-4 schedule-page__section-weekly">
        <h2 className="schedule-page__section-title schedule-page__section-title--config mb-2">
          Weekly pattern
        </h2>
        <p className="onrep-type-muted mb-3">
          Baseline your recurring days and times. Day-to-day work happens in upcoming sessions above.
        </p>
        <ScheduleBuilderCard
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

        <CCard className="mt-3 onrep-surface-c border-0">
          <CCardHeader className="py-3 d-flex justify-content-between align-items-center bg-transparent border-bottom border-light-subtle">
            <span className="small fw-semibold text-body-secondary">Recurring patterns</span>
            {effectiveBatchId ? (
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                onClick={() => fetchSchedule(effectiveBatchId)}
              >
                Refresh
              </CButton>
            ) : null}
          </CCardHeader>
          <CCardBody className="py-2">
            {!effectiveBatchId ? (
              <CAlert color="light" className="py-2 mb-0">
                Create a batch first to add weekly schedules.
              </CAlert>
            ) : null}
            {error ? <CAlert color="danger">{error.message}</CAlert> : null}
            {loading ? (
              <div className="text-center py-3">
                <CSpinner size="sm" />
              </div>
            ) : null}
            {!loading && effectiveBatchId && !items.length ? (
              <CAlert color="info" className="py-2 mb-0">
                No recurring patterns yet. Add a weekly pattern above.
              </CAlert>
            ) : null}
            {!loading &&
              items.map((schedule) => (
                <div key={schedule.id || schedule._id} className="py-1 border-bottom small">
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

      <section className="schedule-page__section-c">
        <ScheduleSessionActionsSection
          batchId={effectiveBatchId}
          placeId={placeId}
          mergedTimelineFirstId={firstTimelineId}
          hasUpcomingTimeline={mergedTimeline.length > 0}
          todayIso={todayIso}
          onDone={refreshAll}
        />
      </section>
    </div>
  )
}

export default SchedulePage
