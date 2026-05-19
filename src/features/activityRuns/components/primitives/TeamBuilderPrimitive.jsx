import React, { useState } from 'react'
import { CButton } from '@coreui/react'

/** Minimal relay team picker — assign members to team slots. */
export default function TeamBuilderPrimitive({ athletes = [], disabled, onTeamsChange }) {
  const [teams, setTeams] = useState([{ team_id: 'team-1', members: [] }])

  const addTeam = () => {
    setTeams((prev) => [...prev, { team_id: `team-${prev.length + 1}`, members: [] }])
  }

  const toggleMember = (teamIdx, studentId) => {
    const sid = String(studentId)
    setTeams((prev) => {
      const next = prev.map((t, i) => {
        if (i !== teamIdx) {
          return { ...t, members: t.members.filter((m) => m !== sid) }
        }
        const has = t.members.includes(sid)
        return {
          ...t,
          members: has ? t.members.filter((m) => m !== sid) : [...t.members, sid],
        }
      })
      onTeamsChange?.(next)
      return next
    })
  }

  return (
    <div className="team-builder-primitive">
      {teams.map((team, ti) => (
        <div key={team.team_id} className="mb-3 p-2 border rounded">
          <p className="fw-semibold mb-2">Team {ti + 1}</p>
          <div className="d-flex flex-wrap gap-2">
            {athletes.map((a) => {
              const sid = String(a.studentId || a.id)
              const on = team.members.includes(sid)
              return (
                <CButton
                  key={sid}
                  type="button"
                  size="lg"
                  color={on ? 'primary' : 'light'}
                  disabled={disabled}
                  onClick={() => toggleMember(ti, sid)}
                >
                  {a.fullName || a.full_name || 'Athlete'}
                </CButton>
              )
            })}
          </div>
        </div>
      ))}
      <CButton type="button" color="light" size="sm" disabled={disabled} onClick={addTeam}>
        Add team
      </CButton>
    </div>
  )
}
