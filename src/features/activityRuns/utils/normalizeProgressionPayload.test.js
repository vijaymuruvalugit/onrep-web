import { describe, it, expect } from 'vitest'
import {
  coerceStopwatchTiming,
  normalizeProgressionPayload,
  getTimingMetrics,
  sanitizeTimingMetrics,
} from './normalizeProgressionPayload'
import { resolveActivityExperience } from './activityExperience'
import { getActivityRunDefinition } from '../activityRunDefinitions'

describe('normalizeProgressionPayload', () => {
  it('maps legacy laps into metrics on progress_events', () => {
    const out = normalizeProgressionPayload({
      payload_version: 1,
      results: [
        {
          student_id: 'a',
          laps: [{ lap_number: 1, split_time_ms: 5000 }],
        },
      ],
    })
    expect(out.payload_version).toBe(2)
    expect(out.results[0].progress_events[0].metrics.split_time_ms).toBe(5000)
  })

  it('getTimingMetrics returns null for non-timing metrics', () => {
    expect(getTimingMetrics({ metrics: { rating: 3 } })).toBeNull()
  })

  it('coerceStopwatchTiming rejects invalid and enforces minimum 1ms', () => {
    expect(coerceStopwatchTiming({ splitTimeMs: 0, cumulativeTimeMs: 100 })).toEqual({
      split_time_ms: 100,
      cumulative_time_ms: 100,
    })
    expect(coerceStopwatchTiming({ splitTimeMs: 500, cumulativeTimeMs: 1200 })).toEqual({
      split_time_ms: 500,
      cumulative_time_ms: 1200,
    })
    expect(coerceStopwatchTiming(null)).toBeNull()
  })

  it('sanitizeTimingMetrics drops zero split_time_ms', () => {
    expect(sanitizeTimingMetrics({ split_time_ms: 0, cumulative_time_ms: 800 })).toEqual({
      cumulative_time_ms: 800,
      split_time_ms: 800,
    })
  })
})

describe('activityExperience', () => {
  it('HEAT_RACE uses Record label', () => {
    const exp = resolveActivityExperience(getActivityRunDefinition('HEAT_RACE'), {
      current: 1,
      target: 5,
    })
    expect(exp.captureProgressLabel).toBe('Record')
    expect(exp.startActionLabel).toBe('Start Race')
  })
})
