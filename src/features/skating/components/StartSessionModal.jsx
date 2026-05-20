import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCollapse,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
} from '@coreui/react'
import { batchesApi } from '../../batches/api/batchesApi'
import { listStaffCoaches } from '../../directory/api/directoryApi'
import { academySubActivitiesApi } from '../../../api/academySubActivitiesApi'
import { skatingOpsApi } from '../api/skatingOpsApi'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

const SK_LAST_PLACE = 'onrep.skating.lastPlaceId'
const SK_LAST_RINK = 'onrep.skating.lastRinkOrRoad'

const SESSION_TYPE_CHIPS = ['Technique', 'Endurance', 'Speed', 'Recovery', 'Mixed']

const SESSION_PRESET_OPTIONS = [
  { id: '', label: 'Standard practice' },
  { id: 'beginner_skating', label: 'Beginner skating' },
  { id: 'advanced_edge_work', label: 'Advanced edge work' },
  { id: 'race_prep', label: 'Race prep' },
  { id: 'conditioning', label: 'Conditioning' },
]

/* eslint-disable react-hooks/set-state-in-effect -- reset modal fields when opened; hydrate from selected batch */

/**
 * Primary: batch|quick, place, optional athletes, Start.
 * Advanced: coach, focus, session type chips, segmentation note only (lanes created on ice).
 */
