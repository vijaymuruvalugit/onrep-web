import { describe, it, expect } from 'vitest'
import {
  normalizeSessionModeValue,
  sessionModeLabel,
  sessionModeBadgeColor,
} from './sessionModes'

describe('sessionModes', () => {
  it('falls back missing/invalid to practice', () => {
    expect(normalizeSessionModeValue(null)).toBe('practice')
    expect(normalizeSessionModeValue('')).toBe('practice')
    expect(normalizeSessionModeValue('bogus')).toBe('practice')
    expect(sessionModeLabel(undefined)).toBe('Practice')
  })

  it('labels and colors known modes', () => {
    expect(sessionModeLabel('competition')).toBe('Competition')
    expect(sessionModeBadgeColor('assessment')).toBe('info')
    expect(sessionModeBadgeColor('testing')).toBe('dark')
  })
})
