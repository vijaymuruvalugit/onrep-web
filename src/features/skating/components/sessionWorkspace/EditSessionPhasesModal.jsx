import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
} from '@coreui/react'
import { sessionPhasesApi } from '../../../../domain/sessionPhases/sessionPhasesApi'
import { livePhaseLabel } from '../../constants/coachLiveLabels'
import { addablePhaseTypeOptions } from '../../utils/sessionPhaseOptions'

export default function EditSessionPhasesModal({
  visible,
  onClose,
  operationalSessionId,
  phases = [],
  onUpdated,
}) {
  const [localPhases, setLocalPhases] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [addType, setAddType] = useState('technical')
  const [addTitle, setAddTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (visible) {
      setLocalPhases([...phases])
      setError('')
      setEditingId(null)
    }
  }, [visible, phases])

  const addTypeOptions = useMemo(
    () => addablePhaseTypeOptions(localPhases),
    [localPhases],
  )

  useEffect(() => {
    if (!addTypeOptions.some((o) => o.value === addType)) {
      setAddType(addTypeOptions[0]?.value || 'technical')
    }
  }, [addTypeOptions, addType])

  const reload = useCallback(async () => {
    if (!operationalSessionId) return
    const { phases: next } = await sessionPhasesApi.listPhases(operationalSessionId)
    setLocalPhases(next)
    onUpdated?.()
  }, [operationalSessionId, onUpdated])

  const handleAdd = async () => {
    setError('')
    setBusy(true)
    try {
      const title =
        addTitle.trim() ||
        addTypeOptions.find((o) => o.value === addType)?.label ||
        'New phase'
      await sessionPhasesApi.createPhase(operationalSessionId, {
        title,
        blockType: addType,
      })
      setAddTitle('')
      await reload()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not add phase')
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (phaseId) => {
    if (!editTitle.trim()) return
    setBusy(true)
    try {
      await sessionPhasesApi.updatePhase(operationalSessionId, phaseId, {
        title: editTitle.trim(),
      })
      setEditingId(null)
      await reload()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not rename')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (phaseId) => {
    if (!window.confirm('Remove this phase from the session?')) return
    setBusy(true)
    try {
      await sessionPhasesApi.deletePhase(operationalSessionId, phaseId)
      await reload()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicate = async (phaseId) => {
    setBusy(true)
    try {
      await sessionPhasesApi.duplicatePhase(operationalSessionId, phaseId, {})
      await reload()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not duplicate')
    } finally {
      setBusy(false)
    }
  }

  const movePhase = async (index, direction) => {
    const next = [...localPhases]
    const j = index + direction
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setBusy(true)
    try {
      await sessionPhasesApi.reorderPhases(
        operationalSessionId,
        next.map((p) => String(p.id)),
      )
      await reload()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not reorder')
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader>Edit phases</CModalHeader>
      <CModalBody>
        <p className="small text-body-secondary">
          Change phase order, names, and structure for this session only.
        </p>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        <ul className="list-group mb-3">
          {localPhases.map((phase, index) => {
            const id = String(phase.id)
            const label = livePhaseLabel(phase.blockType, phase.title)
            const isEditing = editingId === id
            return (
              <li key={id} className="list-group-item d-flex flex-wrap align-items-center gap-2">
                <span className="text-body-secondary small">{index + 1}.</span>
                {isEditing ? (
                  <>
                    <CFormInput
                      size="sm"
                      className="flex-grow-1"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <CButton
                      size="sm"
                      color="primary"
                      disabled={busy}
                      onClick={() => handleRename(id)}
                    >
                      Save
                    </CButton>
                    <CButton size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </CButton>
                  </>
                ) : (
                  <>
                    <span className="flex-grow-1 fw-semibold">{label}</span>
                    <CButton
                      size="sm"
                      variant="outline"
                      disabled={busy || index === 0}
                      onClick={() => movePhase(index, -1)}
                    >
                      ↑
                    </CButton>
                    <CButton
                      size="sm"
                      variant="outline"
                      disabled={busy || index === localPhases.length - 1}
                      onClick={() => movePhase(index, 1)}
                    >
                      ↓
                    </CButton>
                    <CButton
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(id)
                        setEditTitle(phase.title || label)
                      }}
                    >
                      Rename
                    </CButton>
                    <CButton
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleDuplicate(id)}
                    >
                      Duplicate
                    </CButton>
                    <CButton
                      size="sm"
                      color="danger"
                      variant="outline"
                      disabled={busy || localPhases.length <= 1}
                      onClick={() => handleDelete(id)}
                    >
                      Delete
                    </CButton>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        <div className="border-top pt-3">
          <p className="fw-semibold small mb-2">Add phase</p>
          <div className="row g-2">
            <div className="col-md-5">
              <CFormSelect
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                disabled={!addTypeOptions.length}
              >
                {addTypeOptions.length ? (
                  addTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                ) : (
                  <option value="">All phase types in session</option>
                )}
              </CFormSelect>
            </div>
            <div className="col-md-5">
              <CFormInput
                placeholder="Title (optional)"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <CButton
                color="primary"
                className="w-100"
                disabled={busy || !addTypeOptions.length}
                onClick={handleAdd}
              >
                Add
              </CButton>
            </div>
          </div>
        </div>
        {busy ? <CSpinner size="sm" className="mt-2" /> : null}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Done
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
