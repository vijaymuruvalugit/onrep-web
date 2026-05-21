import { describe, expect, it } from 'vitest'
import { sessionOperationalContextLine } from './sessionDisplay'

describe('sessionOperationalContextLine', () => {
  it('joins specialization, surface, and session mode', () => {
    const line = sessionOperationalContextLine({
      academySubActivityName: 'Inline Speed',
      surfaceProfile: { type: 'RINK' },
      sessionMode: 'practice',
    })
    expect(line).toBe('Inline Speed • Rink • Practice')
  })

  it('returns null when no context fields', () => {
    expect(sessionOperationalContextLine({})).toBeNull()
    expect(sessionOperationalContextLine(null)).toBeNull()
  })
})
