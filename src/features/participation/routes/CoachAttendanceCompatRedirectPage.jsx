import React from 'react'
import { Navigate } from 'react-router-dom'

/** @deprecated compatibility route — silently deep-links to live sessions. */
export default function CoachAttendanceCompatRedirectPage() {
  return <Navigate to="/coach/skating" replace />
}
