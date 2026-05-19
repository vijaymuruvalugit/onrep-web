import React, { useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import StopwatchPrimitive from '../components/primitives/StopwatchPrimitive'
import RankingPrimitive from '../components/primitives/RankingPrimitive'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import RunResultsCard from '../components/RunResultsCard'
import { buildRunPayload, participationMeta } from '../utils/buildRunPayload'

export default function HeatFlow({
  definition,
  athletes,
  disabled,
  busy,
  heatNumber = 1,
  onSaveRun,
}) {
  const [selectedIds, setSelectedIds] = useState([])
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [heatActive, setHeatActive] = useState(false)

  const buildResultsFromOrder = (order, timesByStudent = {}) =>
    order.map((studentId, i) => ({
      student_id: studentId,
      finish_order: i + 1,
      time_ms: timesByStudent[studentId] ?? null,
      ...participationMeta(),
    }))

  const handleFinishOrder = async (order) => {
    const next = buildResultsFromOrder(order)
    setResults(next)
  }

  const handleStopwatch = (timeMs) => {
    if (selectedIds.length !== 1) return
    const sid = selectedIds[0]
    setResults((prev) => {
      const existing = prev.find((r) => String(r.student_id) === sid)
      if (existing) {
        return prev.map((r) =>
          String(r.student_id) === sid ? { ...r, time_ms: timeMs } : r,
        )
      }
      return [
        ...prev,
        {
          student_id: sid,
          finish_order: prev.length + 1,
          time_ms: timeMs,
          ...participationMeta(),
        },
      ]
    })
  }

  const saveHeat = async () => {
    setError('')
    try {
      const payload = buildRunPayload('HEAT_RACE', {
        heat_number: heatNumber,
        results,
      })
      await onSaveRun?.('HEAT_RACE', payload)
      setResults([])
      setSelectedIds([])
      setHeatActive(false)
    } catch (e) {
      setError(e?.message || 'Could not save heat')
    }
  }

  if (!heatActive) {
    return (
      <div className="heat-flow">
        <p className="small text-body-secondary mb-2">Select athletes for this heat</p>
        <AthleteSelectionGrid
          athletes={athletes}
          selectedIds={selectedIds}
          disabled={disabled}
          multi
          onSelect={(sid) => {
            setSelectedIds((prev) =>
              prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
            )
          }}
        />
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100 mt-3 activity-runs-sticky-action"
          disabled={disabled || selectedIds.length < 2}
          onClick={() => setHeatActive(true)}
        >
          Start heat
        </CButton>
      </div>
    )
  }

  return (
    <div className="heat-flow">
      <p className="fw-semibold mb-2">Heat {heatNumber}</p>
      {definition.capabilities.timing ? (
        <StopwatchPrimitive disabled={disabled} onStopMs={handleStopwatch} className="mb-3" />
      ) : null}
      {definition.capabilities.ranking ? (
        <RankingPrimitive
          athletes={athletes.filter((a) =>
            selectedIds.includes(String(a.studentId || a.id)),
          )}
          disabled={disabled}
          busy={busy}
          onSubmitOrder={handleFinishOrder}
        />
      ) : null}
      <RunResultsCard
        results={results.map((r) => {
          const a = athletes.find((x) => String(x.studentId || x.id) === String(r.student_id))
          return {
            ...r,
            student_name: a?.fullName || a?.full_name,
          }
        })}
      />
      {error ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {error}
        </CAlert>
      ) : null}
      <div className="activity-runs-sticky-bar d-flex gap-2 mt-3">
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="flex-grow-1"
          disabled={disabled || busy || results.length < 1}
          onClick={() => void saveHeat()}
        >
          Save heat
        </CButton>
        <CButton type="button" color="light" size="lg" disabled={disabled} onClick={() => setHeatActive(false)}>
          Cancel
        </CButton>
      </div>
    </div>
  )
}
