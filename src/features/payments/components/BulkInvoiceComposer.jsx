import React, { useEffect, useState } from 'react'
import { CAlert, CButton, CFormInput, CFormSelect } from '@coreui/react'
import paymentsApi from '../api/paymentsApi'
import { listActivities } from '../../workspace/api/activitiesApi'
import { batchesApi } from '../../batches/api/batchesApi'

function newKey() {
  return crypto.randomUUID()
}

export default function BulkInvoiceComposer({ onIssued }) {
  const [query, setQuery] = useState('')
  const [activityId, setActivityId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [status, setStatus] = useState('active')
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState([])
  const [line, setLine] = useState({
    category: 'custom', description: '', quantity: '1', unitPrice: '', dueDate: '', periodMonth: '',
  })
  const [overrideAmount, setOverrideAmount] = useState('')
  const [overrideId, setOverrideId] = useState('')
  const [customer, setCustomer] = useState({ customerType: 'individual', name: '', email: '' })
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [batches, setBatches] = useState([])

  useEffect(() => {
    let cancelled = false
    listActivities()
      .then((rows) => { if (!cancelled) setActivities(rows) })
      .catch(() => {})
    batchesApi.listBatches()
      .then((data) => { if (!cancelled) setBatches(data.batches || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const visibleBatches = activityId
    ? batches.filter((row) => String(row.activityId || row.activity_id || '') === activityId)
    : batches

  async function search() {
    setLoading(true)
    setError('')
    try {
      const data = await paymentsApi.searchInvoiceRecipients({
        q: query || undefined,
        activityId: activityId || undefined,
        batchId: batchId || undefined,
        status: status || undefined,
      })
      const rows = [
        ...(data.students || []),
        ...(data.customers || []),
      ]
      setMatches(rows)
    } catch (e) {
      setError(e.message || 'Could not search recipients')
    } finally {
      setLoading(false)
    }
  }

  function toggle(row) {
    setPreview(null)
    setSelected((prev) => {
      const exists = prev.some((item) => item.kind === row.kind && item.id === row.id)
      return exists ? prev.filter((item) => !(item.kind === row.kind && item.id === row.id)) : [...prev, row]
    })
  }

  function selectAll() {
    setPreview(null)
    setSelected(matches)
  }

  function commonLine() {
    return {
      category: line.category,
      description: line.description,
      quantity: Number(line.quantity || 1),
      unitPrice: line.unitPrice,
      dueDate: line.dueDate,
      periodMonth: line.periodMonth || undefined,
      referenceExistingTuition: line.category === 'tuition' && !line.unitPrice,
    }
  }

  function payload() {
    const overrides = []
    if (overrideId && overrideAmount) {
      const target = selected.find((row) => row.id === overrideId)
      if (target) {
        overrides.push({
          kind: target.kind,
          id: target.id,
          lines: [{ ...commonLine(), unitPrice: overrideAmount, referenceExistingTuition: false }],
        })
      }
    }
    return { recipients: selected.map((row) => ({ kind: row.kind, id: row.id })), lines: [commonLine()], overrides }
  }

  async function runPreview() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      if (selected.length === 0) {
        setError('Choose at least one recipient.')
        return
      }
      const next = await paymentsApi.previewBulkInvoices(payload())
      setPreview(next.preview || next)
    } catch (e) {
      setError(e.message || 'Could not preview invoices')
    } finally {
      setBusy(false)
    }
  }

  async function issue() {
    setBusy(true)
    setError('')
    try {
      const out = await paymentsApi.issueBulkInvoices(payload(), newKey())
      setResult(out)
      setPreview(null)
      if (onIssued) await onIssued()
    } catch (e) {
      setError(e.message || 'Could not issue invoices')
    } finally {
      setBusy(false)
    }
  }

  async function addCustomer() {
    setBusy(true)
    setError('')
    try {
      const out = await paymentsApi.createCustomer(customer, newKey())
      const id = out.customer?.id || out.customerId
      if (id) {
        const row = { kind: 'customer', id, name: customer.name }
        setSelected((prev) => [...prev, row])
        setMatches((prev) => [...prev, row])
        setCustomer({ customerType: 'individual', name: '', email: '' })
      }
    } catch (e) {
      setError(e.message || 'Could not add the customer')
    } finally {
      setBusy(false)
    }
  }

  async function downloadZip() {
    if (!result?.batchId) return
    const blob = await paymentsApi.downloadBulkInvoicePdf(result.batchId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mb-4">
      <div className="small text-body-secondary mb-2">
        Create a separate invoice for each recipient. Issuing does not email or send the invoice.
      </div>
      {error ? <CAlert color="warning">{error}</CAlert> : null}
      <div className="d-flex flex-wrap gap-2 mb-2">
        <CFormInput placeholder="Search name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <CFormSelect value={activityId} onChange={(e) => { setActivityId(e.target.value); setBatchId('') }} style={{ maxWidth: 200 }}>
          <option value="">All activities</option>
          {activities.map((row) => (
            <option key={row.id} value={row.id}>{row.name}</option>
          ))}
        </CFormSelect>
        <CFormSelect value={batchId} onChange={(e) => setBatchId(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All batches</option>
          {visibleBatches.map((row) => (
            <option key={row.id} value={row.id}>{row.name}</option>
          ))}
        </CFormSelect>
        <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="active">Active students</option>
          <option value="">Any status</option>
        </CFormSelect>
        <CButton color="secondary" size="sm" variant="outline" disabled={loading} onClick={search}>
          {loading ? 'Searching…' : 'Search'}
        </CButton>
        <CButton color="secondary" size="sm" variant="outline" disabled={matches.length === 0} onClick={selectAll}>
          Select all matching ({matches.length})
        </CButton>
      </div>
      {matches.map((row) => (
        <label key={`${row.kind}:${row.id}`} className="d-flex gap-2 small mb-1">
          <input
            type="checkbox"
            checked={selected.some((item) => item.kind === row.kind && item.id === row.id)}
            onChange={() => toggle(row)}
          />
          <span>{row.name} · {row.kind === 'customer' ? 'External customer' : 'Student'}</span>
        </label>
      ))}
      <div className="small mb-2">Selected {selected.length}</div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {selected.map((row) => (
          <CButton key={`${row.kind}:${row.id}`} color="light" size="sm" onClick={() => toggle(row)}>
            Remove {row.name}
          </CButton>
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2">
        <CFormSelect value={line.category} onChange={(e) => setLine({ ...line, category: e.target.value })}>
          <option value="tuition">Tuition</option>
          <option value="product">Product</option>
          <option value="custom">Custom service</option>
          <option value="event">Event-related charge</option>
        </CFormSelect>
        <CFormInput placeholder="Description" value={line.description} onChange={(e) => setLine({ ...line, description: e.target.value })} />
        <CFormInput placeholder="Qty" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: e.target.value })} style={{ maxWidth: 80 }} />
        <CFormInput placeholder="Unit price" value={line.unitPrice} onChange={(e) => setLine({ ...line, unitPrice: e.target.value })} />
        <CFormInput type="date" value={line.dueDate} onChange={(e) => setLine({ ...line, dueDate: e.target.value })} />
        <CFormInput placeholder="Period YYYY-MM" value={line.periodMonth} onChange={(e) => setLine({ ...line, periodMonth: e.target.value })} />
      </div>
      <div className="d-flex flex-wrap gap-2 mt-2">
        <CFormSelect value={overrideId} onChange={(e) => setOverrideId(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">No amount override</option>
          {selected.map((row) => (
            <option key={row.id} value={row.id}>{row.name}</option>
          ))}
        </CFormSelect>
        <CFormInput placeholder="Override unit price" value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)} style={{ maxWidth: 180 }} />
      </div>
      <div className="d-flex flex-wrap gap-2 mt-3">
        <CFormSelect value={customer.customerType} onChange={(e) => setCustomer({ ...customer, customerType: e.target.value })} style={{ maxWidth: 180 }}>
          <option value="individual">Individual</option>
          <option value="organisation">Organisation</option>
        </CFormSelect>
        <CFormInput placeholder="New customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <CFormInput placeholder="Email optional" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        <CButton color="secondary" size="sm" variant="outline" disabled={busy || !customer.name} onClick={addCustomer}>
          Add external customer
        </CButton>
      </div>
      <div className="d-flex gap-2 mt-3">
        <CButton color="secondary" size="sm" variant="outline" disabled={busy} onClick={runPreview}>Preview invoices</CButton>
        <CButton color="primary" size="sm" disabled={busy || !preview} onClick={issue}>Issue invoices</CButton>
      </div>
      {preview ? (
        <div className="small mt-3">
          <div className="fw-semibold">{preview.invoiceCount} invoice{preview.invoiceCount === 1 ? '' : 's'} ready</div>
          {preview.invoices.map((row) => (
            <div key={`${row.recipient.kind}:${row.recipient.id}`} className="border-bottom py-1">
              {row.recipient.name} · {row.status} · {row.amount} · due {row.dueDate || '-'}
              {row.warnings?.length ? ` · ${row.warnings.join(' ')}` : ''}
              {row.reason ? ` · ${row.reason}` : ''}
            </div>
          ))}
        </div>
      ) : null}
      {result ? (
        <CAlert color={result.failed ? 'warning' : 'success'} className="mt-3 mb-0">
          Issued {result.issued}. Failed {result.failed}. Skipped {result.skipped}. These invoices were not sent.
          {result.items?.filter((row) => row.reason).map((row) => (
            <div key={`${row.recipient.kind}:${row.recipient.id}`}>{row.recipient.name || row.recipient.id}: {row.reason}</div>
          ))}
          {result.issued > 0 ? (
            <div className="mt-2">
              <CButton color="secondary" size="sm" variant="outline" onClick={downloadZip}>Download invoice PDFs</CButton>
            </div>
          ) : null}
        </CAlert>
      ) : null}
    </div>
  )
}
