import React, { useState } from 'react'
import { CButton, CFormInput } from '@coreui/react'

export default function RaceTimeEntryRow({ studentName, disabled, busy, onSave }) {
  const [seconds, setSeconds] = useState('')

  const submit = () => {
    const sec = Number(seconds)
    if (!Number.isFinite(sec) || sec <= 0) return
    void onSave?.(sec)
    setSeconds('')
  }

  return (
    <div className="race-time-entry-row d-flex flex-wrap align-items-center gap-2 mb-2">
      <span className="small fw-medium text-truncate" style={{ minWidth: 100 }}>
        {studentName || 'Athlete'}
      </span>
      <CFormInput
        type="number"
        step="0.01"
        min="0"
        size="sm"
        className="race-time-entry-row__input"
        placeholder="sec"
        value={seconds}
        disabled={disabled || busy}
        onChange={(e) => setSeconds(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
      />
      <CButton type="button" size="sm" color="primary" disabled={disabled || busy || !seconds} onClick={submit}>
        Save
      </CButton>
    </div>
  )
}
