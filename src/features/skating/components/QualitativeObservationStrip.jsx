import React from 'react'
import { CButton, CButtonGroup } from '@coreui/react'
import { DEFAULT_RAPID_KPIS } from '../constants/rapidObservationKpis'

/** Numeric 1–5 chips per KPI — maps to postRapidObservation payload in parent. */
export default function QualitativeObservationStrip({ obsScores, obsFlashKeys, disabled, onTap }) {
  return (
    <>
      {DEFAULT_RAPID_KPIS.map(({ key, label }) => (
        <div
          key={key}
          className={`rapid-kpi-row mb-2 d-flex align-items-center flex-wrap gap-2${
            obsFlashKeys?.has?.(key) ? ' rapid-kpi-row--flash' : ''
          }`}
        >
          <span className="small" style={{ minWidth: 88 }}>
            {label}
          </span>
          <CButtonGroup role="group" aria-label={`${label} score`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <CButton
                key={n}
                type="button"
                size="sm"
                color={obsScores[key] === n ? 'primary' : 'light'}
                className={obsScores[key] === n ? 'rapid-kpi-chip--active' : ''}
                disabled={disabled}
                onClick={() => onTap(key, n)}
              >
                {n}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
      ))}
    </>
  )
}
