import http from '../../api/http'

export const phaseCaptureApi = {
  async getSessionPhases(operationalSessionId) {
    const { data } = await http.get(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases`
    )
    return data
  },

  async savePhaseEntries(operationalSessionId, phaseId, entries) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}/entries`,
      { entries }
    )
    return data
  },

  async setCaptureMode(operationalSessionId, captureMode) {
    const { data } = await http.patch(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/capture-mode`,
      { captureMode }
    )
    return data
  },

  async startPhase(phaseId) {
    const { data } = await http.post(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/start`,
      {}
    )
    return data
  },

  async completePhase(phaseId, body = {}) {
    const { data } = await http.post(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/complete`,
      body
    )
    return data
  },

  async skipPhase(phaseId) {
    const { data } = await http.post(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/skip`,
      {}
    )
    return data
  },

  async addCaptureItem(phaseId, body) {
    const { data } = await http.post(
      `/operational-sessions/session-blocks/${encodeURIComponent(phaseId)}/capture-items`,
      body
    )
    return data
  },

  async patchCaptureItem(captureItemId, body) {
    const { data } = await http.patch(
      `/operational-sessions/capture-items/${encodeURIComponent(captureItemId)}`,
      body
    )
    return data
  },

  async deleteCaptureItem(captureItemId) {
    await http.delete(`/operational-sessions/capture-items/${encodeURIComponent(captureItemId)}`)
  },

  async getCoachDefaults() {
    const { data } = await http.get('/coach/capture-defaults')
    return data?.defaults ?? {}
  },

  async patchCoachDefaults(patch) {
    const { data } = await http.patch('/coach/capture-defaults', patch)
    return data?.defaults ?? {}
  },

  async saveSessionObservations(operationalSessionId, phaseId, observations) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}/session-observations`,
      { observations }
    )
    return data
  },

  async replacePhaseExercises(operationalSessionId, phaseId, exercises) {
    const { data } = await http.put(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}/exercises`,
      { exercises }
    )
    return data
  },

  async patchPhaseExercise(operationalSessionId, phaseId, exerciseId, body) {
    const { data } = await http.patch(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/phases/${encodeURIComponent(phaseId)}/exercises/${encodeURIComponent(exerciseId)}`,
      body
    )
    return data
  },
}

export default phaseCaptureApi
