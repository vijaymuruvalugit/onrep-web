import { describe, expect, it } from 'vitest'
import {
  sliceUpcomingSessionsForDisplay,
  UPCOMING_SESSIONS_DISPLAY_CAP,
} from './sessionDisplay'

function row(id, sessionDate, startTime) {
  return { id, sessionId: id, sessionDate, startTime }
}

describe('sliceUpcomingSessionsForDisplay', () => {
  it('returns at most cap sessions when no day exceeds cap', () => {
    const rows = [
      row('1', '2026-05-19', '17:30'),
      row('2', '2026-05-20', '17:30'),
      row('3', '2026-05-21', '17:30'),
      row('4', '2026-05-22', '17:30'),
    ]
    expect(sliceUpcomingSessionsForDisplay(rows, 3)).toHaveLength(3)
    expect(sliceUpcomingSessionsForDisplay(rows, 3).map((r) => r.id)).toEqual(['1', '2', '3'])
  })

  it('includes every session on a day when that day has more than cap', () => {
    const rows = [
      row('a1', '2026-05-19', '05:00'),
      row('a2', '2026-05-19', '17:30'),
      row('b1', '2026-05-20', '05:00'),
      row('b2', '2026-05-20', '06:00'),
      row('b3', '2026-05-20', '17:30'),
      row('b4', '2026-05-20', '18:00'),
      row('b5', '2026-05-20', '19:00'),
    ]
    const out = sliceUpcomingSessionsForDisplay(rows, 3)
    expect(out.map((r) => r.id)).toEqual(['a1', 'a2', 'b1', 'b2', 'b3', 'b4', 'b5'])
  })

  it('uses default cap of 3', () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(String(i), `2026-05-${19 + i}`, '10:00'),
    )
    expect(sliceUpcomingSessionsForDisplay(rows)).toHaveLength(3)
    expect(UPCOMING_SESSIONS_DISPLAY_CAP).toBe(3)
  })
})
