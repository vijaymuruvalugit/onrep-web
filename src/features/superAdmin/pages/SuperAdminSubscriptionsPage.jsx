import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

export default function SuperAdminSubscriptionsPage() {
  const [data, setData] = useState({ plans: [], academies: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    superAdminApi
      .getSubscriptions()
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  const atRisk = (data.academies || []).filter((a) => !a.entitlement?.has_access)

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Subscriptions"
        subtitle="Plans, trials, renewals, and capability access — not coaching usability paywalls."
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <>
          <h6 className="mt-3">Plans</h6>
          <CTable size="sm" className="bg-white rounded shadow-sm mb-4">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Price (INR)</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data.plans.map((p) => (
                <CTableRow key={p.id}>
                  <CTableDataCell>{p.id}</CTableDataCell>
                  <CTableDataCell>{p.name}</CTableDataCell>
                  <CTableDataCell>{p.price_inr}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>

          <h6>Attention — access lapsed ({atRisk.length})</h6>
          <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Academy</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Plan</CTableHeaderCell>
                <CTableHeaderCell>Trial ends</CTableHeaderCell>
                <CTableHeaderCell>Sub ends</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {(data.academies || []).slice(0, 100).map((a) => (
                <CTableRow key={a.id}>
                  <CTableDataCell>{a.name}</CTableDataCell>
                  <CTableDataCell>{a.subscription_status}</CTableDataCell>
                  <CTableDataCell>{a.subscription_plan || '—'}</CTableDataCell>
                  <CTableDataCell>{formatDisplayDateDmy(a.trial_ends_at)}</CTableDataCell>
                  <CTableDataCell>{formatDisplayDateDmy(a.subscription_end_date)}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </>
      )}
    </div>
  )
}
