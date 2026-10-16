import { describe, expect, it } from 'vitest'
import {
  sessionOpensSkatingLiveTools,
  sessionWorkspacePath,
} from './sessionEffectiveSkating.js'

describe('sessionOpensSkatingLiveTools', () => {
  it('Core-only stamp stays Core even if modules wrongly claim skating', () => {
    expect(
      sessionOpensSkatingLiveTools({
        modules: { skating: true },
        session: { specialistModule: 'none', activityType: 'core' },
      }),
    ).toBe(false)
  })

  it('legacy Skating type with tools OFF opens Core', () => {
    expect(
      sessionOpensSkatingLiveTools({
        modules: { skating: false },
        session: { specialistModule: 'skating', activityType: 'skating' },
      }),
    ).toBe(false)
    expect(
      sessionOpensSkatingLiveTools({
        modules: {},
        activityType: 'skating',
        session: { activityType: 'skating' },
      }),
    ).toBe(false)
  })

  it('Core workspace + eligible Skating session opens specialist tools', () => {
    expect(
      sessionOpensSkatingLiveTools({
        modules: { skating: true },
        session: { specialistModule: 'skating', activityType: 'core' },
      }),
    ).toBe(true)
  })

  it('mixed workspace routes by session stamp', () => {
    const modules = { skating: true }
    expect(
      sessionOpensSkatingLiveTools({
        modules,
        session: { specialistModule: 'none', activityType: 'core' },
      }),
    ).toBe(false)
    expect(
      sessionOpensSkatingLiveTools({
        modules,
        session: { specialistModule: 'skating', activityType: 'core' },
      }),
    ).toBe(true)
  })

  it('legacy missing stamp + skating type + modules on opens live', () => {
    expect(
      sessionOpensSkatingLiveTools({
        modules: { skating: true },
        session: { activityType: 'skating' },
        activityType: 'skating',
      }),
    ).toBe(true)
  })
})

describe('sessionWorkspacePath', () => {
  it('routes Core to ops deep-link and Skating to live floor', () => {
    expect(sessionWorkspacePath('abc', { opensSkatingLive: false })).toBe(
      '/coach/ops/sessions/abc',
    )
    expect(sessionWorkspacePath('abc', { opensSkatingLive: true })).toBe(
      '/coach/skating?session=abc',
    )
  })
})
