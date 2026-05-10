import React, { useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CRow,
} from '@coreui/react'
import batchesApi from '../../batches/api/batchesApi'

/**
 * Occasional repair actions — accordion keeps each tool compact and optional.
 */
export default function ScheduleAdvancedAccordion({
  batchId,
  placeId,
  skippableSessionId,
  hasSkippableSession,
  todayIso,
  onDone,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [extraDate, setExtraDate] = useState('')
  const [extraStart, setExtraStart] = useState('18:00')
  const [extraEnd, setExtraEnd] = useState('19:30')
  const [extraTitle, setExtraTitle] = useState('')
  const [extraComments, setExtraComments] = useState('')
  const [skipReason, setSkipReason] = useState('')
  const [adjustStart, setAdjustStart] = useState('')
  const [adjustEnd, setAdjustEnd] = useState('')

  const clearError = () => setError(null)

  const handleFillMissing = async () => {
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
      setError(e?.response?.data?.error || e?.message || 'Could not generate sessions.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddExtra = async () => {
    setError(null)
    if (!extraDate || !extraStart || !extraEnd) {
      setError('Pick a date, start time, and end time.')
      return
    }
    setBusy(true)
    try {
      const t = extraTitle.trim()
      const c = extraComments.trim()
      await batchesApi.createSession({
        batchId,
        sessionDate: extraDate,
        startTime: extraStart,
        endTime: extraEnd,
        sessionTitle: t || undefined,
        sessionComments: c || undefined,
        placeId: placeId || undefined,
      })
      setExtraDate('')
      setExtraTitle('')
      setExtraComments('')
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not add session.')
    } finally {
      setBusy(false)
    }
  }

  const handleSkipNext = async () => {
    setError(null)
    if (!skippableSessionId) {
      setError('No active session to skip.')
      return
    }
    if (!window.confirm('Skip this session? It will show as cancelled for students.')) return
    setBusy(true)
    try {
      const r = skipReason.trim()
      await batchesApi.cancelSession(skippableSessionId, {
        reason: r || 'Skipped from schedule',
      })
      setSkipReason('')
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not skip.')
    } finally {
      setBusy(false)
    }
  }

  const handleAdjustNext = async () => {
    setError(null)
    if (!skippableSessionId) {
      setError('No session to adjust.')
      return
    }
    if (!adjustStart || !adjustEnd) {
      setError('Enter new start and end times.')
      return
    }
    setBusy(true)
    try {
      await batchesApi.patchSession(skippableSessionId, {
        startTime: adjustStart,
        endTime: adjustEnd,
      })
      setAdjustStart('')
      setAdjustEnd('')
      onDone?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not update times.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="schedule-adv-accordion">
      <div className="mb-3">
        <div className="onrep-type-level2">Advanced schedule operations</div>
        <p className="onrep-type-muted small mb-0 mt-1">
          Used occasionally for exceptions and repairs.
        </p>
      </div>

      {error ? (
        <CAlert
          color="danger"
          className="py-2 d-flex justify-content-between align-items-center flex-wrap gap-2 small mb-3"
        >
          <span>{error}</span>
          <CButton size="sm" color="danger" variant="outline" onClick={clearError}>
            Dismiss
          </CButton>
        </CAlert>
      ) : null}

      <CAccordion className="schedule-adv-accordion__accordion shadow-none border border-light-subtle rounded-3 overflow-hidden">
        <CAccordionItem itemKey={1}>
          <CAccordionHeader className="schedule-adv-accordion__header">
            Generate missing sessions
          </CAccordionHeader>
          <CAccordionBody className="pt-0">
            <p className="small text-body-secondary mb-3">
              Materialize upcoming sessions from your recurring patterns when the calendar is short.
            </p>
            <CButton
              color="primary"
              size="sm"
              disabled={busy || !batchId}
              onClick={handleFillMissing}
            >
              {busy ? 'Working…' : 'Generate upcoming sessions'}
            </CButton>
          </CAccordionBody>
        </CAccordionItem>

        <CAccordionItem itemKey={2}>
          <CAccordionHeader className="schedule-adv-accordion__header">
            Add one-off extra session
          </CAccordionHeader>
          <CAccordionBody className="pt-0">
            <p className="small text-body-secondary mb-3">
              For makeup ice or special clinics — does not change your weekly template.
            </p>
            <CRow className="g-2 align-items-end">
              <CCol xs={12} sm={4}>
                <CFormLabel className="small mb-1">Date</CFormLabel>
                <CFormInput
                  type="date"
                  size="sm"
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                />
              </CCol>
              <CCol xs={6} sm={3}>
                <CFormLabel className="small mb-1">Start</CFormLabel>
                <CFormInput
                  type="time"
                  size="sm"
                  value={extraStart}
                  onChange={(e) => setExtraStart(e.target.value)}
                />
              </CCol>
              <CCol xs={6} sm={3}>
                <CFormLabel className="small mb-1">End</CFormLabel>
                <CFormInput
                  type="time"
                  size="sm"
                  value={extraEnd}
                  onChange={(e) => setExtraEnd(e.target.value)}
                />
              </CCol>
              <CCol xs={12} sm={2}>
                <CButton
                  color="primary"
                  size="sm"
                  disabled={busy || !batchId}
                  className="w-100"
                  onClick={handleAddExtra}
                >
                  Add session
                </CButton>
              </CCol>
            </CRow>
            <CRow className="g-2 mt-2">
              <CCol xs={12}>
                <CFormLabel className="small mb-1">Session name (optional)</CFormLabel>
                <CFormInput
                  size="sm"
                  value={extraTitle}
                  onChange={(e) => setExtraTitle(e.target.value)}
                  placeholder="e.g. Makeup edge session"
                />
              </CCol>
              <CCol xs={12}>
                <CFormLabel className="small mb-1">Comments (optional)</CFormLabel>
                <CFormTextarea
                  rows={2}
                  size="sm"
                  value={extraComments}
                  onChange={(e) => setExtraComments(e.target.value)}
                  placeholder="Optional notes for coaches, parents, or operations."
                />
              </CCol>
            </CRow>
          </CAccordionBody>
        </CAccordionItem>

        <CAccordionItem itemKey={3}>
          <CAccordionHeader className="schedule-adv-accordion__header">
            Skip next session
          </CAccordionHeader>
          <CAccordionBody className="pt-0">
            <p className="small text-body-secondary mb-3">
              Cancels the next active session on this batch&apos;s timeline so families see it
              clearly.
            </p>
            <div className="mb-3">
              <CFormLabel className="small mb-1">Reason or notes (optional)</CFormLabel>
              <CFormTextarea
                rows={2}
                size="sm"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="e.g. Coach travel — combined with Saturday group"
              />
            </div>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              disabled={busy || !hasSkippableSession || !skippableSessionId}
              onClick={handleSkipNext}
            >
              Skip next session
            </CButton>
          </CAccordionBody>
        </CAccordionItem>

        <CAccordionItem itemKey={4}>
          <CAccordionHeader className="schedule-adv-accordion__header">
            Adjust next session time
          </CAccordionHeader>
          <CAccordionBody className="pt-0">
            <p className="small text-body-secondary mb-3">
              Changes the scheduled clock times for the next active session (template unchanged).
            </p>
            <CRow className="g-2 align-items-end">
              <CCol xs={6} sm={3}>
                <CFormLabel className="small mb-1">New start</CFormLabel>
                <CFormInput
                  type="time"
                  size="sm"
                  value={adjustStart}
                  onChange={(e) => setAdjustStart(e.target.value)}
                />
              </CCol>
              <CCol xs={6} sm={3}>
                <CFormLabel className="small mb-1">New end</CFormLabel>
                <CFormInput
                  type="time"
                  size="sm"
                  value={adjustEnd}
                  onChange={(e) => setAdjustEnd(e.target.value)}
                />
              </CCol>
              <CCol xs={12} sm={4}>
                <CButton
                  color="primary"
                  variant="outline"
                  size="sm"
                  disabled={busy || !hasSkippableSession || !skippableSessionId}
                  onClick={handleAdjustNext}
                >
                  Apply new times
                </CButton>
              </CCol>
            </CRow>
          </CAccordionBody>
        </CAccordionItem>
      </CAccordion>
    </section>
  )
}
