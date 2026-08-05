import React from 'react'
import { Link } from 'react-router-dom'
import FeePayoutSetupCard from '../components/coach/FeePayoutSetupCard'

/** @deprecated Prefer Payment settings — kept so old nav links still work. */
export default function PayoutDetailsPage() {
  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-2">Receive payments</h2>
      <p className="text-body-secondary small mb-3">
        Add a UPI ID or bank account and save once.{' '}
        <Link to="/coach/payments/settings">Open full payment settings</Link>
      </p>
      <FeePayoutSetupCard />
    </div>
  )
}
