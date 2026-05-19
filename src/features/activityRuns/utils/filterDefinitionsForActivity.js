import { activityRunDefinitions } from '../activityRunDefinitions'

export function filterDefinitionsForActivity(activitySlug) {
  const slug = (activitySlug || 'skating').toLowerCase()
  return Object.values(activityRunDefinitions).filter((d) =>
    (d.activityTypes || []).some((t) => String(t).toLowerCase() === slug),
  )
}

export default filterDefinitionsForActivity
