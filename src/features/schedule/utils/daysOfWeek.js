/** Backend: 0 = Sun … 6 = Sat */
const LABEL_TO_NUM = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const NUM_TO_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * @param {string[]} labels e.g. ['Mon','Wed']
 * @returns {number[]}
 */
export function uiDayLabelsToApi(labels) {
  if (!Array.isArray(labels)) return []
  const nums = labels
    .map((d) => LABEL_TO_NUM[String(d)])
    .filter((n) => n !== undefined && !Number.isNaN(n))
  return [...new Set(nums)].sort((a, b) => a - b)
}

/**
 * @param {unknown[]} days from API (numbers or numeric strings)
 * @returns {string[]} labels for UI toggles
 */
export function apiDaysToUiLabels(days) {
  if (!Array.isArray(days)) return []
  const out = []
  for (const d of days) {
    const n = Number(d)
    if (!Number.isInteger(n) || n < 0 || n > 6) continue
    out.push(NUM_TO_LABEL[n])
  }
  return [...new Set(out)]
}

export const UI_DAY_LABELS_ORDERED = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
