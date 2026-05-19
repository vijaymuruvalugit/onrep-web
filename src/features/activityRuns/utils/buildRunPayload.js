import { getActivityRunDefinition, getProgressionDefaults } from '../activityRunDefinitions'
import { normalizeProgressionPayload } from './normalizeProgressionPayload'

export function buildRunPayload(runType, patch = {}) {
  const def = getActivityRunDefinition(runType)
  const progressionBase = def?.capabilities?.progression ? getProgressionDefaults(runType) : null
  const base = progressionBase || (def?.defaults ? { ...def.defaults } : { payload_version: 1, results: [] })
  return normalizeProgressionPayload({
    ...base,
    ...patch,
    payload_version: def?.payloadVersion ?? base.payload_version ?? 1,
  })
}

export function participationMeta(source = 'COACH_CONFIRMED') {
  return { participated: true, source }
}
