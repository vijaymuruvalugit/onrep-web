import React, { useState } from 'react'
import { CButton, CCollapse, CFormInput, CFormSelect } from '@coreui/react'
import { PHASE_TYPE_CATALOG } from '../../skating/utils/sessionPhaseOptions'
import { maxExercisesForPhase } from '../../skating/utils/phaseInteractionMode'
import { defaultExercisesForBlockType } from '../constants/sessionPresets'

/**
 * Tiny phase list for schedule drawer confirmation (not a planning canvas).
 */
export default function SessionPresetPhasePreview({
  phases = [],
  onPhasesChange,
  disabled = false,
  compact = false,
}) {
  const [addType, setAddType] = useState('technical')
  const [customTitle, setCustomTitle] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [activitiesOpenKey, setActivitiesOpenKey] = useState(null)

  const updatePhase = (index, patch) => {
    onPhasesChange?.(phases.map((ph, i) => (i === index ? { ...ph, ...patch } : ph)))
  }

  const updateExercise = (phaseIndex, exerciseIndex, patch) => {
    const phase = phases[phaseIndex]
    const exercises = [...(phase?.exercises || [])]
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...patch }
    updatePhase(phaseIndex, { exercises })
  }

  const addExercise = (phaseIndex) => {
    const phase = phases[phaseIndex]
    const max = maxExercisesForPhase(phase)
    const exercises = [...(phase?.exercises || [])]
    if (!max || exercises.length >= max) return
    updatePhase(phaseIndex, {
      exercises: [...exercises, { sequence: exercises.length + 1, exerciseName: '', description: '' }],
    })
  }

  const removeExercise = (phaseIndex, exerciseIndex) => {
    const phase = phases[phaseIndex]
    updatePhase(phaseIndex, {
      exercises: (phase?.exercises || [])
        .filter((_, i) => i !== exerciseIndex)
        .map((ex, i) => ({ ...ex, sequence: i + 1 })),
    })
  }

  const move = (index, dir) => {
    const next = [...phases]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    onPhasesChange?.(next)
  }

  const remove = (index) => {
    if (phases.length <= 1) return
    onPhasesChange?.(phases.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    if (addType === 'custom') {
      const title = customTitle.trim()
      if (!title) return
      onPhasesChange?.([
        ...phases,
        {
          key: `custom-${Date.now()}`,
          title,
          blockType: 'custom',
          isCustom: true,
          baselineTitle: title,
          copyObservationsFrom: 'technical',
          exercises: defaultExercisesForBlockType('technical'),
          baselineExercises: defaultExercisesForBlockType('technical'),
        },
      ])
      setCustomTitle('')
      setShowCustomInput(false)
      setAddType('technical')
      return
    }
    const label = PHASE_TYPE_CATALOG.find((o) => o.value === addType)?.label || addType
    const blockType = addType === 'race' ? 'race_simulation' : addType
    onPhasesChange?.([
      ...phases,
      {
        key: `add-${Date.now()}`,
        title: label,
        blockType,
        isCustom: false,
        baselineTitle: label,
        exercises: defaultExercisesForBlockType(blockType),
        baselineExercises: defaultExercisesForBlockType(blockType),
      },
    ])
  }

  return (
    <div
      className={`session-preset-phase-preview border rounded p-2 bg-body-tertiary ${compact ? 'small' : ''}`}
    >
      {!compact ? (
        <p className="small text-body-secondary mb-2 mb-0">
          Phases that will be created — quick confirm only.
        </p>
      ) : null}
      <ul className={`list-unstyled mb-2 ${compact ? 'small mb-1' : 'small'}`}>
        {phases.map((ph, index) => {
          const maxExercises = maxExercisesForPhase(ph)
          const exerciseCount = (ph.exercises || []).filter((ex) =>
            String(ex.exerciseName || '').trim(),
          ).length
          const customized =
            ph.isCustom || (ph.baselineTitle && ph.title !== ph.baselineTitle)
          return (
            <li
              key={ph.key}
              className="py-1 border-bottom border-light-subtle"
            >
              <div className="d-flex align-items-center gap-1">
                <span className="text-body-secondary" style={{ width: '1.25rem' }}>
                  {index + 1}.
                </span>
                <span className="flex-grow-1">
                  {customized ? <span className="me-1">★</span> : null}
                  {ph.title}
                  {maxExercises ? (
                    <span className="text-body-secondary ms-2">({exerciseCount} activities)</span>
                  ) : null}
                </span>
                {!compact && maxExercises ? (
                  <CButton
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() =>
                      setActivitiesOpenKey((key) => (key === ph.key ? null : ph.key))
                    }
                  >
                    Activities
                  </CButton>
                ) : null}
                {!compact ? (
                  <>
                    <CButton
                      size="sm"
                      variant="ghost"
                      disabled={disabled || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                    >
                      ↑
                    </CButton>
                    <CButton
                      size="sm"
                      variant="ghost"
                      disabled={disabled || index === phases.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </CButton>
                    <CButton
                      size="sm"
                      variant="ghost"
                      color="danger"
                      disabled={disabled || phases.length <= 1}
                      onClick={() => remove(index)}
                      aria-label="Remove phase"
                    >
                      ×
                    </CButton>
                  </>
                ) : null}
              </div>
              {!compact && maxExercises ? (
                <CCollapse visible={activitiesOpenKey === ph.key}>
                  <div className="mt-2 ps-4 pe-1">
                    {(ph.exercises || []).map((ex, exerciseIndex) => (
                      <div
                        key={`${ph.key}-exercise-${exerciseIndex}`}
                        className="d-flex flex-wrap gap-1 align-items-center mb-1"
                      >
                        <CFormInput
                          size="sm"
                          className="flex-grow-1"
                          placeholder="Activity name"
                          value={ex.exerciseName || ''}
                          disabled={disabled}
                          onChange={(e) =>
                            updateExercise(index, exerciseIndex, {
                              exerciseName: e.target.value,
                            })
                          }
                        />
                        <CFormInput
                          size="sm"
                          className="flex-grow-1"
                          placeholder="Note (optional)"
                          value={ex.description || ''}
                          disabled={disabled}
                          onChange={(e) =>
                            updateExercise(index, exerciseIndex, {
                              description: e.target.value,
                            })
                          }
                        />
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          disabled={disabled}
                          onClick={() => removeExercise(index, exerciseIndex)}
                        >
                          Remove
                        </CButton>
                      </div>
                    ))}
                    <CButton
                      size="sm"
                      variant="outline"
                      disabled={disabled || (ph.exercises || []).length >= maxExercises}
                      onClick={() => addExercise(index)}
                    >
                      Add activity
                    </CButton>
                    <span className="small text-body-secondary ms-2">
                      Up to {maxExercises} activities.
                    </span>
                  </div>
                </CCollapse>
              ) : null}
            </li>
          )
        })}
      </ul>
      {!compact ? (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <CFormSelect
            size="sm"
            style={{ maxWidth: 140 }}
            value={addType}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value
              setAddType(v)
              setShowCustomInput(v === 'custom')
            }}
          >
            {PHASE_TYPE_CATALOG.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </CFormSelect>
          {showCustomInput ? (
            <CFormInput
              size="sm"
              className="flex-grow-1"
              style={{ minWidth: 120 }}
              placeholder="Phase name"
              value={customTitle}
              disabled={disabled}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          ) : null}
          <CButton
            size="sm"
            color="primary"
            variant="outline"
            disabled={disabled}
            onClick={handleAdd}
          >
            + Add phase
          </CButton>
        </div>
      ) : null}
    </div>
  )
}
