import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import paymentsApi from '../api/paymentsApi'
import { hasAcademyAdminCapability } from '../../auth/utils/academyAdminAccess'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatDueShort } from '../utils/formatDueShort'
import BulkInvoiceComposer from './BulkInvoiceComposer'

function newKey() {
  return crypto.randomUUID()
}

function InvoiceActions({
  invoice,
  readOnly,
  canIssue,
  busy,
  payAmount,
  setPayAmount,
  payMethod,
  setPayMethod,
  payReference,
  setPayReference,
  onPay,
  onPdf,
  onReload,
  onError,
}) {
  const [reason, setReason] = useState('')
  const [concession, setConcession] = useState('')
  const [allocation, setAllocation] = useState(null)
  const [correction, setCorrection] = useState(null)
  const [obligationId, setObligationId] = useState(invoice.lines?.[0]?.obligationId || '')
  const [billableStart, setBillableStart] = useState('')
  const [billableEnd, setBillableEnd] = useState('')

  async function run(fn) {
    onError('')
    try {
      await fn()
      await onReload()
    } catch (e) {
      onError(e.message || 'Request failed')
    }
  }

  return (
    <div className="d-flex flex-column gap-2 mt-2">
      <div className="d-flex flex-wrap gap-2">
        <CButton color="secondary" size="sm" variant="outline" onClick={onPdf}>
          Download PDF
        </CButton>
        {!readOnly ? (
          <>
            <CFormSelect value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </CFormSelect>
            <CFormInput
              placeholder={payMethod === 'CASH' ? 'Reference optional' : 'UTR or reference'}
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <CFormInput
              placeholder="Payment amount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              style={{ maxWidth: 160 }}
            />
            <CButton
              color="secondary"
              size="sm"
              variant="outline"
              disabled={busy || !payAmount}
              onClick={() => setAllocation(previewAllocation(invoice, payAmount))}
            >
              Show allocation
            </CButton>
            <CButton color="primary" size="sm" disabled={busy || !payAmount || !allocation} onClick={onPay}>
              Confirm payment
            </CButton>
          </>
        ) : null}
      </div>
      {allocation ? (
        <div className="small">
          {allocation.lines.map((line) => (
            <div key={line.description}>
              {line.description}: {money(line.amount)}
            </div>
          ))}
          {allocation.unallocated > 0 ? (
            <div>Unallocated {money(allocation.unallocated / 100)}. The payment will be rejected if it exceeds the selected charges.</div>
          ) : null}
        </div>
      ) : null}
      {canIssue ? (
        <>
          <div className="d-flex flex-wrap gap-2">
            <CFormSelect value={obligationId} onChange={(e) => setObligationId(e.target.value)} style={{ maxWidth: 280 }}>
              {(invoice.lines || []).map((line) => (
                <option key={line.id} value={line.obligationId}>
                  {line.description}
                </option>
              ))}
            </CFormSelect>
            <CFormInput placeholder="Concession" value={concession} onChange={(e) => setConcession(e.target.value)} style={{ maxWidth: 140 }} />
            <CFormInput placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <CButton
              color="warning"
              size="sm"
              variant="outline"
              disabled={busy || !concession || !reason}
              onClick={() =>
                run(() =>
                  paymentsApi.waiveObligation({
                    obligationId,
                    amount: concession,
                    reason,
                    clientMutationId: newKey(),
                  }),
                )
              }
            >
              Apply concession
            </CButton>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <CFormInput type="date" value={billableStart} onChange={(e) => setBillableStart(e.target.value)} />
            <CFormInput type="date" value={billableEnd} onChange={(e) => setBillableEnd(e.target.value)} />
            <CButton
              color="warning"
              size="sm"
              variant="outline"
              disabled={busy || !billableStart || !billableEnd || !reason}
              onClick={() =>
                run(() =>
                  paymentsApi.prorateObligation({
                    obligationId,
                    billableStart,
                    billableEnd,
                    reason,
                    clientMutationId: newKey(),
                  }),
                )
              }
            >
              Prorate tuition
            </CButton>
            <CButton
              color="danger"
              size="sm"
              variant="outline"
              disabled={busy || !reason}
              onClick={() =>
                run(() =>
                  paymentsApi.cancelInvoice({
                    invoiceId: invoice.id,
                    reason,
                    clientMutationId: newKey(),
                  }),
                )
              }
            >
              Void document
            </CButton>
            <CButton
              color="danger"
              size="sm"
              variant="outline"
              disabled={busy || !reason || !obligationId}
              onClick={() =>
                run(async () => {
                  if (!correction || correction.obligationId !== obligationId) {
                    const preview = await paymentsApi.previewChargeCorrection(obligationId)
                    setCorrection(preview)
                    return
                  }
                  const applied = await paymentsApi.applyChargeCorrection({
                    obligationId,
                    reason,
                    clientMutationId: newKey(),
                  })
                  setCorrection({
                    ...correction,
                    refundStatus: applied.refundStatus || 'none',
                    moneyReturned: false,
                  })
                })
              }
            >
              {correction?.obligationId === obligationId ? 'Confirm charge correction' : 'Preview charge correction'}
            </CButton>
          </div>
          {correction ? (
            <div className="small">
              Original {money(correction.originalCharge)} · collected {money(correction.cashCollected)} · reduction {money(correction.chargeReduction)} · refund due {money(correction.refundDue)} · remaining {money(correction.resultingOutstanding)}.
              {' '}Requesting a refund does not return the money.
              {correction.refundStatus ? ` Refund status: ${correction.refundStatus}.` : ''}
            </div>
          ) : null}
          <div className="small text-body-secondary">
            Voiding the document keeps referenced tuition and event charges. A collected charge is reduced through charge correction, then a separate refund record.
          </div>
        </>
      ) : null}
    </div>
  )
}

