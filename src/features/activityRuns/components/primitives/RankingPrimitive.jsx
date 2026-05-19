import React, { useCallback, useState } from 'react'
import { CButton } from '@coreui/react'

/** Tap athletes in finish order (1st → last). */
export default function RankingPrimitive({ athletes = [], disabled, busy, onSubmitOrder }) {
  const [order, setOrder] = useState([])

  const toggle = useCallback(
    (id) => {
      if (disabled) return
      const sid = String(id)
      setOrder((prev) => {
        const i = prev.indexOf(sid)
        if (i >= 0) return prev.filter((x) => x !== sid)
        return [...prev, sid]
      })
    },
    [disabled],
  )

  const submit = () => {
    if (order.length < 1) return
    onSubmitOrder?.(order)
    setOrder([])
  }

  return (
    <div className="ranking-primitive">
      <p className="small text-body-secondary mb-2">Tap finish order (1st → last)</p>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {athletes.map((a) => {
          const sid = String(a.studentId || a.id)
          const pos = order.indexOf(sid)
          const selected = pos >= 0
          return (
            <CButton
              key={sid}
              type="button"
              size="lg"
              color={selected ? 'primary' : 'light'}
              className="ranking-primitive__btn"
              disabled={disabled || busy}
              onClick={() => toggle(sid)}
            >
              {selected ? <span className="me-1 fw-bold">{pos + 1}</span> : null}
              {a.fullName || a.full_name || 'Athlete'}
            </CButton>
          )
        })}
      </div>
      <div className="d-flex gap-2">
        <CButton type="button" color="primary" size="lg" disabled={disabled || busy || order.length < 1} onClick={submit}>
          Record order
        </CButton>
        <CButton type="button" color="light" size="lg" disabled={disabled || order.length < 1} onClick={() => setOrder([])}>
          Clear
        </CButton>
      </div>
    </div>
  )
}