export default function StartSessionModal({
  visible,
  onClose,
  dateYmd,
  places,
  skaters,
  defaultPlaceId,
  defaultRink,
  currentUserId,
  onSessionStarted,
}) {
  const [startMode, setStartMode] = useState('quick')
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [batchId, setBatchId] = useState('')
  const [placeId, setPlaceId] = useState(defaultPlaceId || '')
  const [rink, setRink] = useState(defaultRink || 'Rink')
  const [skaterIds, setSkaterIds] = useState(() => new Set())
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [coachUserId, setCoachUserId] = useState('')
  const [sessionFocus, setSessionFocus] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [sessionPresetId, setSessionPresetId] = useState('')
  const [academySubActivities, setAcademySubActivities] = useState([])
  const [academySubActivityId, setAcademySubActivityId] = useState('')
  const [surfaceType, setSurfaceType] = useState('')
  const [subActivitiesLoading, setSubActivitiesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible) return
    setError('')
    setPlaceId(defaultPlaceId || '')
    setRink(defaultRink || 'Rink')
    setSkaterIds(new Set())
    setAdvancedOpen(false)
    setCoachUserId(currentUserId ? String(currentUserId) : '')
    setSessionFocus('')
    setSessionType('')
    setSessionPresetId('')
    setAcademySubActivityId('')
    setSurfaceType('')
  }, [visible, defaultPlaceId, defaultRink, currentUserId])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      setSubActivitiesLoading(true)
      try {
        let list = await academySubActivitiesApi.list({ activeOnly: true })
        if (!list?.length) {
          try {
            await academySubActivitiesApi.ensureGeneral()
          } catch {
            /* ignore */
          }
          list = await academySubActivitiesApi.list({ activeOnly: true })
        }
        if (!cancelled) {
          setAcademySubActivities(Array.isArray(list) ? list : [])
          if (list?.length === 1) setAcademySubActivityId(String(list[0].id))
        }
      } catch {
        if (!cancelled) setAcademySubActivities([])
      } finally {
        if (!cancelled) setSubActivitiesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible])

  const selectedSubActivity = useMemo(
    () => academySubActivities.find((s) => String(s.id) === String(academySubActivityId)),
    [academySubActivities, academySubActivityId],
  )

  const surfaceOptions = useMemo(() => {
    const profiles = selectedSubActivity?.surfaceProfiles || []
    return Array.isArray(profiles) ? profiles : []
  }, [selectedSubActivity])

  useEffect(() => {
    if (surfaceOptions.length === 1) {
      setSurfaceType(surfaceOptions[0].type)
    } else if (!surfaceOptions.some((p) => p.type === surfaceType)) {
      setSurfaceType('')
    }
  }, [surfaceOptions, surfaceType])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      setBatchesLoading(true)
      try {
        const { batches: list } = await batchesApi.listBatches({})
        if (!cancelled) setBatches(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setBatches([])
      } finally {
        if (!cancelled) setBatchesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await listStaffCoaches()
        if (!cancelled) setCoaches(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setCoaches([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible])

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b.id) === String(batchId)),
    [batches, batchId],
  )

  useEffect(() => {
    if (startMode !== 'batch' || !selectedBatch) return
    const pid = selectedBatch.defaultPlaceId || selectedBatch.default_place_id
    if (pid) setPlaceId(String(pid))
    const ids = selectedBatch.activeStudentIds?.length
      ? selectedBatch.activeStudentIds
      : selectedBatch.studentIds || []
    setSkaterIds(new Set((ids || []).map(String)))
    const lead = selectedBatch.leadCoachUserId || selectedBatch.lead_coach_user_id
    if (lead) setCoachUserId(String(lead))
  }, [startMode, selectedBatch])

  const toggleSkater = useCallback((id, checked) => {
    setSkaterIds((prev) => {
      const next = new Set(prev)
      const s = String(id)
      if (checked) next.add(s)
      else next.delete(s)
      return next
    })
  }, [])

  const handleStart = async () => {
    setError('')
    if (!dateYmd) {
      setError('Pick a day on the Skating ops page first.')
      return
    }
    if (startMode === 'batch' && !batchId) {
      setError('Select a batch for a scheduled session, or switch to Quick session.')
      return
    }
    const place = places.find((p) => String(p.id) === String(placeId))
    if (!placeId) {
      setError('Choose a place.')
      return
    }
    if (!academySubActivityId) {
      setError('Choose an academy sub-activity (specialization).')
      return
    }
    if (surfaceOptions.length > 1 && !surfaceType) {
      setError('Choose a surface for this sub-activity.')
      return
    }
    setSubmitting(true)
    try {
      const sessionSkaterIds = Array.from(skaterIds)
      const surfaceProfile =
        surfaceOptions.length > 0
          ? surfaceOptions.find((p) => p.type === surfaceType) || surfaceOptions[0]
          : undefined
      const row = await skatingOpsApi.createSession({
        date: dateYmd,
        placeId: placeId || undefined,
        placeName: place?.name || undefined,
        rinkOrRoad: rink,
        sessionSkaterIds,
        academySubActivityId,
        surfaceProfile,
        batchId: startMode === 'batch' && batchId ? batchId : undefined,
        notes: startMode === 'batch' && selectedBatch ? `batch:${selectedBatch.id}` : undefined,
        createdBy: coachUserId || undefined,
      })
      const sid = row?.id
      if (!sid) throw new Error('Session was not created.')
      try {
        if (placeId) sessionStorage.setItem(SK_LAST_PLACE, String(placeId))
        sessionStorage.setItem(SK_LAST_RINK, rink || 'Rink')
      } catch {
        /* ignore */
      }

      const objectivesJson = []
      if (sessionType) objectivesJson.push({ kind: 'session_type', label: sessionType })
      if (startMode === 'batch' && batchId)
        objectivesJson.push({ kind: 'batch_ref', batchId: String(batchId) })
      if (sessionPresetId)
        objectivesJson.push({ kind: 'session_preset', id: sessionPresetId })

      const patch = {}
      if (sessionFocus.trim()) patch.sessionFocus = sessionFocus.trim()
      if (objectivesJson.length) patch.objectivesJson = objectivesJson

      if (Object.keys(patch).length) {
        try {
          await skatingOpsApi.patchSession(sid, patch)
        } catch (pe) {
          setError(
            pe?.message || 'Session started but extra details did not save — you can edit later.',
          )
        }
      }
      onSessionStarted(sid)
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not start session.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg">
      <CModalHeader>{SESSION_OPS_COPY.startModalTitle}</CModalHeader>
      <CModalBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        <div className="mb-3">
          <CButtonGroup role="group" aria-label="Start mode">
            <CButton
              color={startMode === 'batch' ? 'primary' : 'light'}
              variant={startMode === 'batch' ? undefined : 'outline'}
              onClick={() => {
                setStartMode('batch')
                setBatchId('')
              }}
            >
              {SESSION_OPS_COPY.startModeScheduled}
            </CButton>
            <CButton
              color={startMode === 'quick' ? 'primary' : 'light'}
              variant={startMode === 'quick' ? undefined : 'outline'}
              onClick={() => {
                setStartMode('quick')
                setBatchId('')
                setSkaterIds(new Set())
              }}
            >
              {SESSION_OPS_COPY.startModeQuick}
            </CButton>
          </CButtonGroup>
        </div>

        {startMode === 'batch' ? (
          <div className="mb-3">
            <CFormLabel>{SESSION_OPS_COPY.startBatchLabel}</CFormLabel>
            {batchesLoading ? (
              <CSpinner size="sm" />
            ) : (
              <CFormSelect
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mb-2"
              >
                <option value="">— Select batch —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {(b.name || 'Batch').slice(0, 64)}
                  </option>
                ))}
              </CFormSelect>
            )}
          </div>
        ) : null}

        <CFormLabel>Academy sub-activity</CFormLabel>
        {subActivitiesLoading ? (
          <CSpinner size="sm" className="mb-2" />
        ) : (
          <CFormSelect
            value={academySubActivityId}
            onChange={(e) => setAcademySubActivityId(e.target.value)}
            className="mb-2"
          >
            <option value="">— Select specialization —</option>
            {academySubActivities.map((sa) => (
              <option key={sa.id} value={sa.id}>
                {(sa.name || 'Sub-activity').slice(0, 64)}
              </option>
            ))}
          </CFormSelect>
        )}

        {surfaceOptions.length > 1 ? (
          <>
            <CFormLabel className="mt-2">Surface</CFormLabel>
            <CFormSelect
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
              className="mb-2"
            >
              <option value="">— Select surface —</option>
              {surfaceOptions.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.type}
                  {p.lap_distance_m ? ` (${p.lap_distance_m}m lap)` : ''}
                </option>
              ))}
            </CFormSelect>
          </>
        ) : null}

        <CFormLabel>{SESSION_OPS_COPY.startPrimaryPlace}</CFormLabel>
        <CFormSelect value={placeId} onChange={(e) => setPlaceId(e.target.value)} className="mb-2">
          <option value="">—</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </CFormSelect>
        <CFormLabel className="mt-2">Rink / road</CFormLabel>
        <CFormSelect value={rink} onChange={(e) => setRink(e.target.value)} className="mb-2">
          <option>Rink</option>
          <option>Road</option>
        </CFormSelect>

        <CFormLabel className="mt-2">Session plan</CFormLabel>
        <CFormSelect
          value={sessionPresetId}
          onChange={(e) => setSessionPresetId(e.target.value)}
          className="mb-2"
        >
          {SESSION_PRESET_OPTIONS.map((o) => (
            <option key={o.id || 'default'} value={o.id}>
              {o.label}
            </option>
          ))}
        </CFormSelect>

        <div className="fw-semibold mb-1">{SESSION_OPS_COPY.startAthletesOptional}</div>
        <p className="small text-body-secondary">{SESSION_OPS_COPY.startAthletesHint}</p>
        <div
          className="d-flex flex-column gap-1 border rounded p-2 mb-3"
          style={{ maxHeight: 200, overflow: 'auto' }}
        >
          {skaters.map((s) => (
            <CFormCheck
              key={s.id}
              id={`start-sk-${s.id}`}
              label={s.full_name}
              checked={skaterIds.has(String(s.id))}
              onChange={(e) => toggleSkater(s.id, e.target.checked)}
            />
          ))}
        </div>

        <CButton
          color="link"
          size="sm"
          className="px-0 mb-2"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          {SESSION_OPS_COPY.startAdvancedToggle}
        </CButton>
        <CCollapse visible={advancedOpen}>
          <div className="border rounded p-3 bg-body-tertiary mb-2">
            <CFormLabel>{SESSION_OPS_COPY.startCoachLabel}</CFormLabel>
            <CFormSelect
              value={coachUserId}
              onChange={(e) => setCoachUserId(e.target.value)}
              className="mb-2"
            >
              <option value="">— Default (me) —</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </CFormSelect>
            <CFormLabel>{SESSION_OPS_COPY.startFocusLabel}</CFormLabel>
            <CFormInput
              className="mb-2"
              value={sessionFocus}
              onChange={(e) => setSessionFocus(e.target.value)}
              placeholder="e.g. Corners and crossovers"
            />
            <CFormLabel>{SESSION_OPS_COPY.startTypeLabel}</CFormLabel>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {SESSION_TYPE_CHIPS.map((t) => (
                <CButton
                  key={t}
                  type="button"
                  size="sm"
                  color={sessionType === t ? 'primary' : 'light'}
                  variant="outline"
                  onClick={() => setSessionType((cur) => (cur === t ? '' : t))}
                >
                  {t}
                </CButton>
              ))}
            </div>
            <div className="small text-body-secondary">
              {SESSION_OPS_COPY.startSegmentationHint}
            </div>
          </div>
        </CCollapse>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          {SESSION_OPS_COPY.cancel}
        </CButton>
        <CButton color="primary" onClick={() => void handleStart()} disabled={submitting}>
          {submitting ? <CSpinner size="sm" /> : SESSION_OPS_COPY.startPrimaryCta}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
