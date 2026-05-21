import React, { useEffect, useMemo, useState } from 'react'
import { CBadge, CButton, CCollapse, CFormLabel, CFormSelect } from '@coreui/react'
import SessionPresetPhasePreview from './SessionPresetPhasePreview'
import {
  buildSessionPresetPayload,
  DEFAULT_SESSION_PRESET_ID,
  getSessionPresetById,
  isPresetCustomized,
  presetDisplayLabel,
  previewPhasesFromOverrides,
  previewPhasesFromPreset,
  SESSION_PRESETS_CATALOG,
} from '../constants/sessionPresets'

/** Stable default — never use `= []` in props (new reference every render). */
const EMPTY_PHASE_OVERRIDES = Object.freeze([])

function overridesDependencyKey(overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) return ''
  return JSON.stringify(overrides)
}

/**
 * Shared preset selector + tiny phase preview for schedule drawers.
 * @param {{
 *   initialPresetId?: string,
 *   initialPhaseOverrides?: unknown[],
 *   onChange?: (payload: { sessionPresetId: string, phaseOverrides: unknown[], presetVersion: number, isCustomized: boolean }) => void,
 *   disabled?: boolean,
 *   compact?: boolean,
 *   collapsible?: boolean,
 * }} props
 */
export default function SessionPresetSetup({
  initialPresetId = DEFAULT_SESSION_PRESET_ID,
  initialPhaseOverrides,
  onChange,
  disabled = false,
  compact = false,
  collapsible = false,
}) {
  const resolvedPresetId = initialPresetId || DEFAULT_SESSION_PRESET_ID
  const resolvedOverrides = initialPhaseOverrides ?? EMPTY_PHASE_OVERRIDES
  const overridesKey = overridesDependencyKey(resolvedOverrides)

  const [sessionPresetId, setSessionPresetId] = useState(resolvedPresetId)
  const [previewPhases, setPreviewPhases] = useState(() =>
    previewPhasesFromOverrides(resolvedOverrides, resolvedPresetId),
  )
  const [adjustOpen, setAdjustOpen] = useState(false)

  useEffect(() => {
    setSessionPresetId(resolvedPresetId)
    setPreviewPhases(previewPhasesFromOverrides(resolvedOverrides, resolvedPresetId))
    setAdjustOpen(false)
  }, [resolvedPresetId, overridesKey])

  const customized = useMemo(
    () => isPresetCustomized(sessionPresetId, previewPhases),
    [sessionPresetId, previewPhases],
  )

  const summaryLabel = useMemo(
    () => presetDisplayLabel(sessionPresetId, customized),
    [sessionPresetId, customized],
  )

  useEffect(() => {
    onChange?.(buildSessionPresetPayload(sessionPresetId, previewPhases))
  }, [sessionPresetId, previewPhases, onChange])

  const handlePresetChange = (nextId) => {
    setSessionPresetId(nextId)
    setPreviewPhases(previewPhasesFromPreset(getSessionPresetById(nextId).phases))
  }

  const selected = getSessionPresetById(sessionPresetId)

  return (
    <div className={compact ? 'mb-2' : 'mb-3'}>
      <CFormLabel className="small mb-1">Session preset</CFormLabel>
      <CFormSelect
        value={sessionPresetId}
        disabled={disabled}
        size={compact ? 'sm' : undefined}
        onChange={(e) => handlePresetChange(e.target.value)}
      >
        {SESSION_PRESETS_CATALOG.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </CFormSelect>
      {selected?.description ? (
        <p className={`text-body-secondary mb-2 ${compact ? 'small mb-1' : 'small'}`}>
          {selected.description}
          {customized ? (
            <CBadge color="secondary" className="ms-2" shape="rounded-pill">
              Customized
            </CBadge>
          ) : null}
        </p>
      ) : null}
      {collapsible ? (
        <>
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <span className="small text-body-secondary">{summaryLabel}</span>
            <CButton
              color="link"
              size="sm"
              className="p-0 text-decoration-none"
              disabled={disabled}
              onClick={() => setAdjustOpen((v) => !v)}
            >
              {adjustOpen ? 'Hide phases' : 'Adjust phases'}
            </CButton>
          </div>
          <CCollapse visible={adjustOpen}>
            <SessionPresetPhasePreview
              phases={previewPhases}
              onPhasesChange={setPreviewPhases}
              disabled={disabled}
              compact={false}
            />
          </CCollapse>
        </>
      ) : (
        <SessionPresetPhasePreview
          phases={previewPhases}
          onPhasesChange={setPreviewPhases}
          disabled={disabled}
          compact={compact}
        />
      )}
    </div>
  )
}
