import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCollapse,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CSpinner,
} from '@coreui/react'
import batchesApi from '../../batches/api/batchesApi'
import { normalizeTrainingSessionRow } from '../../classes/utils/sessionRow'
import {
  formatActualSessionRange,
  formatOperationalSessionRange,
  formatSessionCalendarDate,
  formatSessionClockRange,
  normalizeSessionDateYmd,
} from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import {
  canMarkSessionAttendance,
  sessionAttendanceIneligibleMessage,
} from '../../../domain/operationalSessions/helpers/attendanceEligibility'

function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(v) {
  if (!v || String(v).trim() === '') return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function formatCancelledAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

function statusChip(row, todayIso) {
  if (row.isCancelled) return { label: 'Cancelled', color: 'secondary' }
  const actualStart = row.actualStartTime ?? row.actual_start_time
  if (actualStart && !row.attendanceMarked) return { label: 'In progress', color: 'warning' }
  if (row.attendanceMarked) return { label: 'Completed', color: 'success' }
  const ymd = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
  if (ymd && todayIso && ymd === todayIso) return { label: 'Today', color: 'info' }
  return { label: 'Scheduled', color: 'primary' }
}

const DEFAULT_TITLE_FALLBACK = 'Evening Edge Training'

/**
 * Right-side operational drawer for a single materialized training session.
 */
export default function SessionDetailDrawer({
  visible,
  sessionId,
  initialRow = null,
  todayIso,
  onClose,
  onUpdated,
}) {
  const seedNormalized = useMemo(() => {
    if (!sessionId || !initialRow) return null
    if (String(initialRow.sessionId || initialRow.id) !== String(sessionId)) return null
    return normalizeTrainingSessionRow(initialRow)
  }, [sessionId, initialRow])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [row, setRow] = useState(seedNormalized)

  const [titleEdit, setTitleEdit] = useState(
    seedNormalized?.title ? String(seedNormalized.title) : '',
  )
  const [commentsEdit, setCommentsEdit] = useState(
    seedNormalized?.sessionComments ? String(seedNormalized.sessionComments) : '',
  )
  const [cancelReasonDraft, setCancelReasonDraft] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [timingOpen, setTimingOpen] = useState(false)
  const [actualStartLocal, setActualStartLocal] = useState(
    toDatetimeLocalValue(seedNormalized?.actualStartTime),
  )
  const [actualEndLocal, setActualEndLocal] = useState(
    toDatetimeLocalValue(seedNormalized?.actualEndTime),
  )
  const [timeOverrideReasonDraft, setTimeOverrideReasonDraft] = useState(
    seedNormalized?.timeOverrideReason ? String(seedNormalized.timeOverrideReason) : '',
  )

  const load = useCallback(async () => {
    if (!sessionId) return
    setError(null)
    setLoading(true)
    try {
      const data = await batchesApi.getSession(sessionId)
      const raw = data?.session ?? data
      const n = normalizeTrainingSessionRow(raw)
      setRow(n)
      setTitleEdit(n?.title ? String(n.title) : '')
      setCommentsEdit(n?.sessionComments ? String(n.sessionComments) : '')
      setActualStartLocal(toDatetimeLocalValue(n?.actualStartTime))
      setActualEndLocal(toDatetimeLocalValue(n?.actualEndTime))
      setTimeOverrideReasonDraft(n?.timeOverrideReason ? String(n.timeOverrideReason) : '')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to load session.')
      setRow(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (!visible || !sessionId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() begins session fetch when drawer opens
    load()
  }, [visible, sessionId, load])

  const mergeSessionResponse = useCallback(
    (payload) => {
      const raw = payload?.session ?? payload
      if (!raw) return
      const n = normalizeTrainingSessionRow(raw)
      setRow(n)
      setTitleEdit(n?.title ? String(n.title) : '')
      setCommentsEdit(n?.sessionComments ? String(n.sessionComments) : '')
      setActualStartLocal(toDatetimeLocalValue(n?.actualStartTime))
      setActualEndLocal(toDatetimeLocalValue(n?.actualEndTime))
      setTimeOverrideReasonDraft(n?.timeOverrideReason ? String(n.timeOverrideReason) : '')
      onUpdated?.()
    },
    [onUpdated],
  )

  const patchOperational = async (body) => {
    if (!sessionId) return
    setBusy(true)
    setError(null)
    try {
      const data = await batchesApi.patchSession(sessionId, body)
      mergeSessionResponse(data)
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const handleBlurTitleComments = async () => {
    if (!row) return
    const t = titleEdit.trim()
    const c = commentsEdit.trim()
    const prevTitle = row.title ? String(row.title) : ''
    const prevComments = row.sessionComments ? String(row.sessionComments) : ''
    if (t === prevTitle && c === prevComments) return
    await patchOperational({
      sessionTitle: t || null,
      sessionComments: c || null,
    })
  }

  const handleConfirmCancel = async () => {
    await patchOperational({
      isCancelled: true,
      cancelReason: cancelReasonDraft.trim() || null,
    })
    setShowCancelConfirm(false)
    setCancelReasonDraft('')
  }

  const handleUncancel = async () => {
    if (!window.confirm('Restore this session on the schedule?')) return
    await patchOperational({
      isCancelled: false,
      cancelReason: null,
    })
  }

  const handleSaveTiming = async () => {
    const asIso = fromDatetimeLocalValue(actualStartLocal)
    const aeIso = fromDatetimeLocalValue(actualEndLocal)
    if (asIso === undefined || aeIso === undefined) {
      setError('Enter valid dates and times for actual start and end.')
      return
    }
    await patchOperational({
      actualStartTime: asIso,
      actualEndTime: aeIso,
      timeOverrideReason: timeOverrideReasonDraft.trim() || null,
    })
    setTimingOpen(false)
  }

  const handleClearTiming = async () => {
    if (!window.confirm('Clear recorded actual timing?')) return
    setActualStartLocal('')
    setActualEndLocal('')
    setTimeOverrideReasonDraft('')
    await patchOperational({
      actualStartTime: null,
      actualEndTime: null,
      timeOverrideReason: null,
    })
  }

  const headerTitle = useMemo(() => {
    const t = row?.title && String(row.title).trim()
    return t || DEFAULT_TITLE_FALLBACK
  }, [row])

  const scheduledRangeLine = useMemo(() => {
    if (!row) return ''
    return formatSessionClockRange(row.startTime ?? row.start_time, row.endTime ?? row.end_time)
  }, [row])

  const scheduledHeaderLine = useMemo(() => {
    if (!row) return ''
    const cal = formatSessionCalendarDate(row.sessionDate ?? row.session_date, {
      weekday: 'long',
      month: 'short',
    })
    const place = stripDemoSuffix(String(row.placeName || row.location || '').trim())
    const base = `${cal} · ${scheduledRangeLine}`
    return place ? `${base} · ${place}` : base
  }, [row, scheduledRangeLine])

  const chip = useMemo(() => (row ? statusChip(row, todayIso) : null), [row, todayIso])

  const actualRangeFormatted = useMemo(
    () => formatActualSessionRange(row?.actualStartTime, row?.actualEndTime),
    [row?.actualStartTime, row?.actualEndTime],
  )

  const attendancePath = sessionId && `/coach/attendance/class/${encodeURIComponent(sessionId)}`

  const sessionStarted = Boolean(row?.actualStartTime ?? row?.actual_start_time)
  const attendanceAllowed = row ? canMarkSessionAttendance(row) : false
  const attendanceBlockedMessage = row ? sessionAttendanceIneligibleMessage(row) : ''

  /** Backend enforces cutoff, present marks, and started session. */
  const canCancel =
    row &&
    !row.isCancelled &&
    !sessionStarted &&
    String(row.status || '').toUpperCase() !== 'CANCELLED'

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} className="onrep-session-drawer">
      <COffcanvasHeader className="border-bottom border-light-subtle">
        <div className="min-w-0 pe-2">
          <COffcanvasTitle className="h5 mb-1 text-break">{headerTitle}</COffcanvasTitle>
          {row ? (
            <>
              <div className="small text-body-secondary text-break">{scheduledHeaderLine}</div>
              <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                {chip ? (
                  <CBadge color={chip.color} className="rounded-pill px-2 py-1 fw-semibold">
                    {chip.label}
                  </CBadge>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-4 pb-5">
        {loading ? (
          <div className="text-center py-5">
            <CSpinner />
          </div>
        ) : null}

        {error ? (
          <CAlert color="danger" className="py-2 mb-0">
            {error}
          </CAlert>
        ) : null}

        {!loading && row ? (
          <>
            <section>
              <div className="onrep-type-label mb-2">Session details</div>
              <div className="mb-3">
                <CFormLabel className="small text-body-secondary mb-1">Session name</CFormLabel>
                <CFormInput
                  value={titleEdit}
                  onChange={(e) => setTitleEdit(e.target.value)}
                  onBlur={() => handleBlurTitleComments()}
                  placeholder="Name shown to coaches on the schedule"
                  disabled={busy || row.isCancelled}
                />
              </div>
              <div>
                <CFormLabel className="small text-body-secondary mb-1">Comments</CFormLabel>
                <CFormTextarea
                  rows={3}
                  value={commentsEdit}
                  onChange={(e) => setCommentsEdit(e.target.value)}
                  onBlur={() => handleBlurTitleComments()}
                  placeholder="Optional notes for coaches, parents, or session operations."
                  disabled={busy || row.isCancelled}
                />
              </div>
            </section>

            <section>
              <div className="onrep-type-label mb-2">Session status</div>
              {sessionStarted && !row.isCancelled ? (
                <p className="small text-body-secondary mb-2">
                  This session has started (actual start time recorded). It cannot be cancelled from
                  here.
                </p>
              ) : null}
              {!sessionStarted && row.attendanceMarked && !row.isCancelled ? (
                <p className="small text-body-secondary mb-2">
                  Cancel may still be allowed before the scheduled end time if no student was marked
                  present. Otherwise you&apos;ll see an error from the server.
                </p>
              ) : null}
              {row.isCancelled ? (
                <div className="rounded-3 px-3 py-3 bg-body-secondary bg-opacity-10">
                  <div className="fw-semibold text-body-secondary">Cancelled</div>
                  {row.cancelReason ? (
                    <div className="small mt-2">
                      <span className="text-body-secondary">Reason: </span>
                      {row.cancelReason}
                    </div>
                  ) : null}
                  {row.cancelledAt ? (
                    <div className="small text-body-secondary mt-1">
                      Cancelled at {formatCancelledAt(row.cancelledAt)}
                    </div>
                  ) : null}
                  <CButton
                    color="link"
                    className="px-0 mt-2 text-decoration-none"
                    disabled={busy}
                    onClick={handleUncancel}
                  >
                    Restore session
                  </CButton>
                </div>
              ) : (
                <>
                  {!showCancelConfirm ? (
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      disabled={busy || !canCancel}
                      className={busy || !canCancel ? 'opacity-50' : ''}
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      Cancel session
                    </CButton>
                  ) : (
                    <div className="border border-light-subtle rounded-3 p-3">
                      <CFormLabel className="small mb-1">Reason (optional)</CFormLabel>
                      <CFormInput
                        size="sm"
                        value={cancelReasonDraft}
                        onChange={(e) => setCancelReasonDraft(e.target.value)}
                        placeholder="e.g. Rink maintenance"
                        className="mb-2"
                      />
                      <div className="d-flex flex-wrap gap-2">
                        <CButton
                          color="danger"
                          size="sm"
                          disabled={busy}
                          onClick={handleConfirmCancel}
                        >
                          Confirm cancellation
                        </CButton>
                        <CButton
                          color="secondary"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setShowCancelConfirm(false)
                            setCancelReasonDraft('')
                          }}
                        >
                          Back
                        </CButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <section>
              <div className="onrep-type-label mb-2">Timing</div>
              <div className="small mb-1">
                <span className="text-body-secondary">Scheduled: </span>
                {scheduledRangeLine}
              </div>
              <div className="small mb-2">
                <span className="text-body-secondary">Actual: </span>
                {actualRangeFormatted ? (
                  <span className="fw-semibold">{actualRangeFormatted}</span>
                ) : (
                  <span className="text-body-secondary fst-italic">
                    No timing adjustments recorded.
                  </span>
                )}
              </div>
              {row.timeOverrideReason && actualRangeFormatted ? (
                <div className="small text-body-secondary mb-2">{row.timeOverrideReason}</div>
              ) : null}
              {row.isCancelled ? null : (
                <>
                  <CButton
                    color="link"
                    className="px-0 text-decoration-none"
                    onClick={() => setTimingOpen((o) => !o)}
                  >
                    {timingOpen ? 'Close' : 'Record timing adjustment'}
                  </CButton>
                  <CCollapse visible={timingOpen}>
                    <div className="border border-light-subtle rounded-3 p-3 mt-2">
                      <div className="row g-2">
                        <div className="col-12">
                          <CFormLabel className="small mb-0">Actual start</CFormLabel>
                          <CFormInput
                            type="datetime-local"
                            value={actualStartLocal}
                            onChange={(e) => setActualStartLocal(e.target.value)}
                          />
                        </div>
                        <div className="col-12">
                          <CFormLabel className="small mb-0">Actual end</CFormLabel>
                          <CFormInput
                            type="datetime-local"
                            value={actualEndLocal}
                            onChange={(e) => setActualEndLocal(e.target.value)}
                          />
                        </div>
                        <div className="col-12">
                          <CFormLabel className="small mb-0">Reason (optional)</CFormLabel>
                          <CFormInput
                            size="sm"
                            value={timeOverrideReasonDraft}
                            onChange={(e) => setTimeOverrideReasonDraft(e.target.value)}
                            placeholder="Coach delayed due to rain"
                          />
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <CButton
                          color="primary"
                          size="sm"
                          disabled={busy}
                          onClick={handleSaveTiming}
                        >
                          Save timing
                        </CButton>
                        <CButton
                          color="secondary"
                          variant="ghost"
                          size="sm"
                          disabled={busy || !actualRangeFormatted}
                          onClick={handleClearTiming}
                        >
                          Clear actual times
                        </CButton>
                      </div>
                    </div>
                  </CCollapse>
                </>
              )}
            </section>

            <section className="mt-auto pt-2 border-top border-light-subtle">
              {attendancePath && attendanceAllowed ? (
                <CButton color="primary" className="w-100 mb-2" as={Link} to={attendancePath}>
                  Open attendance
                </CButton>
              ) : null}
              {row.attendanceEnabled === false ? (
                <div className="small text-body-secondary mb-2">
                  Attendance tracking is off for this session.
                </div>
              ) : null}
              {row.attendanceEnabled !== false && !attendanceAllowed && attendanceBlockedMessage ? (
                <div className="small text-body-secondary mb-2">{attendanceBlockedMessage}</div>
              ) : null}
              <div className="small text-body-secondary">
                Scheduled window:{' '}
                {formatOperationalSessionRange(
                  row.sessionDate,
                  row.startTime ?? row.start_time,
                  row.endTime ?? row.end_time,
                  todayIso,
                )}
              </div>
            </section>
          </>
        ) : null}

        {busy ? (
          <div
            className="position-fixed bottom-0 end-0 p-3 pe-4"
            style={{ width: 'min(100vw, 480px)' }}
          >
            <div className="bg-body rounded shadow-sm px-3 py-2 small">
              <CSpinner size="sm" className="me-2" />
              Saving…
            </div>
          </div>
        ) : null}
      </COffcanvasBody>
    </COffcanvas>
  )
}
