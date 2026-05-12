import { describe, expect, it } from 'vitest'
import { DEFAULT_RAPID_KPIS } from './rapidObservationKpis'

describe('Rapid Observation KPI budget', () => {
  it('exposes nine canonical KPI rows (1–5 chips each)', () => {
    expect(DEFAULT_RAPID_KPIS).toHaveLength(9)
    for (const row of DEFAULT_RAPID_KPIS) {
      expect(row.key).toMatch(/^[a-z_]+$/)
      expect(String(row.label).length).toBeGreaterThan(0)
    }
  })
})
