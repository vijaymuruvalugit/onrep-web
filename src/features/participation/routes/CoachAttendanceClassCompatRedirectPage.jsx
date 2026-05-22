import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { liveSessionPath } from '../utils/liveSessionPath'

/** @deprecated compatibility route — silently deep-links into live session workspace. */
export default function CoachAttendanceClassCompatRedirectPage() {
  const { classId } = useParams()
  return <Navigate to={liveSessionPath(classId)} replace />
}
