import { describe, expect, it } from 'vitest'
import {
  LIVE_WORDS_MAX,
  assertLiveLabel,
  getLiveUiProfile,
  livePhaseLabel,
  liveLabel,
} from './coachLiveLabels'

describe('coachLiveLabels', () => {
  it('LIVE_WORDS_MAX is 2', () => {
    expect(LIVE_WORDS_MAX).toBe(2)
  })

  it('liveLabel returns ≤2 word strings for known keys', () => {
    for (const key of ['coachNow', 'pickAthlete', 'time', 'score', 'progress']) {
      const words = liveLabel(key).split(/\s+/).filter(Boolean)
      expect(words.length).toBeLessThanOrEqual(2)
    }
  })

  it('livePhaseLabel maps block types without KPI', () => {
    expect(livePhaseLabel('technical')).toBe('Skills')
    expect(livePhaseLabel('conditioning')).toBe('Fitness')
    expect(livePhaseLabel('assessment')).toBe('Score')
    expect(livePhaseLabel('assessment')).not.toMatch(/KPI/i)
  })

  it('assertLiveLabel does not throw on valid labels', () => {
    expect(assertLiveLabel('Tap score')).toBe('Tap score')
  })

  it('getLiveUiProfile race mode hides quick scores but keeps intelligence tabs', () => {
    const p = getLiveUiProfile('practice', true, 'race')
    expect(p.showRaceTiming).toBe(true)
    expect(p.showQuickScores).toBe(false)
    expect(p.showIntelligenceTabs).toBe(true)
    expect(p.intelligenceTabKeys).toContain('skills')
  })

  it('getLiveUiProfile assessment shows score grid collapsed by default', () => {
    const p = getLiveUiProfile('assessment', false)
    expect(p.formalScoreExpanded).toBe(false)
    expect(p.showFormalScoreGrid).toBe(true)
  })

  it('getLiveUiProfile practice defaults', () => {
    const p = getLiveUiProfile('practice', false)
    expect(p.showQuickScores).toBe(true)
    expect(p.timeExpanded).toBe(false)
    expect(p.intelligenceTabKeys).toContain('skills')
  })
})
