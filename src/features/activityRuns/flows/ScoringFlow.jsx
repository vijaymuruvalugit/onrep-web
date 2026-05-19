import React, { useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import ScoringPrimitive from '../components/primitives/ScoringPrimitive'
import NotesPrimitive from '../components/primitives/NotesPrimitive'
import { buildRunPayload, participationMeta } from '../utils/buildRunPayload'

export default function ScoringFlow({
  definition,
  athletes,
  disabled,
  busy,
  runType = 'ASSESSMENT',
  onSaveRun,
}) {
  const [selectedId, setSelectedId] = useState('')
  const [coachNotes, setCoachNotes] = useState('')
  const [criteria, setCriteria] = useState([])
  const [error, setError] = useState('')

  const save = async () => {
    if (!selectedId) return
    setError('')
    try {
      const payload = buildRunPayload(runType, {
        coach_notes: coachNotes,
        criteria_results: criteria,
        results: [{ student_id: selectedId, ...participationMeta() }],
      })
      await onSaveRun?.(runType, payload)
      setCriteria([])
      setCoachNotes('')
    } catch (e) {
      setError(e?.message || 'Could not save')
    }
  }

  return (
    <div className="scoring-flow">
      <AthleteSelectionGrid
        athletes={athletes}
        selectedId={selectedId}
        disabled={disabled}
        onSelect={setSelectedId}
      />
      {definition.capabilities.scoring ? (
        <ScoringPrimitive
          disabled={disabled || !selectedId}
          onSave={({ score, notes }) => {
            setCriteria((prev) => [...prev, { score, notes }])
          }}
        />
      ) : null}
      {definition.capabilities.notes ? (
        <div className="mt-3">
          <NotesPrimitive disabled={disabled} onSave={setCoachNotes} />
        </div>
      ) : null}
      {error ? <CAlert color="danger" className="small py-2">{error}</CAlert> : null}
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3"
        disabled={disabled || busy || !selectedId}
        onClick={() => void save()}
      >
        Save
      </CButton>
    </div>
  )
}
