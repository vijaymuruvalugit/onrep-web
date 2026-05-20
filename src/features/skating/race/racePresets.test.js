import { describe, it, expect } from 'vitest'
import {
  buildPresetSubtitle,
  buildRaceStatusLine,
  listPickerPresets,
  resolvePreset,
  resolvePresetForSession,
} from './racePresets'

describe('racePresets', () => {
  it('builds subtitle with laps and rink', () => {
    const sub = buildPresetSubtitle({
      targetProgressCount: 5,
      venueType: 'RINK',
      context: { autoVenueLabel: true },
    })
    expect(sub).toBe('5 laps • Rink')
  })

  it('status line uses Race not Heat', () => {
    const line = buildRaceStatusLine({
      raceSequence: 1,
      currentLap: 1,
      targetLaps: 5,
    })
    expect(line).toContain('LIVE')
    expect(line).toContain('Race 1')
    expect(line).toContain('Lap 2/5')
    expect(line).not.toMatch(/Heat/i)
  })

  it('listPickerPresets returns only 2 Laps and 5 Laps', () => {
    const presets = listPickerPresets()
    expect(presets).toHaveLength(2)
    expect(presets.map((p) => p.id)).toEqual(['2_LAP', '5_LAP'])
    expect(presets[0].title).toBe('2 Laps')
    expect(presets[1].title).toBe('5 Laps')
  })

  it('resolvePresetForSession keeps static distance when autoDistanceFromVenue false', () => {
    const preset = resolvePreset('2_LAP_SPRINT')
    const resolved = resolvePresetForSession(preset, {})
    expect(resolved.distanceLabel).toBe('500 m')
  })
})
