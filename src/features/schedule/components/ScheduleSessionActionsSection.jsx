import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCollapse,
  CCol,
  CFormInput,
  CFormLabel,
  CRow,
} from '@coreui/react'
import batchesApi from '../../batches/api/batchesApi'

/**
 * Section C — advanced / secondary. Keep visually quiet: collapsed by default,
 * lighter weight, fewer controls visible at once (nested sub-sections).
 */
export default function ScheduleSessionActionsSection({
  batchId,
  placeId,
  mergedTimelineFirstId,
  hasUpcomingTimeline,
  todayIso,
  onDone,
}) {
  const [open, setOpen] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const [timesOpen, setTimesOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [extraDate, setExtraDate] = useState('')
  const [extraStart, setExtraStart] = useState('18:00')
  const [extraEnd, setExtraEnd] = useState('19:30')
  const [adjustStart, setAdjustStart] = useState('')
  const [adjustEnd, setAdjustEnd] = useState('')

  const clearError = () => setError(null)

  const handleFillFromSchedule = async () => {
    if (!batchId) return
    setError(null)
    setBusy(true)
    try {
      const end = new Date()
      end.setDate(end.getDate() + 45)
      const y = end.getFullYear()
      const m = String(end.getMonth() + 1).padStart(2, '0')
      const d = String(end.getDate()).padStart(2, '0')
      await batchesApi.generateClasses({
        batchId,
        fromDate: todayIso,
        toDate: `${y}-${m}-${d}`,
      })
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to update upcoming sessions.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddExtraSession = async () => {
    setError(null)
    if (!extraDate || !extraStart || !extraEnd) {
      setError('Choose a date, start time, and end time.')
      return
    }
    setBusy(true)
    try {
      await batchesApi.createSession({
        batchId,
        sessionDate: extraDate,
        startTime: extraStart,
        endTime: extraEnd,
        title: null,
        placeId: placeId || undefined,
      })
      setExtraDate('')
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to add session.')
    } finally {
      setBusy(false)
    }
  }

  const handleSkipNext = async () => {
    setError(null)
    if (!mergedTimelineFirstId) {
      setError('No session to skip.')
      return
    }
    if (!window.confirm('Skip this session? Students will see it as cancelled.')) return
    setBusy(true)
    try {
      await batchesApi.cancelSession(mergedTimelineFirstId, {
        reason: 'Skipped from schedule page',
      })
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to skip session.')
    } finally {
      setBusy(false)
    }
  }

  const handleAdjustNext = async () => {
    setError(null)
    if (!mergedTimelineFirstId) {
      setError('No session to reschedule.')
      return
    }
    if (!adjustStart || !adjustEnd) {
      setError('Enter new start and end times.')
      return
    }
    setBusy(true)
    try {
      await batchesApi.patchSession(mergedTimelineFirstId, {
        startTime: adjustStart,
        endTime: adjustEnd,
      })
      setAdjustStart('')
      setAdjustEnd('')
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to update times.')
    } finally {
      setBusy(false)
    }
  }

  if (!batchId) return null

  return (
    <CCard className="schedule-session-actions mt-3 onrep-surface-c border-0">
      <CCardHeader
        className="d-flex justify-content-between align-items-center py-3 bg-transparent fw-normal text-body-secondary border-bottom border-light-subtle"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        aria-expanded={open}
      >
        <span className="small">More actions — fixes and adjustments</span>
        <span className="small text-body-secondary">{open ? 'Hide' : 'Show'}</span>
      </CCardHeader>
      <CCollapse visible={open}>
        <CCardBody className="pt-3 pb-3 text-body-secondary">
          {error ? (
            <CAlert
              color="danger"
              className="py-2 d-flex justify-content-between align-items-center flex-wrap gap-2 small"
            >
              <span>{error}</span>
              <CButton size="sm" color="danger" variant="outline" onClick={clearError}>
                Dismiss
              </CButton>
            </CAlert>
          ) : null}

          <p className="small mb-3 mb-md-2">
            Optional. Use when dates are missing, you need an extra session, or times must change.
            Automation will reduce this over time.
          </p>

          <div className="d-flex flex-wrap gap-2 mb-2">
            <CButton
              color="secondary"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={handleFillFromSchedule}
            >
              {busy ? 'Working…' : 'Fill upcoming dates from your weekly schedule'}
            </CButton>
            <CButton
              color="secondary"
              size="sm"
              variant="ghost"
              disabled={busy || !hasUpcomingTimeline}
              onClick={handleSkipNext}
            >
              Skip next session
            </CButton>
          </div>
          <p className="small text-body-secondary mb-3 mb-md-4">
            Fill dates only if the upcoming list above is missing sessions you expect from your
            weekly schedule.
          </p>

          <div className="border-top border-secondary-subtle pt-3">
            <CButton
              color="link"
              className="px-0 py-0 small text-body-secondary text-decoration-none d-block text-start mb-2"
              onClick={() => setExtraOpen((v) => !v)}
              aria-expanded={extraOpen}
            >
              {extraOpen ? '−' : '+'} Extra session
            </CButton>
            <CCollapse visible={extraOpen}>
              <CRow className="g-2 align-items-end mb-3">
                <CCol xs={12} sm={4}>
                  <CFormLabel className="small mb-0">Date</CFormLabel>
                  <CFormInput
                    type="date"
                    size="sm"
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                  />
                </CCol>
                <CCol xs={6} sm={3}>
                  <CFormLabel className="small mb-0">Start</CFormLabel>
                  <CFormInput
                    type="time"
                    size="sm"
                    value={extraStart}
                    onChange={(e) => setExtraStart(e.target.value)}
                  />
                </CCol>
                <CCol xs={6} sm={3}>
                  <CFormLabel className="small mb-0">End</CFormLabel>
                  <CFormInput
                    type="time"
                    size="sm"
                    value={extraEnd}
                    onChange={(e) => setExtraEnd(e.target.value)}
                  />
                </CCol>
                <CCol xs={12} sm={2}>
                  <CButton color="secondary" size="sm" variant="outline" disabled={busy} onClick={handleAddExtraSession}>
                    Add
                  </CButton>
                </CCol>
              </CRow>
            </CCollapse>

            <CButton
              color="link"
              className="px-0 py-0 small text-body-secondary text-decoration-none d-block text-start mb-2"
              onClick={() => setTimesOpen((v) => !v)}
              aria-expanded={timesOpen}
            >
              {timesOpen ? '−' : '+'} Change next session times
            </CButton>
            <CCollapse visible={timesOpen}>
              <CRow className="g-2 align-items-end">
                <CCol xs={6} sm={3}>
                  <CFormLabel className="small mb-0">New start</CFormLabel>
                  <CFormInput
                    type="time"
                    size="sm"
                    value={adjustStart}
                    onChange={(e) => setAdjustStart(e.target.value)}
                  />
                </CCol>
                <CCol xs={6} sm={3}>
                  <CFormLabel className="small mb-0">New end</CFormLabel>
                  <CFormInput
                    type="time"
                    size="sm"
                    value={adjustEnd}
                    onChange={(e) => setAdjustEnd(e.target.value)}
                  />
                </CCol>
                <CCol xs={12} sm={4}>
                  <CButton
                    color="secondary"
                    size="sm"
                    variant="outline"
                    disabled={busy || !hasUpcomingTimeline}
                    onClick={handleAdjustNext}
                  >
                    Update times
                  </CButton>
                </CCol>
              </CRow>
            </CCollapse>
          </div>
        </CCardBody>
      </CCollapse>
    </CCard>
  )
}
