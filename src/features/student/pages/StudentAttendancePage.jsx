import React, { useEffect, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { parentApi } from '../../parent/api/parentApi'
import ParticipationTimeline from '../../participation/components/ParticipationTimeline'
import { FAMILY_PARTICIPATION_COPY } from '../../../core/productCopy'

const StudentAttendancePage = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await parentApi.getAttendance({ limit: 40 })
        const list = Array.isArray(data?.attendance) ? data.attendance : []
        if (!cancelled) setRows(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-1">{FAMILY_PARTICIPATION_COPY.pageTitle}</h2>
      <p className="text-body-secondary small mb-3">{FAMILY_PARTICIPATION_COPY.pageSubtitle}</p>
      <CCard className="shadow-sm">
        <CCardHeader>Session participation</CCardHeader>
        <CCardBody>
          <ParticipationTimeline rows={rows} emptyMessage="No session participation yet." />
        </CCardBody>
      </CCard>
    </>
  )
}

export default StudentAttendancePage
