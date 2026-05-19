import { describe, expect, it } from 'vitest'
import { inlineCaptureItemsForCard } from './phaseCaptureDisplay'

describe('inlineCaptureItemsForCard', () => {
  const items = [
    {
      id: '1',
      fieldType: 'tags',
      configurationJson: { displayTier: 'inline' },
    },
    {
      id: '2',
      fieldType: 'rating',
      configurationJson: { displayTier: 'inline' },
    },
    {
      id: '3',
      fieldType: 'rating',
      configurationJson: { displayTier: 'inline' },
    },
  ]

  it('fast mode returns tags only', () => {
    const out = inlineCaptureItemsForCard(items, { captureMode: 'fast', coachDefaults: {} })
    expect(out.every((i) => i.fieldType === 'tags')).toBe(true)
  })

  it('full mode allows one inline rating', () => {
    const out = inlineCaptureItemsForCard(items, { captureMode: 'full', coachDefaults: {} })
    expect(out.filter((i) => i.fieldType === 'rating').length).toBe(1)
  })
})
