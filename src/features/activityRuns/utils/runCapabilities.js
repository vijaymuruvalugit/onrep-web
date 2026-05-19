import { getActivityRunDefinition } from '../activityRunDefinitions'

export function supportsTiming(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.timing)
}

export function supportsRanking(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.ranking)
}

export function supportsTeams(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.teams)
}

export function supportsLaps(type) {
  const def = getActivityRunDefinition(type)
  return Boolean(def?.capabilities?.laps || def?.capabilities?.progression)
}

export function supportsProgression(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.progression)
}

export function supportsScoring(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.scoring)
}

export function supportsDuration(type) {
  return Boolean(getActivityRunDefinition(type)?.capabilities?.duration)
}

export function filterDefinitionsForActivity(definitions, activitySlug) {
  const slug = (activitySlug || 'skating').toLowerCase()
  return (definitions || []).filter((d) =>
    (d.activityTypes || []).some((t) => String(t).toLowerCase() === slug),
  )
}
