import { describe, expect, it } from 'vitest'
import { DEFAULT_RAPID_KPIS } from './rapidObservationKpis'

describe('Rapid Observation KPI budget', () => {
  it('exposes exactly five KPI rows for muscle-memory capture', () => {
    expect(DEFAULT_RAPID_KPIS).toHaveLength(5)
    for (const row of DEFAULT_RAPID_KPIS) {
      expect(row.key).toMatch(/^[a-z_]+$/)
      expect(String(row.label).length).toBeGreaterThan(0)
    }
  })
})
