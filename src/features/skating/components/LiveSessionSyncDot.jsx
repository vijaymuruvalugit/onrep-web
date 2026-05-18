import React, { memo } from 'react'

/**
 * Low-attention background session sync indicator — never blocks interaction.
 */
function LiveSessionSyncDot({ syncing, className = '' }) {
  if (!syncing) return null
  return (
    <span
      className={`coach-live-sync-dot${className ? ` ${className}` : ''}`}
      data-testid="live-session-sync-dot"
      role="status"
      aria-label="Syncing session data"
      title="Syncing"
    />
  )
}

export default memo(LiveSessionSyncDot)
