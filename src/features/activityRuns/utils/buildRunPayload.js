import { getActivityRunDefinition } from '../activityRunDefinitions'

export function buildRunPayload(runType, patch = {}) {
  const def = getActivityRunDefinition(runType)
  const base = def?.defaults
    ? { ...def.defaults }
    : { payload_version: 1, results: [] }
  return {
    ...base,
    ...patch,
    payload_version: def?.payloadVersion ?? 1,
  }
}

export function participationMeta(source = 'COACH_CONFIRMED') {
  return { participated: true, source }
}
