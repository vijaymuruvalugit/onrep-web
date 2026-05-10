import React, { useMemo, useState } from 'react'
import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle, CFormInput } from '@coreui/react'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'

function formatNextHint(batch) {
  const snap = batch.nextSessionSnapshot ?? batch.next_session_snapshot
  if (!snap || typeof snap !== 'object') return null
  const sd = snap.sessionDate ?? snap.session_date
  const st = snap.startTime ?? snap.start_time
  if (!sd && !st) return null
  const datePart = sd ? String(sd).slice(0, 10) : ''
  return [datePart, st].filter(Boolean).join(' · ') || null
}

/**
 * Searchable batch switcher for schedule (many batches).
 */
export default function ScheduleBatchSwitcher({ batches = [], activities = [], value, onChange }) {
  const [q, setQ] = useState('')
  const selected = useMemo(
    () => batches.find((b) => String(b.id || b._id) === String(value)) || null,
    [batches, value],
  )

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return batches.filter((b) => {
      const name = stripDemoSuffix(b.name || '').toLowerCase()
      const sub = String(b.subActivityName || b.sub_activity_name || '').toLowerCase()
      const wid = b.activityWorkspaceId ?? b.activity_workspace_id
      const act = activities.find((a) => String(a.id) === String(wid))
      const actName = String(act?.name || '').toLowerCase()
      if (!s) return true
      return name.includes(s) || sub.includes(s) || actName.includes(s)
    })
  }, [batches, q, activities])

  const title = selected ? stripDemoSuffix(selected.name || '') || 'Untitled batch' : 'Select batch'

  return (
    <CDropdown className="schedule-batch-switcher w-100">
      <CDropdownToggle
        color="light"
        className="w-100 text-start d-flex justify-content-between align-items-center border shadow-none py-2"
      >
        <span className="text-truncate me-2">{title}</span>
      </CDropdownToggle>
      <CDropdownMenu className="w-100 pt-0 shadow schedule-batch-switcher__menu">
        <div className="p-2 border-bottom bg-body sticky-top">
          <CFormInput
            size="sm"
            placeholder="Search batches…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="schedule-batch-switcher__scroll px-1 py-1">
          {filtered.map((b) => {
            const id = String(b.id || b._id)
            const wid = b.activityWorkspaceId ?? b.activity_workspace_id
            const act = activities.find((a) => String(a.id) === String(wid))
            const activityLine = act?.name ? stripDemoSuffix(act.name) : ''
            const sub = stripDemoSuffix(b.subActivityName || b.sub_activity_name || '')
            const meta = [activityLine, sub].filter(Boolean).join(' · ')
            const nextHint = formatNextHint(b)
            const active = String(value) === id
            return (
              <CDropdownItem
                key={id}
                active={active}
                className="rounded-2 py-2"
                onClick={() => {
                  onChange(id)
                  setQ('')
                }}
              >
                <div className="fw-semibold text-truncate">{stripDemoSuffix(b.name || '')}</div>
                {meta ? (
                  <div className="small text-body-secondary text-truncate">{meta}</div>
                ) : null}
                {nextHint ? (
                  <div className="small text-body-secondary text-truncate mt-1 opacity-75">
                    Next · {nextHint}
                  </div>
                ) : null}
              </CDropdownItem>
            )
          })}
          {!filtered.length ? (
            <div className="small text-body-secondary px-2 py-3 text-center">No matches.</div>
          ) : null}
        </div>
      </CDropdownMenu>
    </CDropdown>
  )
}
