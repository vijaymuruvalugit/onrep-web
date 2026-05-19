import React from 'react'

/** One-line summary for collapsed athlete card. */
export default function ObservationSummary({ text, className = '' }) {
  if (!text) {
    return (
      <span className={`observation-summary observation-summary--empty small text-body-secondary ${className}`}>
        No observations yet
      </span>
    )
  }
  return (
    <span className={`observation-summary ${className}`} title={text}>
      {text}
    </span>
  )
}
