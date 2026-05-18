/**
 * Athletes in phase — operational placement (Phase 3).
 * Requires activity workspace header (x-activity-id).
 */
import http from '../../api/http'

export const PARTICIPATION_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'resting', label: 'Resting' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'injured', label: 'Injured' },
]

export const phaseAthletesApi = {
  async listPhaseAthletes(operationalSessionId) {
    const { data } = await http.get(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phase-athletes`,
    )
    return data?.phases ?? []
  },

  async moveToPhase(fromPhaseId, studentId, toPhaseId) {
    const { data } = await http.post(
      `/operational-sessions/session-blocks/${encodeURIComponent(fromPhaseId)}/athletes/${encodeURIComponent(studentId)}/move`,
      { toPhaseId },
    )
    return data
  },

  async setLane(phaseId, studentId, lane) {
    const { data } = await http.patch(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/athletes/${encodeURIComponent(studentId)}/lane`,
      { lane },
    )
    return data?.athlete ?? null
  },

  async setHeatNumber(phaseId, studentId, heatNumber) {
    const { data } = await http.patch(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/athletes/${encodeURIComponent(studentId)}/heat-number`,
      { heatNumber },
    )
    return data?.athlete ?? null
  },

  async setParticipationStatus(phaseId, studentId, participationStatus) {
    const { data } = await http.patch(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/athletes/${encodeURIComponent(studentId)}/participation-status`,
      { participationStatus },
    )
    return data?.athlete ?? null
  },
}
