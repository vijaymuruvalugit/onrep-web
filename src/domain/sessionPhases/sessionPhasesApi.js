/**
 * Coach-facing session phase CRUD (aliases over operational blocks).
 */
import http from '../../api/http'

export const sessionPhasesApi = {
  async listPhases(operationalSessionId) {
    const { data } = await http.get(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases`,
    )
    return data?.phases ?? []
  },

  async createPhase(operationalSessionId, body) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases`,
      body,
    )
    return data?.phase ?? null
  },

  async updatePhase(operationalSessionId, phaseId, body) {
    const { data } = await http.patch(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}`,
      body,
    )
    return data?.phase ?? null
  },

  async reorderPhases(operationalSessionId, phaseIds) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/reorder`,
      { phaseIds },
    )
    return data?.phases ?? []
  },

  async deletePhase(operationalSessionId, phaseId) {
    const { data } = await http.delete(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}`,
    )
    return data?.phase ?? null
  },

  async duplicatePhase(operationalSessionId, phaseId, body = {}) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}/duplicate`,
      body,
    )
    return data?.phase ?? null
  },
}

export const PHASE_TYPE_OPTIONS = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'technical', label: 'Technical work' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'race', label: 'Race' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'custom', label: 'Custom' },
]
