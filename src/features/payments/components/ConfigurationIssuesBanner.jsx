import React, { useState } from 'react'
import { CAlert, CButton, CFormInput } from '@coreui/react'
import paymentsApi from '../api/paymentsApi'

function EnrolmentFeeForm({ issue, onResolved }) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const valid = /^\d+(\.\d{1,2})?$/.test(amount) && amount !== '0' && amount !== '0.00'

  const save = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      await paymentsApi.saveEnrolmentFee({
        assignmentId: issue.assignmentId,
        studentId: issue.studentId,
        activityId: issue.activityId,
        batchId: issue.batchId,
        amount,
      })
      setAmount('')
      if (onResolved) await onResolved()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not save the enrolment fee')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
      <CFormInput
        style={{ maxWidth: 160 }}
        value={amount}
        inputMode="decimal"
        placeholder="Enrolment fee"
        aria-label={`Enrolment fee for ${issue.batchName || 'batch'}`}
        onChange={(event) => setAmount(event.target.value)}
      />
      <CButton color="primary" size="sm" disabled={!valid || busy} onClick={save}>
        {busy ? 'Saving…' : 'Save enrolment fee'}
      </CButton>
      {error ? <span className="text-danger small">{error}</span> : null}
    </div>
  )
}

export default function ConfigurationIssuesBanner({ issues, onResolved }) {
  if (!issues?.length) return null
  return (
    <>
      {issues.map((issue) => (
        <CAlert key={`${issue.code}:${issue.studentId}:${issue.batchId || ''}`} color="warning" className="py-2">
          <div>{issue.message || issue.code}</div>
          {issue.code === 'ambiguous_student_fee_override' ? (
            <EnrolmentFeeForm issue={issue} onResolved={onResolved} />
          ) : null}
        </CAlert>
      ))}
    </>
  )
}
