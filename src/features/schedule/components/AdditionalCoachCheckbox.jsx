import React from 'react'

/**
 * Stable native checkbox. CoreUI `CFormCheck` recreates its inner <input> on every
 * render, which drops clicks while parent state (preset payload, preview) updates.
 */
export default function AdditionalCoachCheckbox({ id, label, checked, disabled, onCheckedChange }) {
  return (
    <div className="form-check mb-0">
      <input
        type="checkbox"
        className="form-check-input"
        id={id}
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  )
}
