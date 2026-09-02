import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import { paymentsHubApi } from '../api/paymentsHubApi'
import { useAuth } from '../../auth/hooks/useAuth'
import { resolveUserRole } from '../../auth/utils/roleRedirect'
import CoachPaymentsPage from './CoachPaymentsPage'
import { formatMoney } from '../utils/formatInr'

const PaymentsHubPage = () => {
  const { user } = useAuth()
  const role = resolveUserRole(user)
  const [hub, setHub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadHub = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await paymentsHubApi.getHub()
      setHub(data)
    } catch (e) {
      if (!quiet) setError(e)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  const handleCoachDataChanged = useCallback(() => {
    void loadHub({ quiet: true })
  }, [loadHub])

  useEffect(() => {
    void loadHub()
  }, [loadHub, role, user?.activeRole])

  if (loading && !hub) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error && !hub) {
    return <CAlert color="warning">{error.message || 'Could not load payments.'}</CAlert>
  }

  const perspective = hub?.perspective || 'coach'

  if (perspective === 'academy_admin' || role === 'academy_owner') {
    return (
      <>
        <AdminPaymentsOverview hub={hub} />
        <CoachPaymentsPage onDataChanged={handleCoachDataChanged} />
      </>
    )
  }

  if (perspective === 'parent') {
    return <ParentPaymentsView hub={hub} />
  }

  if (perspective === 'student') {
    return <StudentPaymentsView hub={hub} />
  }

  if (perspective === 'super_admin') {
    return <SuperAdminPaymentsView hub={hub} />
  }

  return <CoachContinuityView hub={hub} />
}

function AdminPaymentsOverview({ hub }) {
  const o = hub?.overview || {}
  return (
    <CRow className="g-3 mb-4">
      <CCol xs={12}>
        <h2 className="mb-0">{hub?.title || 'Payments'}</h2>
        <p className="text-body-secondary small mb-0">
          Academy operations finance — coaching continuity, not accounting.
        </p>
      </CCol>
      <CCol xs={6} md={3}>
        <CCard className="shadow-sm">
          <CCardBody>
            <div className="small text-body-secondary">Gross collected (month)</div>
            <div className="fs-5 fw-semibold">
              {formatMoney(o.grossCollectedThisMonth ?? o.collectedThisMonth)}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6} md={3}>
        <CCard className="shadow-sm">
          <CCardBody>
            <div className="small text-body-secondary">Net collected (month)</div>
            <div className="fs-5 fw-semibold">
              {formatMoney(o.netCollectedThisMonth ?? o.collectedThisMonth)}
            </div>
            {o.refundsThisMonth != null && Number(o.refundsThisMonth) > 0 ? (
              <div className="small text-body-secondary">
                Refunds {formatMoney(o.refundsThisMonth)}
              </div>
            ) : null}
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6} md={3}>
        <CCard className="shadow-sm">
          <CCardBody>
            <div className="small text-body-secondary">Pending dues</div>
            <div className="fs-5 fw-semibold">{o.pendingDues ?? '—'}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6} md={3}>
        <CCard className="shadow-sm">
          <CCardBody>
            <div className="small text-body-secondary">Overdue</div>
            <div className="fs-5 fw-semibold">{o.overdueCount ?? '—'}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

function CoachContinuityView({ hub }) {
  const students = hub?.students || []
  return (
    <>
      <h2 className="mb-1">{hub?.title || 'Payments'}</h2>
      <p className="text-body-secondary small mb-3">
        Continuity signals only — use academy admin Payments for collections.
      </p>
      <CCard className="shadow-sm">
        <CCardHeader className="fw-semibold">Students</CCardHeader>
        <CCardBody className="p-0">
          <CListGroup flush>
            {students.length === 0 ? (
              <CListGroupItem className="text-body-secondary">No students</CListGroupItem>
            ) : (
              students.map((s) => (
                <CListGroupItem
                  key={s.studentId}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{s.name}</span>
                  <CBadge color={badgeColor(s.label)}>{s.label}</CBadge>
                </CListGroupItem>
              ))
            )}
          </CListGroup>
        </CCardBody>
      </CCard>
    </>
  )
}

function badgeColor(label) {
  const l = String(label || '').toLowerCase()
  if (l.includes('hold') || l.includes('overdue')) return 'danger'
  if (l.includes('due')) return 'warning'
  if (l.includes('paused')) return 'secondary'
  return 'success'
}

function ParentPaymentsView({ hub }) {
  const children = hub?.children || []
  const manualMode = hub?.payment_settings?.payment_flow !== 'ONLINE_CHECKOUT'
  return (
    <>
      <h2 className="mb-1">{hub?.title || 'Payments'}</h2>
      <p className="text-body-secondary small mb-3">
        Simple, supportive billing for your athletes.
      </p>
      {children.map((c) => (
        <CCard key={c.studentId} className="shadow-sm mb-3">
          <CCardHeader className="fw-semibold">{c.studentName}</CCardHeader>
          <CCardBody>
            {c.currentPlan ? (
              <p className="small mb-2">
                <strong>Plan:</strong> {c.currentPlan}
              </p>
            ) : null}
            {c.nextDue ? (
              <p className="small mb-3">
                Next due: {c.nextDue.dueDate} — ₹{c.nextDue.amount}
              </p>
            ) : null}
            <div className="mb-3">
              <div className="small text-body-secondary mb-1">Timeline</div>
              {(c.timeline || []).map((t, i) => (
                <div key={i} className="small">
                  {t.label || t.period}
                </div>
              ))}
            </div>
            <CButton color="primary" size="sm" as={Link} to="/parent/payments/history">
              {c.canPayNow ? (manualMode ? 'View & report payment' : 'Pay now') : 'Payment history'}
            </CButton>
          </CCardBody>
        </CCard>
      ))}
    </>
  )
}

function StudentPaymentsView({ hub }) {
  return (
    <CCard className="shadow-sm">
      <CCardBody className="text-center py-5">
        <h2 className="h5 mb-2">{hub?.title || 'Payments'}</h2>
        <p className="text-body-secondary mb-0">{hub?.message}</p>
      </CCardBody>
    </CCard>
  )
}

function SuperAdminPaymentsView({ hub }) {
  return (
    <>
      <h2 className="mb-3">{hub?.title || 'Platform payments'}</h2>
      <CRow className="g-2">
        <CCol xs={12} md={4}>
          <CButton
            color="primary"
            variant="outline"
            className="w-100"
            as={Link}
            to="/ops/collections"
          >
            Collections
          </CButton>
        </CCol>
        <CCol xs={12} md={4}>
          <CButton
            color="primary"
            variant="outline"
            className="w-100"
            as={Link}
            to="/ops/settlements"
          >
            Settlements
          </CButton>
        </CCol>
        <CCol xs={12} md={4}>
          <CButton color="primary" variant="outline" className="w-100" as={Link} to="/ops/webhooks">
            Webhooks
          </CButton>
        </CCol>
        <CCol xs={12} md={4}>
          <CButton
            color="secondary"
            variant="outline"
            className="w-100"
            as={Link}
            to="/coach/billing"
          >
            Subscriptions
          </CButton>
        </CCol>
      </CRow>
    </>
  )
}

export default PaymentsHubPage
