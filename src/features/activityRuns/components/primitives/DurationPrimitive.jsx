import React from 'react'
import StopwatchPrimitive from './StopwatchPrimitive'

/** Duration capture via stopwatch (pose hold, meditation). */
export default function DurationPrimitive({ disabled, onDurationMs }) {
  return (
    <StopwatchPrimitive disabled={disabled} onStopMs={onDurationMs} className="duration-primitive" />
  )
}
