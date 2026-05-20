const PREFIX = 'onrep:race-session:'

function key(phaseId) {
  return `${PREFIX}${phaseId}`
}

export function readRaceSession(phaseId) {
  if (!phaseId || typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key(phaseId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeRaceSession(phaseId, data) {
  if (!phaseId || typeof sessionStorage === 'undefined') return
  try {
    if (!data) {
      sessionStorage.removeItem(key(phaseId))
      return
    }
    sessionStorage.setItem(key(phaseId), JSON.stringify(data))
  } catch {
    /* quota */
  }
}

export function clearRaceSession(phaseId) {
  writeRaceSession(phaseId, null)
}
