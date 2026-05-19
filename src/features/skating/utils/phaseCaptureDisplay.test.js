import { describe, expect, it } from 'vitest'
import {
  buildObservationSummary,
  deepLayerItems,
  inlineCaptureItemsForCard,
  quickLayerItems,
} from './phaseCaptureDisplay'

describe('quickLayerItems', () => {
  const items = [
    {
      id: '1',
      fieldType: 'tags',
      label: 'Errors',
      configurationJson: { primary: true, displayTier: 'inline' },
    },
    {
      id: '2',
      fieldType: 'rating',
      label: 'Balance',
      configurationJson: { primary: true, displayTier: 'inline' },
    },
    {
      id: '3',
      fieldType: 'rating',
      label: 'Edge',
      configurationJson: { primary: false, displayTier: 'drawer' },
    },
    {
      id: '4',
      fieldType: 'note',
      fieldKey: 'coach_note',
      label: 'Note',
      configurationJson: { primary: true, quickNote: true },
    },
    {
      id: '5',
      fieldType: 'counter',
      label: 'Laps',
      configurationJson: { primary: false },
    },
  ]

  it('returns primary tags, rating, and quick note only', () => {
    const quick = quickLayerItems(items)
    expect(quick.map((i) => i.id)).toEqual(['1', '2', '4'])
  })

  it('deep layer excludes quick items', () => {
    const deep = deepLayerItems(items)
    expect(deep.map((i) => i.id)).toEqual(['3', '5'])
  })
})

describe('inlineCaptureItemsForCard', () => {
  const items = [
    {
      id: '1',
      fieldType: 'tags',
      configurationJson: { primary: true, displayTier: 'inline' },
    },
    {
      id: '2',
      fieldType: 'rating',
      configurationJson: { primary: true, displayTier: 'inline' },
    },
  ]

  it('quick capture mode returns tags only', () => {
    const out = inlineCaptureItemsForCard(items, { captureMode: 'fast', coachDefaults: {} })
    expect(out.every((i) => i.fieldType === 'tags')).toBe(true)
  })
})

describe('buildObservationSummary', () => {
  it('shows tag labels when present', () => {
    const text = buildObservationSummary(
      [{ athleteId: 'a1', fieldId: '1', valueJson: { values: ['Weak push'] } }],
      'a1',
      [
        {
          id: '1',
          fieldType: 'tags',
          configurationJson: { primary: true, displayTier: 'inline' },
        },
      ],
    )
    expect(text).toContain('Weak push')
  })
})