function previewAllocation(invoice, amount) {
  const paise = Math.round(Number(amount) * 100)
  if (!Number.isFinite(paise) || paise <= 0) return { lines: [], unallocated: 0 }
  const lines = [...(invoice.lines || [])].sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
  let left = paise
  const taken = []
  for (const line of lines) {
    const outstanding = Math.round(Number(line.outstandingAmount || 0) * 100)
    if (outstanding <= 0 || left <= 0) continue
    const take = Math.min(outstanding, left)
    taken.push({ description: line.description, amount: (take / 100).toFixed(2) })
    left -= take
  }
  return { lines: taken, unallocated: left }
}

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toFixed(2)}`
}

function deliveryLabel(status) {
  if (status === 'queued') return 'Queued'
  if (status === 'provider_accepted') return 'Accepted by the email provider'
  if (status === 'failed') return 'Failed'
  return 'Not sent'
}

export default function InvoicesPanel({ readOnly = false, studentId = null }) {
  const { user } = useAuth()
  const canIssue = !readOnly && hasAcademyAdminCapability(user)
  const [invoices, setInvoices] = useState([])
  const [obligations, setObligations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(studentId || '')
  const [picked, setPicked] = useState([])
  const [extra, setExtra] = useState({
    category: 'product',
    description: '',
    quantity: '1',
    unitPrice: '',
    dueDate: '',
  })
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [payReference, setPayReference] = useState('')
  const [openId, setOpenId] = useState(null)
  const [planAmount1, setPlanAmount1] = useState('2000.00')
  const [planAmount2, setPlanAmount2] = useState('2000.00')
  const [planDue1, setPlanDue1] = useState('')
  const [planDue2, setPlanDue2] = useState('')
  const [planDescription, setPlanDescription] = useState('Agreed instalments')
  const [recipientType, setRecipientType] = useState('')
  const [sendIds, setSendIds] = useState([])
  const [sendPreview, setSendPreview] = useState(null)
  const [sendResend, setSendResend] = useState(false)
  const [sendKey, setSendKey] = useState(null)
  const [sendResult, setSendResult] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const list = await paymentsApi.getInvoices({ studentId: studentId || undefined, recipientType: recipientType || undefined })
      setInvoices(list)
      if (!readOnly) {
        const ob = await paymentsApi.getObligations()
        setObligations(ob.obligations || [])
      }
    } catch (e) {
      setError(e.message || 'Could not load invoices')
    } finally {
      setLoading(false)
    }
  }, [readOnly, studentId, recipientType])

  useEffect(() => {
    void load()
  }, [load])

  function toggleSend(id) {
    setSendIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    setSendPreview(null)
    setSendResult(null)
    setSendKey(null)
  }

  async function previewSend() {
    setBusy(true)
    setError('')
    try {
      const preview = await paymentsApi.previewInvoiceSend(sendIds)
      setSendPreview(preview)
      setSendResult(null)
      setSendKey(newKey())
    } catch (e) {
      setError(e.message || 'Could not preview send')
    } finally {
      setBusy(false)
    }
  }

  async function confirmSend(retryFailed) {
    setBusy(true)
    setError('')
    try {
      const key = retryFailed ? sendKey : sendKey || newKey()
      const result = await paymentsApi.sendInvoices(
        { invoiceIds: sendIds, resend: retryFailed ? false : sendResend },
        key,
      )
      setSendKey(key)
      setSendResult(result)
      await load()
    } catch (e) {
      setError(e.message || 'Could not send invoices')
    } finally {
      setBusy(false)
    }
  }

  const students = useMemo(() => {
    const map = new Map()
    for (const ob of obligations) {
      if (!ob.student_id) continue
      map.set(ob.student_id, ob.student_name || ob.full_name || ob.student_id)
    }
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [obligations])

  const studentCharges = obligations.filter(
    (ob) => ob.student_id === selectedStudent && !ob.cancelled_at,
  )

  async function createAndIssue() {
    setBusy(true)
    setError('')
    try {
      const lines = picked.map((id) => ({ obligationId: id }))
      if (extra.description && extra.unitPrice && extra.dueDate) {
        lines.push({
          category: extra.category,
          description: extra.description,
          quantity: Number(extra.quantity || 1),
          unitPrice: extra.unitPrice,
          dueDate: extra.dueDate,
        })
      }
      if (!selectedStudent || lines.length === 0) {
        setError('Choose a student and at least one charge or a new line.')
        return
      }
      const draft = await paymentsApi.createInvoice({
        studentId: selectedStudent,
        lines,
        clientMutationId: newKey(),
      })
      await paymentsApi.issueInvoice({ invoiceId: draft.id, clientMutationId: newKey() })
      setPicked([])
      setExtra({ category: 'product', description: '', quantity: '1', unitPrice: '', dueDate: '' })
      await load()
    } catch (e) {
      setError(e.message || 'Could not issue the invoice')
    } finally {
      setBusy(false)
    }
  }

  async function createPlan() {
    setBusy(true)
    setError('')
    try {
      await paymentsApi.createInstalmentPlan({
        studentId: selectedStudent,
        description: planDescription,
        instalments: [
          { amount: planAmount1, dueDate: planDue1 },
          { amount: planAmount2, dueDate: planDue2 },
        ],
        clientMutationId: newKey(),
      })
      await load()
    } catch (e) {
      setError(e.message || 'Could not create the instalment plan')
    } finally {
      setBusy(false)
    }
  }

  async function recordPayment(invoiceId) {
    setBusy(true)
    setError('')
    try {
      await paymentsApi.recordInvoicePayment({
        invoiceId,
        amount: payAmount,
        method: payMethod,
        reference: payReference,
        clientMutationId: newKey(),
      })
      setPayAmount('')
      await load()
    } catch (e) {
      setError(e.message || 'Payment was not recorded')
    } finally {
      setBusy(false)
    }
  }

  async function openPdf(invoiceId, invoiceNumber) {
    const blob = await paymentsApi.downloadInvoicePdf(invoiceId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceNumber || 'invoice'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <CSpinner size="sm" />

  return (
    <CCard className="shadow-sm mb-4">
      <CCardHeader className="fw-semibold">Invoices</CCardHeader>
      <CCardBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        {canIssue ? (
          <div className="mb-4">
            <BulkInvoiceComposer onIssued={load} />
            <div className="small text-body-secondary mb-2">
              Or bill one student from charges that already exist. Referencing tuition does not create a second debt.
            </div>
            <CFormSelect
              className="mb-2"
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value)
                setPicked([])
              }}
            >
              <option value="">Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </CFormSelect>
            {studentCharges.map((ob) => (
              <label key={ob.id} className="d-flex gap-2 small mb-1">
                <input
                  type="checkbox"
                  checked={picked.includes(ob.id)}
                  onChange={(e) =>
                    setPicked((prev) =>
                      e.target.checked ? [...prev, ob.id] : prev.filter((id) => id !== ob.id),
                    )
                  }
                />
                <span>
                  {ob.charge_category || 'tuition'} · {ob.period_month} · {money(ob.amount_due)} · due {formatDueShort(ob.due_date)}
                </span>
              </label>
            ))}
            <div className="d-flex flex-wrap gap-2 mt-2">
              <CFormSelect
                value={extra.category}
                onChange={(e) => setExtra({ ...extra, category: e.target.value })}
              >
                <option value="tuition">Tuition</option>
                <option value="product">Product</option>
                <option value="custom">Custom charge</option>
                <option value="event">Event-related charge</option>
              </CFormSelect>
              <CFormInput
                placeholder="Description"
                value={extra.description}
                onChange={(e) => setExtra({ ...extra, description: e.target.value })}
              />
              <CFormInput
                placeholder="Qty"
                value={extra.quantity}
                onChange={(e) => setExtra({ ...extra, quantity: e.target.value })}
                style={{ maxWidth: 80 }}
              />
              <CFormInput
                placeholder="Unit price"
                value={extra.unitPrice}
                onChange={(e) => setExtra({ ...extra, unitPrice: e.target.value })}
              />
              <CFormInput
                type="date"
                value={extra.dueDate}
                onChange={(e) => setExtra({ ...extra, dueDate: e.target.value })}
              />
            </div>
            <CButton className="mt-2" color="primary" size="sm" disabled={busy} onClick={createAndIssue}>
              Issue invoice
            </CButton>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <CFormInput
                placeholder="Agreement"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
              />
              <CFormInput placeholder="First amount" value={planAmount1} onChange={(e) => setPlanAmount1(e.target.value)} style={{ maxWidth: 140 }} />
              <CFormInput type="date" value={planDue1} onChange={(e) => setPlanDue1(e.target.value)} />
              <CFormInput placeholder="Second amount" value={planAmount2} onChange={(e) => setPlanAmount2(e.target.value)} style={{ maxWidth: 140 }} />
              <CFormInput type="date" value={planDue2} onChange={(e) => setPlanDue2(e.target.value)} />
              <CButton
                color="primary"
                size="sm"
                variant="outline"
                disabled={busy || !selectedStudent || !planDue1 || !planDue2}
                onClick={createPlan}
              >
                Create instalment plan
              </CButton>
            </div>
            <div className="small text-body-secondary mt-1">
              The instalment amounts are the only debt. A future date is not overdue today.
            </div>
          </div>
        ) : null}
        {canIssue ? (
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-2 mb-2">
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                disabled={busy || sendIds.length === 0}
                onClick={() => previewSend()}
              >
                Preview send
              </CButton>
              <CButton color="primary" size="sm" disabled={busy || !sendPreview || sendIds.length === 0} onClick={() => confirmSend(false)}>
                Send invoices
              </CButton>
              {sendResult?.failed > 0 ? (
                <CButton color="warning" size="sm" disabled={busy} onClick={() => confirmSend(true)}>
                  Retry failed
                </CButton>
              ) : null}
            </div>
            <label className="small d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={sendResend}
                onChange={(e) => {
                  setSendResend(e.target.checked)
                  setSendKey(newKey())
                }}
              />
              Send again to recipients the provider already accepted
            </label>
            {sendPreview ? (
              <div className="border rounded p-2 mt-2 small">
                {sendPreview.items.map((item) => (
                  <div key={item.invoiceId} className="mb-2">
                    <div className="fw-semibold">
                      {item.invoiceNumber || 'Invoice'} · {item.recipientName || 'Unknown recipient'}
                    </div>
                    <div>
                      {item.email ? `To ${item.email}` : 'No recipient selected'}
                      {item.warning ? ` · ${item.warning}` : ''}
                    </div>
                    {item.candidateEmails?.length > 1 ? (
                      <div className="text-body-secondary">Contacts: {item.candidateEmails.join(', ')}</div>
                    ) : null}
                    <div className="text-body-secondary">{deliveryLabel(item.delivery?.status)}</div>
                  </div>
                ))}
                <div className="text-body-secondary">Check the recipients, then send. Issuing an invoice does not send email.</div>
              </div>
            ) : null}
            {sendResult ? (
              <div className="small mt-2">
                Accepted {sendResult.providerAccepted} · Failed {sendResult.failed} · Skipped {sendResult.skipped}
                {(sendResult.items || []).filter((item) => item.reason).map((item) => (
                  <div key={`${item.invoiceId}-reason`}>{item.invoiceNumber || item.recipientName}: {item.reason}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <CFormSelect className="mb-2" value={recipientType} onChange={(e) => setRecipientType(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">All recipients</option>
          <option value="student">Students</option>
          <option value="external">External customers</option>
        </CFormSelect>
        {invoices.length === 0 ? (
          <div className="text-body-secondary small">No invoices yet.</div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="border-bottom py-2">
              <div className="d-flex justify-content-between gap-2">
                <div className="d-flex gap-2">
                  {canIssue && inv.status === 'issued' ? (
                    <input
                      type="checkbox"
                      aria-label={`Select ${inv.invoiceNumber || 'invoice'}`}
                      checked={sendIds.includes(inv.id)}
                      onChange={() => toggleSend(inv.id)}
                    />
                  ) : null}
                  <div>
                  <div className="fw-semibold">
                    {inv.invoiceNumber || 'Draft'} · {inv.studentName}
                  </div>
                  <div className="small text-body-secondary">
                    Billed {money(inv.billedAmount)} · Concession {money(inv.waivedAmount)} · Collected {money(inv.cashCollected)} · Remaining {money(inv.outstandingAmount)} · {inv.paymentStatus || inv.status}
                    {inv.status === 'issued' ? ` · ${deliveryLabel(inv.delivery?.status)}` : ''}
                  </div>
                  </div>
                </div>
                <CButton color="link" size="sm" onClick={() => setOpenId(openId === inv.id ? null : inv.id)}>
                  Details
                </CButton>
              </div>
              {openId === inv.id ? (
                <div className="mt-2">
                  {(inv.lines || []).map((line) => (
                    <div key={line.id} className="small">
                      {line.description} · {line.category} · qty {line.quantity} · due {formatDueShort(line.dueDate)} · {money(line.amount)} · remaining {money(line.outstandingAmount)}
                    </div>
                  ))}
                  {inv.status === 'issued' ? (
                    <InvoiceActions
                      invoice={inv}
                      readOnly={readOnly}
                      canIssue={canIssue}
                      busy={busy}
              payAmount={payAmount}
              setPayAmount={setPayAmount}
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              payReference={payReference}
              setPayReference={setPayReference}
              onPay={() => recordPayment(inv.id)}
                      onPdf={() => openPdf(inv.id, inv.invoiceNumber)}
                      onReload={load}
                      onError={setError}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CCardBody>
    </CCard>
  )
}
