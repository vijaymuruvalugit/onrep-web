import React, { useEffect, useState } from 'react'
import {
  CBadge,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CSpinner,
  CCloseButton,
  CButton,
} from '@coreui/react'
import http from '../../../api/http'
import { useAuth } from '../../auth/hooks/useAuth'
import opsApi from '../api/opsApi'

/**
 * Payment detail drawer — canonical "explain what happened" surface (Phase 3.1).
 *
 * Caller passes the full `transaction` row (from `GET .../obligations/:id/transactions`).
 * Platform admins additionally load refund rows + audit log via `/ops/*`.
 *
 * Receipt PDF is fetched with the session JWT (blob) — `window.open` cannot
 * attach Authorization.
 */
function fmtINR(amount) {
  const n = Number(amount || 0)
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN')
  } catch {
    return String(d)
  }
}

function reconBadgeColor(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'confirmed') return 'success'
  if (v === 'orphaned') return 'danger'
  if (v === 'manual_review') return 'warning'
  if (v === 'refunded') return 'info'
  return 'secondary'
}

function buildTimeline({ transaction, refunds, audit }) {
  const events = []
  if (transaction?.payment_date || transaction?.recorded_at) {
    const at = transaction.payment_date || transaction.recorded_at
    events.push({
      kind: 'confirmed',
      at,
      title: 'Payment recorded',
      subtitle: `${fmtINR(transaction.amount)} via ${transaction.payment_method_normalized || transaction.payment_method || 'unknown'}`,
    })
  }
  for (const r of refunds || []) {
    events.push({
      kind: 'refund',
      at: r.processed_at || r.created_at,
      title: `Refund · ${r.status}`,
      subtitle: `${fmtINR((r.amount_paise || 0) / 100)} — ${r.reason || 'no reason'}`,
    })
  }
  for (const l of audit || []) {
    events.push({
      kind: 'audit',
      at: l.created_at,
      title: `Action · ${l.action}`,
      subtitle: l.actor_user_id ? `by user ${String(l.actor_user_id).slice(0, 8)}` : 'system',
    })
  }
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export default function PaymentDetailDrawer({ transaction, open, onClose }) {
  const { user } = useAuth()
  const isOps = user?.is_platform_admin === true
  const [loadingExtras, setLoadingExtras] = useState(false)
  const [refunds, setRefunds] = useState([])
  const [audit, setAudit] = useState([])
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    if (!open || !transaction?.id || !isOps) {
      setRefunds([])
      setAudit([])
      return undefined
    }
    let cancelled = false
    setLoadingExtras(true)
    Promise.all([
      opsApi.listRefunds(transaction.id),
      opsApi.getAuditLog({
        entityType: 'payment_transaction',
        entityId: transaction.id,
        limit: 30,
      }),
    ])
      .then(([r, a]) => {
        if (!cancelled) {
          setRefunds(r || [])
          setAudit(a || [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRefunds([])
          setAudit([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExtras(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, transaction?.id, isOps])

  if (!open || !transaction) return null

  const timeline = buildTimeline({ transaction, refunds, audit })

  const downloadReceiptPdf = async () => {
    if (!transaction.id) return
    setPdfBusy(true)
    try {
      const res = await http.get(`/payments/transactions/${transaction.id}/receipt.pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${transaction.receipt_number || 'receipt'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      /* toast handled by caller if needed */
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <COffcanvas placement="end" visible={open} onHide={onClose} backdrop="static">
      <COffcanvasHeader>
        <COffcanvasTitle>Payment details</COffcanvasTitle>
        <CCloseButton onClick={onClose} />
      </COffcanvasHeader>
      <COffcanvasBody>
        <h5 className="mb-2">{fmtINR(transaction.amount)}</h5>
        <div className="mb-3">
          <CBadge color={reconBadgeColor(transaction.reconciliation_state)}>
            {transaction.reconciliation_state || 'unknown'}
          </CBadge>{' '}
          <CBadge color="secondary">{transaction.gateway_payment_state || '—'}</CBadge>
        </div>
        <dl className="row small">
          <dt className="col-4">Method</dt>
          <dd className="col-8">
            {transaction.payment_method_normalized || transaction.payment_method || '—'}
          </dd>
          <dt className="col-4">Razorpay payment</dt>
          <dd className="col-8">
            <code>{transaction.razorpay_payment_id || '—'}</code>
          </dd>
          <dt className="col-4">Bank reference</dt>
          <dd className="col-8">
            <code>{transaction.bank_reference_normalized || '—'}</code>
          </dd>
          <dt className="col-4">Receipt no.</dt>
          <dd className="col-8">{transaction.receipt_number || '—'}</dd>
          <dt className="col-4">Refunded</dt>
          <dd className="col-8">
            {fmtINR((Number(transaction.refund_total_paise) || 0) / 100)} (
            {transaction.refund_summary || 'none'})
          </dd>
        </dl>

        {isOps && loadingExtras ? (
          <div className="my-2">
            <CSpinner size="sm" /> Loading ops timeline…
          </div>
        ) : null}

        <h6 className="mt-4">Timeline</h6>
        {timeline.length === 0 ? (
          <em>No timeline events.</em>
        ) : (
          <ol className="list-unstyled">
            {timeline.map((ev, idx) => (
              <li key={idx} className="mb-3 border-start ps-3" style={{ borderColor: '#dee2e6' }}>
                <div className="small text-muted">{fmtDate(ev.at)}</div>
                <div>
                  <strong>{ev.title}</strong>
                </div>
                <div className="text-muted small">{ev.subtitle}</div>
              </li>
            ))}
          </ol>
        )}

        <CButton
          color="primary"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={pdfBusy}
          onClick={downloadReceiptPdf}
        >
          {pdfBusy ? <CSpinner size="sm" /> : 'Download receipt PDF'}
        </CButton>
      </COffcanvasBody>
    </COffcanvas>
  )
}
