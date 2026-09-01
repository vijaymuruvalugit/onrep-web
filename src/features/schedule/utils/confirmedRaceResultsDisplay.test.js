import { describe, expect, it } from 'vitest'
import {
  formatRacePlaceLabel,
  isRacePlaceSuppressed,
  racePlaceAmbiguityNote,
  resolveConfirmedRaceResultsPanelState,
} from './confirmedRaceResultsDisplay.js'

describe('confirmedRaceResultsDisplay (Slice 1E)', () => {
  it('suppresses confident place when too_close / place_suppressed', () => {
    expect(
      formatRacePlaceLabel({
        finishRank: 1,
        place_suppressed: true,
        place_note: 'Too close to call',
      }),
    ).toBe('—')
    expect(
      formatRacePlaceLabel({
        finish_rank: 2,
        meta: { too_close: true, place_suppressed: true },
      }),
    ).toBe('—')
    expect(isRacePlaceSuppressed({ finishRank: 1, too_close: true })).toBe(true)
    expect(racePlaceAmbiguityNote({ finishRank: 1, meta: { too_close: true } })).toBe(
      'Too close to call',
    )
  })

  it('shows rank when place is not ambiguous', () => {
    expect(formatRacePlaceLabel({ finishRank: 1 })).toBe('#1')
    expect(isRacePlaceSuppressed({ finishRank: 1 })).toBe(false)
    expect(racePlaceAmbiguityNote({ finishRank: 1 })).toBe(null)
  })

  it('differentiates loading, error, empty, and rows panel states', () => {
    expect(
      resolveConfirmedRaceResultsPanelState({ loading: true, error: null, rows: [] }),
    ).toBe('loading')
    expect(
      resolveConfirmedRaceResultsPanelState({
        loading: false,
        error: 'Could not load race results.',
        rows: [],
      }),
    ).toBe('error')
    expect(
      resolveConfirmedRaceResultsPanelState({ loading: false, error: null, rows: [] }),
    ).toBe('empty')
    expect(
      resolveConfirmedRaceResultsPanelState({
        loading: false,
        error: null,
        rows: [{ finishRank: 1 }],
      }),
    ).toBe('rows')
    // Loading wins over error/empty so a spinner is never mistaken for empty
    expect(
      resolveConfirmedRaceResultsPanelState({
        loading: true,
        error: 'stale',
        rows: [{ id: 'x' }],
      }),
    ).toBe('loading')
  })
})
