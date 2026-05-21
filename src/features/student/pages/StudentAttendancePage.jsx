import React, { useEffect, useState } from 'react'
import { CCard, CCardBody, CListGroup, CListGroupItem, CSpinner } from '@coreui/react'
import { parentApi } from '../../parent/api/parentApi'

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
      <h2 className="mb-3">Attendance</h2>
      <CCard className="shadow-sm">
        <CCardBody className="p-0">
          <CListGroup flush>
            {rows.map((a) => (
              <CListGroupItem key={a.id} className="d-flex justify-content-between">
                <span className="small">{a.sessionTitle || a.sessionDate || 'Session'}</span>
                <span className="small fw-semibold">{a.status}</span>
              </CListGroupItem>
            ))}
          </CListGroup>
        </CCardBody>
      </CCard>
    </>
  )
}

export default StudentAttendancePage
