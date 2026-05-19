/**
 * Resolve which capture items show on compact athlete cards vs drawer.
 */

export function getPhaseOverride(defaults, blockType) {
  const overrides = defaults?.phaseOverrides || {}
  return overrides[blockType] || overrides[String(blockType)] || {}
}

export function effectiveCaptureMode(sessionMode, coachDefaults, activePhase) {
  const phaseOverride = getPhaseOverride(coachDefaults, activePhase?.blockType)
  if (phaseOverride.defaultCaptureMode) return phaseOverride.defaultCaptureMode
  if (sessionMode) return sessionMode
  return coachDefaults?.defaultCaptureMode || 'full'
}

export function inlineCaptureItemsForCard(captureItems, { captureMode, coachDefaults, activePhase }) {
  const phaseOverride = getPhaseOverride(coachDefaults, activePhase?.blockType)
  const hideRatings = Boolean(phaseOverride.hideInlineRatings)
  const fast = captureMode === 'fast'

  const inline = (captureItems || []).filter(
    (it) => (it.configurationJson?.displayTier || 'drawer') === 'inline'
  )

  if (fast) {
    return inline.filter((it) => it.fieldType === 'tags' || it.configurationJson?.displayTier === 'fast_only')
  }

  const tags = inline.filter((it) => it.fieldType === 'tags')
  const ratings = hideRatings ? [] : inline.filter((it) => it.fieldType === 'rating').slice(0, 1)
  const rest = inline.filter((it) => it.fieldType !== 'tags' && it.fieldType !== 'rating')

  const observationsFirst = coachDefaults?.observationsFirst !== false
  if (observationsFirst) {
    return [...tags, ...ratings, ...rest].slice(0, 4)
  }
  return [...ratings, ...tags, ...rest].slice(0, 4)
}

export function drawerCaptureItems(captureItems, inlineIds) {
  const inlineSet = new Set(inlineIds)
  return (captureItems || []).filter((it) => !inlineSet.has(it.id))
}

export function entryValueForField(entries, athleteId, fieldId) {
  const hit = (entries || []).find(
    (e) => String(e.athleteId) === String(athleteId) && String(e.fieldId) === String(fieldId)
  )
  return hit?.valueJson ?? null
}

export function uiRoleLabel(uiRole) {
  switch (uiRole) {
    case 'skill':
      return 'Skill'
    case 'metric':
      return 'Metric'
    case 'checkpoint':
      return 'Checkpoint'
    default:
      return 'Observation'
  }
}
