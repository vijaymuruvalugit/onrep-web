import { useCallback, useMemo, useState } from 'react'
import { resolvePreset } from './racePresets'

const MAX = 5

function storageKey(operationalSessionId) {
  return `onrep:recent-races:${operationalSessionId}`
}

function readList(operationalSessionId) {
  if (!operationalSessionId || typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(operationalSessionId))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeList(operationalSessionId, list) {
  if (!operationalSessionId || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(operationalSessionId), JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* ignore */
  }
}

export function useRecentRaces(operationalSessionId) {
  const [version, setVersion] = useState(0)

  const recentRaces = useMemo(() => {
    void version
    return readList(operationalSessionId)
      .map((entry) => {
        const preset = resolvePreset(entry.presetId)
        if (!preset) return null
        return {
          ...entry,
          title: entry.title || preset.title,
          subtitle: entry.subtitle || preset.subtitle,
          preset,
        }
      })
      .filter(Boolean)
  }, [operationalSessionId, version])

  const recordRecent = useCallback(
    (entry) => {
      if (!operationalSessionId || !entry?.presetId) return
      const list = readList(operationalSessionId).filter((e) => e.presetId !== entry.presetId)
      list.unshift({
        presetId: entry.presetId,
        title: entry.title,
        subtitle: entry.subtitle,
        recordedAt: new Date().toISOString(),
        customSnapshot: entry.customSnapshot || null,
      })
      writeList(operationalSessionId, list)
      setVersion((v) => v + 1)
    },
    [operationalSessionId],
  )

  return { recentRaces, recordRecent }
}

export default useRecentRaces
