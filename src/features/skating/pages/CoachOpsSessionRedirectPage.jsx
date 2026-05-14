import React from 'react'
import { Navigate, useParams } from 'react-router-dom'

/** Canonical deep link → skating ops workspace (query preserves existing page). */
export default function CoachOpsSessionRedirectPage() {
  const { sessionId } = useParams()
  const q = sessionId ? `?session=${encodeURIComponent(sessionId)}` : ''
  return <Navigate to={`/coach/skating${q}`} replace />
}
