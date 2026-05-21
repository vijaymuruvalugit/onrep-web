import React from 'react'
import PayoutDetailsCard from '../components/coach/PayoutDetailsCard'

export default function PayoutDetailsPage() {
  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-2">Payout details</h2>
      <p className="text-body-secondary small mb-3">
        Choose a bank account payout destination. If your academy UPI ID is already correct, you can
        use that from Payment settings instead.
      </p>
      <PayoutDetailsCard />
    </div>
  )
}
