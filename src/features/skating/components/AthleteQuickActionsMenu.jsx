import React, { useState } from 'react'
import {
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'

const STATUS_ITEMS = [
  { value: 'active', label: 'Active' },
  { value: 'resting', label: 'Rest' },
  { value: 'injured', label: 'Injured' },
  { value: 'skipped', label: 'Skip' },
]

/**
 * Per-athlete operational actions — hidden behind ⋮ (not inline on strip).
 */
export default function AthleteQuickActionsMenu({
  studentId,
  disabled = false,
  busy = false,
  isRacePhase = false,
  otherPhases = [],
  currentLane,
  currentHeat,
  onMoveAthlete,
  onSetStatus,
  onSetLane,
  onSetHeat,
}) {
  const [open, setOpen] = useState(false)

  if (!studentId) return null

  return (
    <CDropdown
      alignment="end"
      visible={open}
      onShow={() => setOpen(true)}
      onHide={() => setOpen(false)}
    >
      <CDropdownToggle
        color="light"
        size="sm"
        className="athlete-actions-menu__toggle"
        disabled={disabled || busy}
        caret={false}
        aria-label="Athlete actions"
        data-testid="athlete-quick-actions-toggle"
      >
        ⋮
      </CDropdownToggle>
      <CDropdownMenu className="athlete-actions-menu__menu">
        {otherPhases.length ? (
          <>
            <CDropdownItem header className="small text-body-secondary py-1">
              Move phase
            </CDropdownItem>
            {otherPhases.map((p) => (
              <CDropdownItem
                key={p.id}
                component="button"
                type="button"
                onClick={() => {
                  void onMoveAthlete?.(studentId, p.id)
                  setOpen(false)
                }}
              >
                {String(p.title || 'Phase').slice(0, 32)}
              </CDropdownItem>
            ))}
            <CDropdownDivider />
          </>
        ) : null}
        <CDropdownItem header className="small text-body-secondary py-1">
          Status
        </CDropdownItem>
        {STATUS_ITEMS.map(({ value, label }) => (
          <CDropdownItem
            key={value}
            component="button"
            type="button"
            onClick={() => {
              void onSetStatus?.(studentId, value)
              setOpen(false)
            }}
          >
            {label}
          </CDropdownItem>
        ))}
        {isRacePhase ? (
          <>
            <CDropdownDivider />
            <CDropdownItem header className="small text-body-secondary py-1">
              Lane
            </CDropdownItem>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <CDropdownItem
                key={`lane-${n}`}
                component="button"
                type="button"
                active={Number(currentLane) === n}
                onClick={() => {
                  void onSetLane?.(studentId, n)
                  setOpen(false)
                }}
              >
                Lane {n}
              </CDropdownItem>
            ))}
            <CDropdownDivider />
            <CDropdownItem header className="small text-body-secondary py-1">
              Heat
            </CDropdownItem>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CDropdownItem
                key={`heat-${n}`}
                component="button"
                type="button"
                active={Number(currentHeat) === n}
                onClick={() => {
                  void onSetHeat?.(studentId, n)
                  setOpen(false)
                }}
              >
                Heat {n}
              </CDropdownItem>
            ))}
          </>
        ) : null}
      </CDropdownMenu>
    </CDropdown>
  )
}
