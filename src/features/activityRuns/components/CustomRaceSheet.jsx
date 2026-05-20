import React, { useState } from 'react'
import { CButton, CFormInput, CFormLabel } from '@coreui/react'

export default function CustomRaceSheet({ disabled, busy, onConfirm, onCancel }) {
  const [laps, setLaps] = useState(5)
  const [distance, setDistance] = useState('')

  return (
    <div className="custom-race-sheet">
      <p className="fw-semibold mb-3">Custom race</p>
      <CFormLabel className="small">Laps</CFormLabel>
      <div className="d-flex align-items-center gap-2 mb-3">
        <CButton
          type="button"
          color="light"
          disabled={disabled || laps <= 1}
          onClick={() => setLaps((n) => Math.max(1, n - 1))}
        >
          −
        </CButton>
        <CFormInput
          type="number"
          min={1}
          max={100}
          value={laps}
          disabled={disabled}
          onChange={(e) => setLaps(Number(e.target.value) || 1)}
          className="text-center"
        />
        <CButton type="button" color="light" disabled={disabled} onClick={() => setLaps((n) => n + 1)}>
          +
        </CButton>
      </div>
      <CFormLabel className="small text-body-secondary">Distance (optional)</CFormLabel>
      <CFormInput
        type="text"
        placeholder="400m"
        value={distance}
        disabled={disabled}
        onChange={(e) => setDistance(e.target.value)}
        className="mb-3"
      />
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 fw-bold mb-2"
        disabled={disabled || busy}
        onClick={() =>
          onConfirm?.({
            targetProgressCount: laps,
            distanceLabel: distance.trim() || null,
          })
        }
      >
        Start race →
      </CButton>
      <CButton type="button" color="light" className="w-100" disabled={disabled} onClick={onCancel}>
        Back
      </CButton>
    </div>
  )
}
