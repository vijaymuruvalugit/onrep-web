import React from 'react'
import PayoutDetailsCard from '../components/coach/PayoutDetailsCard'

export default function PayoutDetailsPage() {
  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-2">Payout details</h2>
      <p className="text-body-secondary small mb-3">
        Choose how OnRep should pay out your academy. These same details also appear in Payment
        settings.
      </p>
      <PayoutDetailsCard />
    </div>
  )
}
