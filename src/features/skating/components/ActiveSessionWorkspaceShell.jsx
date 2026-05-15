import React from 'react'

/**
 * Live coaching workspace container (roster, observations, laps, metrics).
 * @param {{ children: React.ReactNode }} props
 */
export default function ActiveSessionWorkspaceShell({ children }) {
  return (
    <div className="skating-ops-workspace-shell" data-testid="active-session-workspace-shell">
      {children}
    </div>
  )
}
