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
  return {
    ...row,
    placeId: placeId != null ? String(placeId) : null,
    placeName,
    daysOfWeek: Array.isArray(days) ? days : [],
    startTime,
    endTime,
    slotName,
  }
}
