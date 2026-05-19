import { describe, it, expect } from 'vitest'
import {
  normalizeProgressionPayload,
  getTimingMetrics,
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
})

describe('activityExperience', () => {
  it('HEAT_RACE uses Capture Lap label', () => {
    const exp = resolveActivityExperience(getActivityRunDefinition('HEAT_RACE'), {
      current: 1,
      target: 5,
    })
    expect(exp.captureProgressLabel).toBe('Capture Lap')
  })
})
