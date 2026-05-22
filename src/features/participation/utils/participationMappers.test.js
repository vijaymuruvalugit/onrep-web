import { describe, expect, it } from 'vitest'
import {
  buildParticipationTimeline,
  mapRowToParticipationEvent,
  summarizeParticipation,
} from './participationMappers'

describe('participationMappers', () => {
  it('maps present and absent rows', () => {
    const event = mapRowToParticipationEvent({
      id: '1',
      status: 'PRESENT',
      sessionTitle: 'Morning batch',
      markedAt: '2026-05-01',
    })
    expect(event.status).toBe('present')
    expect(event.sessionTitle).toBe('Morning batch')
  })

  it('summarizes timeline consistency', () => {
    const events = buildParticipationTimeline([
      { id: '1', status: 'PRESENT' },
      { id: '2', status: 'PRESENT' },
      { id: '3', status: 'ABSENT' },
    ])
    const summary = summarizeParticipation(events)
    expect(summary.total).toBe(3)
    expect(summary.attended).toBe(2)
    expect(summary.missed).toBe(1)
    expect(summary.rate).toBe(67)
    expect(summary.streak).toBe(2)
  })
})
