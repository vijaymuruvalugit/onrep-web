import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { setActiveWorkspace, selectActiveActivity } from '../slices/workspaceSlice'
import { getWorkspaceDisplay } from '../../../core/activityWorkspace/activityDisplay'

function initials(label) {
  const s = String(label || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

export default function ActivityWorkspaceSwitcher() {
  const dispatch = useDispatch()
  const active = useSelector(selectActiveActivity)
  const activities = useSelector((state) => state.workspace.activities)

  if (!activities?.length) return null

  const activeDisplay = active ? getWorkspaceDisplay(active) : null

  if (activities.length === 1) {
    const a = activities[0]
    const { label, icon } = getWorkspaceDisplay(a)
    return (
      <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1 px-2 py-1">
        <span className="small" aria-hidden>
          {icon}
        </span>
        <span className="small">{label}</span>
      </span>
    )
  }

  return (
    <CDropdown variant="nav-item" alignment="end">
      <CDropdownToggle
        caret={false}
        className="py-0 btn btn-link nav-link d-flex align-items-center gap-2"
      >
        <span
          className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center"
          style={{ width: 26, height: 26, fontSize: 11 }}
        >
          {activeDisplay?.icon ? (
            <span style={{ fontSize: 14 }} aria-hidden>
              {activeDisplay.icon}
            </span>
          ) : (
            initials(activeDisplay?.label)
          )}
        </span>
        <span className="small text-body">{activeDisplay?.label || 'Workspace'}</span>
      </CDropdownToggle>
      <CDropdownMenu>
        {activities.map((a) => {
          const { label, icon } = getWorkspaceDisplay(a)
          return (
            <CDropdownItem
              key={a.id}
              active={active?.id === a.id}
              onClick={() => dispatch(setActiveWorkspace(a.id))}
            >
              <span className="me-2" aria-hidden>
                {icon}
              </span>
              {label}
            </CDropdownItem>
          )
        })}
      </CDropdownMenu>
    </CDropdown>
  )
}
