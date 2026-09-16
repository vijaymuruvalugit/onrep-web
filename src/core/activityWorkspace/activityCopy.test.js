/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { activityCopy, isMusicActivity, showSkatingSpecializationUi } from './activityCopy.js'

describe('activityCopy music', () => {
  it('reuses skating Batches / Coach chrome for music', () => {
    const c = activityCopy('music', 'private')
    expect(c.staff).toBe('Coach')
    expect(c.lesson).toBe('Session')
    expect(c.offeringPlural).toBe('Batches')
    expect(c.createOffering).toBe('Add batch')
  })

  it('keeps Coach / Session for skating', () => {
    const c = activityCopy('skating')
    expect(c.staff).toBe('Coach')
    expect(c.lesson).toBe('Session')
  })

  it('hides skating specialization UI for music', () => {
    expect(isMusicActivity('music')).toBe(true)
    expect(showSkatingSpecializationUi('music')).toBe(false)
    expect(showSkatingSpecializationUi('skating')).toBe(true)
  })
})
