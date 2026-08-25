import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { formatDaysOfWeek } from '@onrep/contracts/recurring-patterns'
import { uiDayLabelsToApi, UI_DAY_LABELS_ORDERED } from '../utils/daysOfWeek'
import PlaceSelect from '../../places/components/PlaceSelect'
import { SESSION_MODE_OPTIONS } from '../../../domain/operationalSessions/constants/sessionModes'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { todayIsoLocal } from '../../batches/utils/batchWorkspaceOperations'
import { formatSessionClock } from '../../classes/utils/sessionDisplay'
import SessionPresetSetup from './SessionPresetSetup'
import { DEFAULT_SESSION_PRESET_ID } from '../constants/sessionPresets'
import scheduleApi from '../api/scheduleApi'
import { friendlyScheduleApiMessage } from '../utils/scheduleUserMessages'

const FOCUS_SUGGESTIONS = [
  'Technical',
  'Conditioning',
  'Endurance',
  'Dryland',
  'Sport',
  'Strength',
  'Recovery',
]

const STEPS = [
  { id: 1, label: 'Who / when' },
  { id: 2, label: 'Training' },
  { id: 3, label: 'Review' },
]

function nextMondayYmd() {
  const now = new Date()
  const day = now.getDay()
  const daysUntilMon = (1 - day + 7) % 7 || 7
  now.setDate(now.getDate() + daysUntilMon)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function newDraftPatternKey() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyDraftPattern(defaults = {}) {
  return {
    key: newDraftPatternKey(),
    name: '',
    days: /** @type {string[]} */ ([]),
    startTime: '17:30',
    endTime: '19:00',
    ...defaults,
  }
}

function uniqueCoachOptions(options = []) {
  const seen = new Set()
  const out = []
  for (const coach of options) {
    const id = String(coach?.id || '')
    if (!id) continue
    const name = String(coach?.name || '').trim()
    if (seen.has(id)) {
      if (name) {
        const existing = out.find((item) => item.id === id)
        if (existing && (!existing.name || existing.name === 'Coach')) existing.name = name
      }
      continue
    }
    seen.add(id)
    out.push({ id, name: name || 'Coach' })
  }
  return out
}

function patternCadenceLabel(pattern) {
  const daysApi = uiDayLabelsToApi(pattern.days)
  const dayPart = formatDaysOfWeek(daysApi) || '—'
  const start = formatSessionClock(pattern.startTime)
  const end = pattern.endTime ? formatSessionClock(pattern.endTime) : ''
  const timePart = start !== '—' && end && end !== '—' ? `${start} – ${end}` : start
  const name = String(pattern.name || '').trim()
  return [name || 'Weekly pattern', dayPart, timePart].filter(Boolean).join(' · ')
}

function validatePattern(pattern) {
  if (!String(pattern.name || '').trim()) {
    return 'Give each schedule a short name (e.g. "Morning training").'
  }
  if (!pattern.days?.length) return 'Pick at least one day of the week for each pattern.'
  if (!pattern.startTime) return 'Start time is required.'
  if (pattern.endTime && pattern.endTime <= pattern.startTime) {
    return 'End time must be after start time.'
  }
  return null
}

function validateStep1(patterns, effectiveFrom, effectiveUntil) {
  if (!patterns.length) return 'Add at least one weekly pattern.'
  for (const p of patterns) {
    const err = validatePattern(p)
    if (err) return err
  }
  if (effectiveFrom && effectiveUntil && effectiveUntil < effectiveFrom) {
    return 'End date must be on or after the start date.'
  }
  return null
}

function buildApiPatterns(patterns, training) {
  return patterns.map((p) => ({
    name: String(p.name || '').trim(),
    daysOfWeek: uiDayLabelsToApi(p.days),
    startTime: p.startTime,
    endTime: p.endTime || null,
    placeId: training.placeId || null,
    coachId: training.coachId || null,
    additionalCoachIds: (training.additionalCoachIds || []).filter(
      (id) => id && String(id) !== String(training.coachId || ''),
    ),
    sessionFocus: String(training.sessionFocus || '').trim() || null,
    sessionMode: training.sessionMode || 'practice',
    ...(training.presetPayload
      ? {
          sessionPresetId: training.presetPayload.sessionPresetId,
          phaseOverrides: training.presetPayload.phaseOverrides,
          presetVersion: training.presetPayload.presetVersion,
        }
      : {
          sessionPresetId: DEFAULT_SESSION_PRESET_ID,
          phaseOverrides: [],
        }),
  }))
}

/**
 * Three-step create wizard for recurring session patterns.
 * Draft is preserved across Back; Confirm sends fingerprint + mutation id.
 */
export default function RecurringSetupWizard({
  visible,
  batch,
  batchId,
  places = [],
  placesLoading = false,
  coaches = [],
  onClose,
  onCreated,
  onEnsurePlaces,
  onQuickAddPlace,
  quickAddSaving = false,
  quickAddError = null,
}) {
  const defaultPlaceId = batch?.defaultPlaceId ?? batch?.default_place_id ?? ''

  const [step, setStep] = useState(1)
  const [patterns, setPatterns] = useState(() => [emptyDraftPattern()])
  const [editingIndex, setEditingIndex] = useState(0)
  const [effectiveFrom, setEffectiveFrom] = useState(() => nextMondayYmd())
  const [effectiveUntil, setEffectiveUntil] = useState('')
  const [placeId, setPlaceId] = useState(defaultPlaceId || '')
  const [coachId, setCoachId] = useState('')
  const [additionalCoachIds, setAdditionalCoachIds] = useState([])
  const [sessionFocus, setSessionFocus] = useState('')
  const [sessionMode, setSessionMode] = useState('practice')
  const [presetPayload, setPresetPayload] = useState(null)
  const handlePresetPayload = useCallback((payload) => setPresetPayload(payload), [])

  const [localError, setLocalError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const clientMutationIdRef = useRef(null)
  const previewGenRef = useRef(0)

  const resetDraft = useCallback(() => {
    setStep(1)
    setPatterns([emptyDraftPattern()])
    setEditingIndex(0)
    setEffectiveFrom(nextMondayYmd())
    setEffectiveUntil('')
    setPlaceId(defaultPlaceId || '')
    setCoachId('')
    setAdditionalCoachIds([])
    setSessionFocus('')
    setSessionMode('practice')
    setPresetPayload(null)
    setLocalError(null)
    setPreview(null)
    setPreviewLoading(false)
    setPreviewError(null)
    setConfirming(false)
    setConfirmError(null)
    clientMutationIdRef.current = crypto.randomUUID()
  }, [defaultPlaceId])

  useEffect(() => {
    if (!visible) return
    onEnsurePlaces?.()
    /* eslint-disable react-hooks/set-state-in-effect -- reset wizard draft when drawer opens */
    resetDraft()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, onEnsurePlaces, resetDraft])

  const coachOptions = useMemo(() => uniqueCoachOptions(coaches), [coaches])
  const additionalCoachOptions = useMemo(
    () => coachOptions.filter((coach) => String(coach.id) !== String(coachId || '')),
    [coachOptions, coachId],
  )

  const training = useMemo(
    () => ({
      placeId,
      coachId,
      additionalCoachIds,
      sessionFocus,
      sessionMode,
      presetPayload,
    }),
    [placeId, coachId, additionalCoachIds, sessionFocus, sessionMode, presetPayload],
  )

  const apiBodyBase = useMemo(() => {
    const apiPatterns = buildApiPatterns(patterns, training)
    return {
      patterns: apiPatterns,
      effectiveFrom: effectiveFrom || undefined,
      effectiveUntil: effectiveUntil || undefined,
      placeId: placeId || undefined,
      coachId: coachId || undefined,
      sessionMode: sessionMode || undefined,
    }
  }, [patterns, training, effectiveFrom, effectiveUntil, placeId, coachId, sessionMode])

  const invalidatePreview = useCallback(() => {
    setPreview(null)
    setPreviewError(null)
    setConfirmError(null)
    clientMutationIdRef.current = crypto.randomUUID()
  }, [])

  const updatePatternAt = (index, patch) => {
    setPatterns((curr) => curr.map((p, i) => (i === index ? { ...p, ...patch } : p)))
    invalidatePreview()
  }

  const toggleDay = (day) => {
    const p = patterns[editingIndex]
    if (!p) return
    const days = p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day]
    updatePatternAt(editingIndex, { days })
  }

  const addPattern = () => {
    const next = emptyDraftPattern({
      startTime: patterns[patterns.length - 1]?.startTime || '17:30',
      endTime: patterns[patterns.length - 1]?.endTime || '19:00',
    })
    setPatterns((curr) => [...curr, next])
    setEditingIndex(patterns.length)
    invalidatePreview()
  }

  const removePattern = (index) => {
    if (patterns.length <= 1) return
    setPatterns((curr) => curr.filter((_, i) => i !== index))
    setEditingIndex((curr) => {
      if (curr === index) return Math.max(0, index - 1)
      if (curr > index) return curr - 1
      return curr
    })
    invalidatePreview()
  }

  const handleCoachChange = (nextCoachId) => {
    setCoachId(nextCoachId)
    setAdditionalCoachIds((prev) => prev.filter((id) => String(id) !== String(nextCoachId || '')))
    invalidatePreview()
  }

  const toggleAdditionalCoach = (id) => {
    const sid = String(id)
    setAdditionalCoachIds((prev) =>
      prev.includes(sid) ? prev.filter((coachId) => coachId !== sid) : [...prev, sid],
    )
    invalidatePreview()
  }

  const runPreview = useCallback(async () => {
    if (!batchId) return
    const gen = previewGenRef.current + 1
    previewGenRef.current = gen
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const result = await scheduleApi.previewRecurringPatterns(batchId, apiBodyBase)
      if (gen !== previewGenRef.current) return
      setPreview(result)
      if (!clientMutationIdRef.current) {
        clientMutationIdRef.current = crypto.randomUUID()
      }
    } catch (e) {
      if (gen !== previewGenRef.current) return
      setPreview(null)
      setPreviewError(friendlyScheduleApiMessage(e) || 'Could not preview schedule.')
    } finally {
      if (gen === previewGenRef.current) setPreviewLoading(false)
    }
  }, [batchId, apiBodyBase])

  useEffect(() => {
    if (!visible || step !== 3) return
    // Preview fetch owns its loading/error state asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kick off preview when entering review
    runPreview()
  }, [visible, step, runPreview])

  const goNext = () => {
    setLocalError(null)
    if (step === 1) {
      const err = validateStep1(patterns, effectiveFrom, effectiveUntil)
      if (err) {
        setLocalError(err)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
    }
  }

  const goBack = () => {
    setLocalError(null)
    setConfirmError(null)
    if (step > 1) setStep((s) => s - 1)
  }

  const handleConfirm = async () => {
    if (confirming || !batchId) return
    const stepErr = validateStep1(patterns, effectiveFrom, effectiveUntil)
    if (stepErr) {
      setLocalError(stepErr)
      setStep(1)
      return
    }
    if (!preview?.previewFingerprint) {
      setConfirmError('Preview the schedule before creating.')
      await runPreview()
      return
    }
    if (!clientMutationIdRef.current) {
      clientMutationIdRef.current = crypto.randomUUID()
    }

    setConfirming(true)
    setConfirmError(null)
    try {
      const apiPatterns = buildApiPatterns(patterns, training)
      const mutationId = clientMutationIdRef.current
      const fingerprint = preview.previewFingerprint

      let result
      if (apiPatterns.length > 1) {
        result = await scheduleApi.bulkCreateRecurringPatterns(batchId, {
          ...apiBodyBase,
          patterns: apiPatterns,
          clientMutationId: mutationId,
          previewFingerprint: fingerprint,
        })
      } else {
        const p = apiPatterns[0]
        result = await scheduleApi.createSchedule({
          batchId,
          daysOfWeek: p.daysOfWeek,
          startTime: p.startTime,
          endTime: p.endTime || undefined,
          slotName: p.name,
          placeId: p.placeId || undefined,
          coachId: p.coachId || undefined,
          additionalCoachIds: p.additionalCoachIds,
          sessionFocus: p.sessionFocus || undefined,
          sessionMode: p.sessionMode || undefined,
          sessionPresetId: p.sessionPresetId,
          phaseOverrides: p.phaseOverrides,
          presetVersion: p.presetVersion,
          effectiveFrom: effectiveFrom || undefined,
          effectiveUntil: effectiveUntil || undefined,
          clientMutationId: mutationId,
          previewFingerprint: fingerprint,
        })
      }
      await onCreated?.(result, { patternCount: apiPatterns.length })
    } catch (e) {
      const msg = friendlyScheduleApiMessage(e) || e?.message || 'Could not create schedule.'
      const code = e?.response?.data?.code || e?.code
      if (code === 'STALE_PREVIEW') {
        setConfirmError('Schedule assumptions changed since preview. Re-preview and try again.')
        clientMutationIdRef.current = crypto.randomUUID()
        setPreview(null)
        await runPreview()
      } else {
        setConfirmError(msg)
      }
    } finally {
      setConfirming(false)
    }
  }

  const active = patterns[editingIndex] || patterns[0]

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} className="onrep-session-drawer">
      <COffcanvasHeader className="border-bottom border-light-subtle">
        <div>
          <COffcanvasTitle>Add recurring session</COffcanvasTitle>
          <div className="small text-body-secondary mt-1">
            {batch?.name
              ? `Weekly pattern for “${stripDemoSuffix(batch.name)}”.`
              : 'Set up one or more weekly patterns.'}
          </div>
        </div>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-4 pb-5">
        <div className="d-flex flex-wrap gap-2" role="list" aria-label="Setup steps">
          {STEPS.map((s) => (
            <span
              key={s.id}
              role="listitem"
              className={[
                'small px-2 py-1 rounded border',
                step === s.id
                  ? 'border-primary text-primary fw-semibold'
                  : step > s.id
                    ? 'border-success text-success'
                    : 'border-light-subtle text-body-secondary',
              ].join(' ')}
            >
              {s.id}. {s.label}
            </span>
          ))}
        </div>

        {localError ? (
          <CAlert color="danger" className="py-2 mb-0">
            {localError}
          </CAlert>
        ) : null}
        {confirmError ? (
          <CAlert color="danger" className="py-2 mb-0">
            {confirmError}
          </CAlert>
        ) : null}

        {step === 1 ? (
          <section className="d-flex flex-column gap-3">
            <div className="onrep-type-label mb-0">Weekly patterns</div>
            <div className="d-flex flex-column gap-2">
              {patterns.map((p, idx) => (
                <div
                  key={p.key}
                  className={[
                    'd-flex align-items-center justify-content-between gap-2 py-2 px-2 rounded border',
                    idx === editingIndex ? 'border-primary' : 'border-light-subtle',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-start p-0 flex-grow-1"
                    onClick={() => setEditingIndex(idx)}
                  >
                    <span className="small text-body">{patternCadenceLabel(p)}</span>
                  </button>
                  {patterns.length > 1 ? (
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      disabled={confirming}
                      onClick={() => removePattern(idx)}
                    >
                      Remove
                    </CButton>
                  ) : null}
                </div>
              ))}
            </div>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              className="align-self-start"
              onClick={addPattern}
            >
              Add another weekly pattern
            </CButton>

            {active ? (
              <>
                <div className="mb-0">
                  <CFormLabel className="small mb-1">Name</CFormLabel>
                  <CFormInput
                    value={active.name}
                    onChange={(e) => updatePatternAt(editingIndex, { name: e.target.value })}
                    placeholder="e.g. Morning training"
                    disabled={confirming}
                  />
                </div>
                <div>
                  <CFormLabel className="small mb-1">Days</CFormLabel>
                  <CRow className="g-1">
                    {UI_DAY_LABELS_ORDERED.map((day) => (
                      <CCol key={day} xs={6} sm={4} md={3} lg={2}>
                        <CFormCheck
                          id={`wizard-day-${active.key}-${day}`}
                          label={day}
                          checked={active.days.includes(day)}
                          onChange={() => toggleDay(day)}
                          disabled={confirming}
                          className="mb-0"
                        />
                      </CCol>
                    ))}
                  </CRow>
                </div>
                <CRow className="g-2">
                  <CCol xs={6}>
                    <CFormLabel className="small mb-1">Start time</CFormLabel>
                    <CFormInput
                      type="time"
                      value={active.startTime}
                      onChange={(e) => updatePatternAt(editingIndex, { startTime: e.target.value })}
                      disabled={confirming}
                    />
                  </CCol>
                  <CCol xs={6}>
                    <CFormLabel className="small mb-1">
                      End time <span className="fw-normal text-body-secondary">(optional)</span>
                    </CFormLabel>
                    <CFormInput
                      type="time"
                      value={active.endTime}
                      onChange={(e) => updatePatternAt(editingIndex, { endTime: e.target.value })}
                      disabled={confirming}
                    />
                  </CCol>
                </CRow>
              </>
            ) : null}

            <div className="onrep-type-label mt-2 mb-0">Effective range</div>
            <CRow className="g-2">
              <CCol xs={6}>
                <CFormLabel className="small mb-1">Starts on</CFormLabel>
                <CFormInput
                  type="date"
                  value={effectiveFrom}
                  min={todayIsoLocal()}
                  onChange={(e) => {
                    setEffectiveFrom(e.target.value)
                    invalidatePreview()
                  }}
                  disabled={confirming}
                />
              </CCol>
              <CCol xs={6}>
                <CFormLabel className="small mb-1">
                  Ends on <span className="fw-normal text-body-secondary">(optional)</span>
                </CFormLabel>
                <CFormInput
                  type="date"
                  value={effectiveUntil}
                  min={effectiveFrom || todayIsoLocal()}
                  onChange={(e) => {
                    setEffectiveUntil(e.target.value)
                    invalidatePreview()
                  }}
                  disabled={confirming}
                />
              </CCol>
            </CRow>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="onrep-type-label mb-2">Training setup</div>
            <div className="mb-3">
              <CFormLabel className="small mb-1">
                Place <span className="fw-normal text-body-secondary">(optional)</span>
              </CFormLabel>
              <PlaceSelect
                places={places}
                value={placeId}
                onChange={(v) => {
                  setPlaceId(v)
                  invalidatePreview()
                }}
                disabled={confirming}
                loading={placesLoading}
                onQuickAddPlace={onQuickAddPlace}
                quickAddSaving={quickAddSaving}
                quickAddError={quickAddError}
              />
            </div>
            <div className="mb-3">
              <CFormLabel className="small mb-1">
                Coach <span className="fw-normal text-body-secondary">(optional)</span>
              </CFormLabel>
              <CFormSelect
                value={coachId}
                onChange={(e) => handleCoachChange(e.target.value)}
                disabled={confirming}
              >
                <option value="">Default (batch lead)</option>
                {coachOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || 'Coach'}
                  </option>
                ))}
              </CFormSelect>
            </div>
            {additionalCoachOptions.length > 0 ? (
              <div className="mb-3">
                <CFormLabel className="small mb-1">
                  Additional coaches{' '}
                  <span className="fw-normal text-body-secondary">(optional)</span>
                </CFormLabel>
                <div className="d-flex flex-column gap-1">
                  {additionalCoachOptions.map((coach) => (
                    <CFormCheck
                      key={coach.id}
                      id={`wizard-additional-coach-${coach.id}`}
                      label={coach.name || 'Coach'}
                      checked={additionalCoachIds.includes(String(coach.id))}
                      onChange={() => toggleAdditionalCoach(coach.id)}
                      disabled={confirming}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mb-3">
              <CFormLabel className="small mb-1">Session mode</CFormLabel>
              <CFormSelect
                value={sessionMode}
                onChange={(e) => {
                  setSessionMode(e.target.value)
                  invalidatePreview()
                }}
                disabled={confirming}
              >
                {SESSION_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </CFormSelect>
            </div>
            {visible ? (
              <SessionPresetSetup
                initialPresetId={DEFAULT_SESSION_PRESET_ID}
                initialPhaseOverrides={[]}
                onChange={(payload) => {
                  handlePresetPayload(payload)
                  invalidatePreview()
                }}
                disabled={confirming}
              />
            ) : null}
            <div className="mt-3">
              <CFormLabel className="small mb-1">
                Focus <span className="fw-normal text-body-secondary">(optional)</span>
              </CFormLabel>
              <CFormInput
                list="wizard-focus-suggestions"
                value={sessionFocus}
                onChange={(e) => {
                  setSessionFocus(e.target.value)
                  invalidatePreview()
                }}
                placeholder="e.g. Conditioning"
                disabled={confirming}
              />
              <datalist id="wizard-focus-suggestions">
                {FOCUS_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="d-flex flex-column gap-3">
            <div className="onrep-type-label mb-0">Review</div>
            <div className="small">
              {patterns.map((p) => (
                <div key={p.key} className="mb-1">
                  {patternCadenceLabel(p)}
                </div>
              ))}
              {effectiveFrom ? (
                <div className="text-body-secondary mt-2">
                  Effective from {effectiveFrom}
                  {effectiveUntil ? ` to ${effectiveUntil}` : ' (open-ended)'}
                </div>
              ) : null}
            </div>

            {previewLoading ? (
              <div className="d-flex align-items-center gap-2 text-body-secondary small">
                <CSpinner size="sm" /> Previewing occurrences…
              </div>
            ) : null}
            {previewError ? (
              <CAlert color="warning" className="py-2 mb-0">
                {previewError}{' '}
                <CButton color="warning" variant="outline" size="sm" onClick={runPreview}>
                  Retry preview
                </CButton>
              </CAlert>
            ) : null}
            {preview && !previewLoading ? (
              <div className="border border-light-subtle rounded p-3 small">
                <div>
                  <strong>{preview.occurrenceCount ?? 0}</strong> session
                  {(preview.occurrenceCount ?? 0) === 1 ? '' : 's'} in the preview window
                </div>
                {preview.firstOccurrence?.date ? (
                  <div className="text-body-secondary mt-1">
                    First: {preview.firstOccurrence.date}
                    {preview.firstOccurrence.startTime
                      ? ` · ${formatSessionClock(preview.firstOccurrence.startTime)}`
                      : ''}
                  </div>
                ) : null}
                {preview.lastOccurrence?.date ? (
                  <div className="text-body-secondary">
                    Last: {preview.lastOccurrence.date}
                    {preview.lastOccurrence.startTime
                      ? ` · ${formatSessionClock(preview.lastOccurrence.startTime)}`
                      : ''}
                  </div>
                ) : null}
                {Array.isArray(preview.warnings) && preview.warnings.length > 0 ? (
                  <CAlert color="warning" className="py-2 mt-2 mb-0">
                    {preview.warnings.map((w) => (
                      <div key={String(w)}>{w}</div>
                    ))}
                  </CAlert>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-auto d-grid gap-2 pt-3 border-top border-light-subtle">
          {step < 3 ? (
            <CButton color="primary" disabled={confirming} onClick={goNext}>
              Continue
            </CButton>
          ) : (
            <CButton
              color="primary"
              disabled={confirming || previewLoading || !preview?.previewFingerprint}
              onClick={handleConfirm}
            >
              {confirming ? (
                <>
                  <CSpinner size="sm" className="me-2" /> Creating…
                </>
              ) : confirmError ? (
                'Retry'
              ) : (
                'Confirm'
              )}
            </CButton>
          )}
          {step > 1 ? (
            <CButton color="secondary" variant="outline" disabled={confirming} onClick={goBack}>
              Back
            </CButton>
          ) : (
            <CButton color="secondary" variant="outline" disabled={confirming} onClick={onClose}>
              Cancel
            </CButton>
          )}
        </div>
      </COffcanvasBody>
    </COffcanvas>
  )
}
