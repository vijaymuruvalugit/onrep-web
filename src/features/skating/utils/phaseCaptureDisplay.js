/**
 * Resolve which capture items show on quick card vs deep athlete panel.
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

function isPrimaryItem(item) {
  return item?.configurationJson?.primary === true
}

/**
 * Quick layer: primary tags, one primary rating, quick note.
 */
export function quickLayerItems(captureItems) {
  const items = captureItems || []
  const primary = items.filter(isPrimaryItem)
  if (primary.length > 0) {
    const tags = primary.filter((it) => it.fieldType === 'tags').slice(0, 1)
    const rating = primary.filter((it) => it.fieldType === 'rating').slice(0, 1)
    const note = primary.filter(
      (it) => it.fieldType === 'note' && it.configurationJson?.quickNote !== false
    ).slice(0, 1)
    return [...tags, ...rating, ...note]
  }
  const tags = items.filter(
    (it) => it.fieldType === 'tags' && (it.configurationJson?.displayTier || 'drawer') === 'inline'
  ).slice(0, 1)
  const rating = items
    .filter(
      (it) =>
        it.fieldType === 'rating' && (it.configurationJson?.displayTier || 'drawer') === 'inline'
    )
    .slice(0, 1)
  const note = items.filter((it) => it.fieldType === 'note').slice(0, 1)
  return [...tags, ...rating, ...note]
}

/**
 * Deep layer: everything not in quick layer.
 */
export function deepLayerItems(captureItems) {
  const quickIds = new Set(quickLayerItems(captureItems).map((it) => it.id))
  return (captureItems || []).filter((it) => !quickIds.has(it.id))
}

/** @deprecated use quickLayerItems */
export function inlineCaptureItemsForCard(captureItems, { captureMode, coachDefaults, activePhase }) {
  const quick = quickLayerItems(captureItems)
  if (captureMode === 'fast') {
    return quick.filter((it) => it.fieldType === 'tags')
  }
  const phaseOverride = getPhaseOverride(coachDefaults, activePhase?.blockType)
  if (phaseOverride.hideInlineRatings) {
    return quick.filter((it) => it.fieldType !== 'rating')
  }
  return quick
}

export function drawerCaptureItems(captureItems, inlineIds) {
  return deepLayerItems(captureItems)
}

export function entryValueForField(entries, athleteId, fieldId) {
  const hit = (entries || []).find(
    (e) => String(e.athleteId) === String(athleteId) && String(e.fieldId) === String(fieldId)
  )
  return hit?.valueJson ?? null
}

function ratingLabelFromValue(item, valueJson) {
  const v = valueJson?.value
  if (v == null || v === '') return null
  const label = item?.label || 'Rating'
  return `${label} ${v}`
}

function tagLabelsFromValue(valueJson, max = 2) {
  const vals = Array.isArray(valueJson?.values) ? valueJson.values : []
  return vals.slice(0, max).map(String)
}

/**
 * Collapsed card summary text.
 */
export function buildObservationSummary(entries, athleteId, captureItems) {
  const quick = quickLayerItems(captureItems)
  const labels = []
  let count = 0

  for (const item of quick) {
    const val = entryValueForField(entries, athleteId, item.id)
    if (item.fieldType === 'tags') {
      const tags = tagLabelsFromValue(val, 2)
      if (tags.length) {
        labels.push(...tags)
        count += tags.length
      }
    } else if (item.fieldType === 'rating' && val?.value != null) {
      const rl = ratingLabelFromValue(item, val)
      if (rl) {
        labels.push(rl)
        count += 1
      }
    } else if (item.fieldType === 'note' && val?.text) {
      const t = String(val.text).trim()
      if (t) {
        labels.push(t.length > 24 ? `${t.slice(0, 24)}…` : t)
        count += 1
      }
    }
  }

  if (labels.length >= 1) {
    return labels.slice(0, 2).join(', ')
  }

  const total = (entries || []).filter(
    (e) =>
      String(e.athleteId) === String(athleteId) &&
      quick.some((q) => String(q.id) === String(e.fieldId)) &&
      e.valueJson &&
      Object.keys(e.valueJson).length > 0
  ).length

  if (total > 0) {
    return `${total} observation${total === 1 ? '' : 's'}`
  }
  return null
}

export function observationCountForAthlete(entries, athleteId, captureItems) {
  const quickIds = new Set(quickLayerItems(captureItems).map((it) => String(it.id)))
  return (entries || []).filter((e) => {
    if (String(e.athleteId) !== String(athleteId)) return false
    if (!quickIds.has(String(e.fieldId))) return false
    const v = e.valueJson
    if (!v || typeof v !== 'object') return false
    if (Array.isArray(v.values) && v.values.length > 0) return true
    if (v.value != null && v.value !== '') return true
    if (v.text && String(v.text).trim()) return true
    return false
  }).length
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
