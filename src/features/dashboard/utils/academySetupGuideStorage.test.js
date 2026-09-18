import { describe, it, expect, beforeEach } from 'vitest'
import {
  academySetupGuideStorageKey,
  readAcademySetupGuideCollapsed,
  writeAcademySetupGuideCollapsed,
} from './academySetupGuideStorage'

describe('academySetupGuideStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('scopes collapsed state by identity and academy', () => {
    writeAcademySetupGuideCollapsed('id-1', 'acad-a', true)
    expect(readAcademySetupGuideCollapsed('id-1', 'acad-a')).toBe(true)
    expect(readAcademySetupGuideCollapsed('id-1', 'acad-b')).toBe(null)
    expect(readAcademySetupGuideCollapsed('id-2', 'acad-a')).toBe(null)
    expect(academySetupGuideStorageKey('id-1', 'acad-a')).not.toBe(
      academySetupGuideStorageKey('id-1', 'acad-b'),
    )
  })

  it('stores an explicit expanded preference', () => {
    writeAcademySetupGuideCollapsed('id-1', 'acad-a', false)
    expect(readAcademySetupGuideCollapsed('id-1', 'acad-a')).toBe(false)
  })
})
