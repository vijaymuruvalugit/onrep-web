import React from 'react'
import { CButton } from '@coreui/react'
import filterDefinitionsForActivity from '../utils/filterDefinitionsForActivity'

export default function RunTypeSelector({ activitySlug = 'skating', disabled, onSelect }) {
  const defs = filterDefinitionsForActivity(activitySlug)

  return (
    <div className="run-type-selector">
      <h2 className="h5 fw-semibold mb-3">Choose run type</h2>
      <div className="run-type-selector__grid d-flex flex-column gap-2">
        {defs.map((d) => (
          <CButton
            key={d.type}
            type="button"
            color="light"
            size="lg"
            className="run-type-selector__card text-start py-3"
            disabled={disabled}
            onClick={() => onSelect?.(d.type)}
          >
            <span className="fw-semibold d-block">{d.label}</span>
          </CButton>
        ))}
      </div>
    </div>
  )
}
