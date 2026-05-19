import React, { useState } from 'react'
import { CButton, CFormInput } from '@coreui/react'

export default function ScoringPrimitive({ disabled, onSave }) {
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="scoring-primitive">
      <CFormInput
        type="number"
        inputMode="numeric"
        size="lg"
        placeholder="Score"
        value={score}
        disabled={disabled}
        onChange={(e) => setScore(e.target.value)}
        className="mb-2"
      />
      <CFormInput
        type="text"
        size="lg"
        placeholder="Notes (optional)"
        value={notes}
        disabled={disabled}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-2"
      />
      <CButton
        type="button"
        color="primary"
        size="lg"
        disabled={disabled || score === ''}
        onClick={() => onSave?.({ score: Number(score), notes })}
      >
        Save
      </CButton>
    </div>
  )
}
