import { describe, it, expect } from 'vitest'
import {
  EMPTY_SYNC_DOMAINS,
  extractSyncDomainsFromBundle,
  mergeSyncDomains,
} from './liveSessionSyncDomains'

describe('liveSessionSyncDomains', () => {
  it('extracts domains from bundle snapshot', () => {
    const extracted = extractSyncDomainsFromBundle({
      session: { id: 's1', opsState: 'active' },
      recentLaps: [{ id: 'l1' }],
      recentLapCount: 1,
      races: [{ id: 'r1' }],
      recentCoachingEvents: [{ studentId: 'a1' }],
    })
    expect(extracted.sessionMeta?.id).toBe('s1')
    expect(extracted.recentLaps).toHaveLength(1)
    expect(extracted.coachingEvents).toHaveLength(1)
  })

  it('mergeSyncDomains patches one domain without clearing others', () => {
    const prev = {
      ...EMPTY_SYNC_DOMAINS,
      recentLaps: [{ id: 'l1' }],
      races: [{ id: 'r1' }],
    }
    const next = mergeSyncDomains(prev, {
      leaderboard: { rows: [] },
    })
    expect(next.recentLaps).toHaveLength(1)
    expect(next.races).toHaveLength(1)
    expect(next.leaderboard).toEqual({ rows: [] })
  })

  it('mergeSyncDomains shallow-merges sessionMeta', () => {
    const prev = {
      ...EMPTY_SYNC_DOMAINS,
      sessionMeta: { id: 's1', placeName: 'Rink A' },
    }
    const next = mergeSyncDomains(prev, {
      sessionMeta: { opsState: 'active' },
    })
    expect(next.sessionMeta).toEqual({ id: 's1', placeName: 'Rink A', opsState: 'active' })
  })
})
