/**
 * Normalize API place row (camelCase from backend mapPlaceRow, or occasional snake_case).
 */
export function mapPlaceFromApi(raw) {
  if (!raw) return null
  return {
    id: String(raw.id),
    academyId: raw.academyId ?? raw.academy_id ?? undefined,
    name: raw.name || '',
    address: raw.address ?? null,
    latitude: raw.latitude != null ? Number(raw.latitude) : null,
    longitude: raw.longitude != null ? Number(raw.longitude) : null,
    googlePlaceId: raw.googlePlaceId ?? raw.google_place_id ?? null,
    notes: raw.notes ?? null,
    isActive: raw.isActive !== false && raw.is_active !== false,
    sortOrder:
      raw.sortOrder != null
        ? Number(raw.sortOrder)
        : raw.sort_order != null
          ? Number(raw.sort_order)
          : null,
    createdBy: raw.createdBy ?? raw.created_by ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  }
}

const MAX_SUMMARY_LEN = 72

/**
 * One-line operational address for lists and headers.
 */
export function formatPlaceAddressSummary(place) {
  if (!place) return ''
  const addr = place.address != null ? String(place.address).trim() : ''
  if (!addr) return ''
  const singleLine = addr.replace(/\s+/g, ' ').trim()
  if (singleLine.length <= MAX_SUMMARY_LEN) return singleLine
  return `${singleLine.slice(0, MAX_SUMMARY_LEN - 1)}…`
}

/**
 * Normalize batch schedule row for UI (place + days).
 */
export function normalizeScheduleRowForUi(row) {
  if (!row) return row
  const placeId = row.placeId ?? row.place_id ?? null
  const placeName = row.placeName ?? row.place_name ?? null
  const days = row.daysOfWeek ?? row.days_of_week ?? []
  const startTime = row.startTime ?? row.start_time ?? null
  const endTime = row.endTime ?? row.end_time ?? null
  const slotName = row.slotName ?? row.slot_name ?? null
  const name = row.name ?? slotName ?? null
  const coachId = row.coachId ?? row.coach_id ?? null
  const coachName = row.coachName ?? row.coach_name ?? null
  const additionalCoachIdsRaw = row.additionalCoachIds ?? row.additional_coach_ids ?? []
  const additionalCoachesRaw = row.additionalCoaches ?? row.additional_coaches ?? []
  const sessionFocus = row.sessionFocus ?? row.session_focus ?? null
  const sessionPresetId = row.sessionPresetId ?? row.session_preset_id ?? null
  const phaseOverrides = row.phaseOverrides ?? row.phase_overrides_json ?? []
  const presetVersion = row.presetVersion ?? row.preset_version ?? null
  const sessionMode = row.sessionMode ?? row.session_mode ?? 'practice'
  const effectiveFrom = row.effectiveFrom ?? row.effective_from ?? null
  const effectiveUntil = row.effectiveUntil ?? row.effective_until ?? null
  const isActive = row.isActive ?? row.is_active ?? true
  const replacesPatternId = row.replacesPatternId ?? row.replaces_schedule_id ?? null
  const replacedByPatternId = row.replacedByPatternId ?? row.replaced_by_schedule_id ?? null
  const toYmd = (v) => {
    if (!v) return null
    try {
      return new Date(v).toISOString().slice(0, 10)
    } catch {
      return typeof v === 'string' ? v.slice(0, 10) : null
    }
  }
  return {
    ...row,
    placeId: placeId != null ? String(placeId) : null,
    placeName,
    daysOfWeek: Array.isArray(days) ? days : [],
    startTime,
    endTime,
    slotName,
    name,
    coachId: coachId != null ? String(coachId) : null,
    coachName,
    additionalCoachIds: Array.isArray(additionalCoachIdsRaw)
      ? additionalCoachIdsRaw.map(String).filter(Boolean)
      : [],
    additionalCoaches: Array.isArray(additionalCoachesRaw) ? additionalCoachesRaw : [],
    sessionFocus,
    sessionMode,
    sessionPresetId: sessionPresetId || null,
    phaseOverrides: Array.isArray(phaseOverrides) ? phaseOverrides : [],
    presetVersion,
    effectiveFrom: toYmd(effectiveFrom),
    effectiveUntil: toYmd(effectiveUntil),
    isActive: Boolean(isActive),
    replacesPatternId: replacesPatternId != null ? String(replacesPatternId) : null,
    replacedByPatternId: replacedByPatternId != null ? String(replacedByPatternId) : null,
  }
}
