import React from 'react'
import { CFormCheck } from '@coreui/react'

export default function ParticipationPrimitive({
  athletes = [],
  selectedIds = [],
  disabled,
  onChange,
}) {
  return (
    <div className="participation-primitive d-flex flex-wrap gap-2">
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        const checked = selectedIds.includes(sid)
        return (
          <CFormCheck
            key={sid}
            type="checkbox"
            id={`part-${sid}`}
            label={a.fullName || a.full_name || 'Athlete'}
            checked={checked}
            disabled={disabled}
            onChange={() => {
              const next = checked
                ? selectedIds.filter((x) => x !== sid)
                : [...selectedIds, sid]
              onChange?.(next)
            }}
          />
        )
      })}
    </div>
  )
}
