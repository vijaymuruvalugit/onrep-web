import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
} from '@coreui/react'
import { apiDaysToUiLabels, uiDayLabelsToApi, UI_DAY_LABELS_ORDERED } from '../utils/daysOfWeek'
import { RECURRING_PATTERN_EDIT_MODE } from '@onrep/contracts/recurring-patterns'
import PlaceSelect from '../../places/components/PlaceSelect'
import { SESSION_MODE_OPTIONS } from '../../../domain/operationalSessions/constants/sessionModes'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { todayIsoLocal } from '../../batches/utils/batchWorkspaceOperations'
import SessionPresetSetup from './SessionPresetSetup'
import { DEFAULT_SESSION_PRESET_ID } from '../constants/sessionPresets'

const FOCUS_SUGGESTIONS = [
  'Technical',
  'Conditioning',
  'Endurance',
  'Dryland',
  'Sport',
  'Strength',
  'Recovery',
]

function nextMondayYmd() {
  const now = new Date()
  const day = now.getDay() // 0=Sun..6=Sat
  const daysUntilMon = (1 - day + 7) % 7 || 7
  now.setDate(now.getDate() + daysUntilMon)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function tomorrowYmd() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const EMPTY_PATTERN = Object.freeze({
  id: null,
  name: '',
  daysOfWeek: [],
  startTime: '17:30',
  endTime: '19:00',
  placeId: '',
  coachId: '',
  sessionFocus: '',
  sessionMode: 'practice',
})

const EMPTY_PHASE_OVERRIDES = Object.freeze([])

/**
 * Create/edit drawer for a recurring session pattern.
 *
 * Modes:
 *   - `create`: POST a new pattern row to the batch.
 *   - `edit`:   PATCH an existing pattern with audit-safe end-and-replace.
 *               Two operational choices are presented in the UI (see the
 *               radio group below); both call PATCH with mode=update_upcoming
 *               or mode=new_from. Backend never destructively mutates rows.
 */
export default function PatternEditorDrawer({
  visible,
  mode, // 'create' | 'edit'
  pattern, // current row when editing
  batch,
  places = [],
  placesLoading = false,
  coaches = [],
  onClose,
  onSubmit, // ({ payload, editMode, effectiveFrom }) => Promise<void>
  onEnsurePlaces,
  saving,
  mutationError,
}) {
  const isEdit = mode === 'edit'
  const seed = useMemo(() => {
    if (isEdit && pattern) {
      return {
        id: pattern.id,
        name: pattern.name || pattern.slotName || '',
        daysOfWeek: Array.isArray(pattern.daysOfWeek) ? pattern.daysOfWeek : [],
        startTime: pattern.startTime || '17:30',
        endTime: pattern.endTime || '',
        placeId: pattern.placeId || '',
        coachId: pattern.coachId || '',
        sessionFocus: pattern.sessionFocus || '',
        sessionMode: pattern.sessionMode || 'practice',
        sessionPresetId: pattern.sessionPresetId || DEFAULT_SESSION_PRESET_ID,
        phaseOverrides:
          Array.isArray(pattern.phaseOverrides) && pattern.phaseOverrides.length > 0
            ? pattern.phaseOverrides
            : EMPTY_PHASE_OVERRIDES,
      }
    }
    return {
      ...EMPTY_PATTERN,
      sessionPresetId: DEFAULT_SESSION_PRESET_ID,
      phaseOverrides: EMPTY_PHASE_OVERRIDES,
    }
  }, [isEdit, pattern])

  const [name, setName] = useState(seed.name)
  const [days, setDays] = useState(() => apiDaysToUiLabels(seed.daysOfWeek))
  const [startTime, setStartTime] = useState(seed.startTime)
  const [endTime, setEndTime] = useState(seed.endTime || '')
  const [placeId, setPlaceId] = useState(seed.placeId || '')
  const [coachId, setCoachId] = useState(seed.coachId || '')
  const [sessionFocus, setSessionFocus] = useState(seed.sessionFocus || '')
  const [sessionMode, setSessionMode] = useState(seed.sessionMode || 'practice')
  const [presetPayload, setPresetPayload] = useState(null)
  const handlePresetPayload = useCallback((payload) => setPresetPayload(payload), [])
  const [editMode, setEditMode] = useState(RECURRING_PATTERN_EDIT_MODE.UPDATE_UPCOMING)
  const [effectiveFromDate, setEffectiveFromDate] = useState(() => nextMondayYmd())
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (!visible) return
    onEnsurePlaces?.()
  }, [visible, onEnsurePlaces])

  useEffect(() => {
    if (!visible) return
    /* eslint-disable react-hooks/set-state-in-effect -- reset form fields when drawer opens with a new seed (create vs edit) */
    setName(seed.name)
    setDays(apiDaysToUiLabels(seed.daysOfWeek))
    setStartTime(seed.startTime)
    setEndTime(seed.endTime || '')
    setPlaceId(seed.placeId || '')
    setCoachId(seed.coachId || '')
    setSessionFocus(seed.sessionFocus || '')
    setSessionMode(seed.sessionMode || 'practice')
    setPresetPayload(null)
    setEditMode(RECURRING_PATTERN_EDIT_MODE.UPDATE_UPCOMING)
    setEffectiveFromDate(nextMondayYmd())
    setLocalError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, seed])

  const toggleDay = (day) => {
    setDays((curr) => (curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day]))
  }

  const validate = () => {
    if (!name.trim()) return 'Give this schedule a short name (e.g. "Morning training").'
    if (!days.length) return 'Pick at least one day of the week.'
    if (!startTime) return 'Start time is required.'
    if (endTime && endTime <= startTime) return 'End time must be after start time.'
    if (
      isEdit &&
      editMode === RECURRING_PATTERN_EDIT_MODE.NEW_FROM &&
      (!effectiveFromDate || effectiveFromDate <= todayIsoLocal())
    ) {
      return 'Pick a future date for the new schedule.'
    }
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      setLocalError(err)
      return
    }
    setLocalError(null)
    const daysOfWeek = uiDayLabelsToApi(days)
    const basePayload = {
      name: name.trim(),
      daysOfWeek,
      startTime,
      endTime: endTime || null,
      placeId: placeId || null,
      coachId: coachId || null,
      sessionFocus: sessionFocus.trim() || null,
      sessionMode,
      ...(presetPayload
        ? {
            sessionPresetId: presetPayload.sessionPresetId,
            phaseOverrides: presetPayload.phaseOverrides,
            presetVersion: presetPayload.presetVersion,
          }
        : {
            sessionPresetId: seed.sessionPresetId || DEFAULT_SESSION_PRESET_ID,
            phaseOverrides: seed.phaseOverrides,
          }),
    }
    await onSubmit({
      payload: basePayload,
      editMode,
      effectiveFrom: isEdit
        ? editMode === RECURRING_PATTERN_EDIT_MODE.NEW_FROM
          ? effectiveFromDate
          : tomorrowYmd()
        : undefined,
    })
  }

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} className="onrep-session-drawer">
      <COffcanvasHeader className="border-bottom border-light-subtle">
        <div>
          <COffcanvasTitle>
            {isEdit ? 'Edit recurring session' : 'Add recurring session'}
          </COffcanvasTitle>
          <div className="small text-body-secondary mt-1">
            {isEdit
              ? 'Choose how the change should apply. The old schedule is preserved for past sessions.'
              : `A new recurring pattern for ${batch?.name ? `“${stripDemoSuffix(batch.name)}”` : 'this batch'}.`}
          </div>
        </div>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-4 pb-5">
        {localError ? (
          <CAlert color="danger" className="py-2 mb-0">
            {localError}
          </CAlert>
        ) : null}
        {mutationError ? (
          <CAlert color="danger" className="py-2 mb-0">
            {mutationError.message || 'Could not save schedule.'}
          </CAlert>
        ) : null}

        <section>
          <div className="onrep-type-label mb-2">Basics</div>
          <div className="mb-3">
            <CFormLabel className="small mb-1">Name</CFormLabel>
            <CFormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning training"
            />
          </div>
          <div className="mb-2">
            <CFormLabel className="small mb-1">Days</CFormLabel>
            <CRow className="g-1">
              {UI_DAY_LABELS_ORDERED.map((day) => (
                <CCol key={day} xs={6} sm={4} md={3} lg={2}>
                  <CFormCheck
                    id={`pattern-day-${day}`}
                    label={day}
                    checked={days.includes(day)}
                    onChange={() => toggleDay(day)}
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
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </CCol>
            <CCol xs={6}>
              <CFormLabel className="small mb-1">
                End time <span className="fw-normal text-body-secondary">(optional)</span>
              </CFormLabel>
              <CFormInput
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </CCol>
          </CRow>
        </section>

        <section>
          <div className="onrep-type-label mb-2">Operations</div>
          <div className="mb-3">
            <CFormLabel className="small mb-1">
              Place <span className="fw-normal text-body-secondary">(optional)</span>
            </CFormLabel>
            <PlaceSelect
              places={places}
              value={placeId}
              onChange={setPlaceId}
              disabled={saving}
              loading={placesLoading}
            />
          </div>
          <div className="mb-3">
            <CFormLabel className="small mb-1">
              Coach <span className="fw-normal text-body-secondary">(optional)</span>
            </CFormLabel>
            <CFormSelect
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              disabled={saving}
            >
              <option value="">Default (batch lead)</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Coach'}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small mb-1">Session mode</CFormLabel>
            <CFormSelect
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value)}
              disabled={saving}
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
              initialPresetId={seed.sessionPresetId || DEFAULT_SESSION_PRESET_ID}
              initialPhaseOverrides={seed.phaseOverrides}
              onChange={handlePresetPayload}
              disabled={saving}
            />
          ) : null}
          <div>
            <CFormLabel className="small mb-1">
              Focus <span className="fw-normal text-body-secondary">(optional)</span>
            </CFormLabel>
            <CFormInput
              list="pattern-focus-suggestions"
              value={sessionFocus}
              onChange={(e) => setSessionFocus(e.target.value)}
              placeholder="e.g. Conditioning"
            />
            <datalist id="pattern-focus-suggestions">
              {FOCUS_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </section>

        {isEdit ? (
          <section>
            <div className="onrep-type-label mb-2">When should this change start?</div>
            <CFormCheck
              type="radio"
              name="pattern-edit-mode"
              id="pattern-edit-mode-update"
              label={
                <span>
                  <strong>Update upcoming sessions</strong>
                  <span className="d-block small text-body-secondary">
                    Applies from tomorrow. Past sessions stay on the old schedule.
                  </span>
                </span>
              }
              checked={editMode === RECURRING_PATTERN_EDIT_MODE.UPDATE_UPCOMING}
              onChange={() => setEditMode(RECURRING_PATTERN_EDIT_MODE.UPDATE_UPCOMING)}
              className="mb-2"
            />
            <CFormCheck
              type="radio"
              name="pattern-edit-mode"
              id="pattern-edit-mode-new-from"
              label={
                <span>
                  <strong>Create a new schedule starting from…</strong>
                  <span className="d-block small text-body-secondary">
                    Old schedule keeps running until the day before.
                  </span>
                </span>
              }
              checked={editMode === RECURRING_PATTERN_EDIT_MODE.NEW_FROM}
              onChange={() => setEditMode(RECURRING_PATTERN_EDIT_MODE.NEW_FROM)}
              className="mb-2"
            />
            {editMode === RECURRING_PATTERN_EDIT_MODE.NEW_FROM ? (
              <div className="ms-4 mt-2">
                <CFormLabel className="small mb-1">Starts on</CFormLabel>
                <CFormInput
                  type="date"
                  value={effectiveFromDate}
                  min={tomorrowYmd()}
                  onChange={(e) => setEffectiveFromDate(e.target.value)}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-auto d-grid gap-2 pt-3 border-top border-light-subtle">
          <CButton color="primary" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add recurring session'}
          </CButton>
          <CButton color="secondary" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </CButton>
        </div>
      </COffcanvasBody>
    </COffcanvas>
  )
}
