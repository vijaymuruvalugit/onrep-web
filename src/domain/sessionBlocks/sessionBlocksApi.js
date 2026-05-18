/**
 * Operational coaching blocks for skating sessions (Phase 2).
 * Requires activity workspace header (x-activity-id).
 */
import http from '../../api/http'

export const sessionBlocksApi = {
  async listBlocks(operationalSessionId) {
    const { data } = await http.get(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/blocks`,
    )
    return data?.blocks ?? []
  },

  async createBlock(operationalSessionId, body) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/blocks`,
      body,
    )
    return data?.block ?? null
  },

  async reorderBlocks(operationalSessionId, blockIds) {
    const { data } = await http.post(
      `/operational-sessions/${encodeURIComponent(operationalSessionId)}/blocks/reorder`,
      { blockIds },
    )
    return data?.blocks ?? []
  },

  async patchBlock(blockId, body) {
    const { data } = await http.patch(
      `/operational-sessions/session-blocks/${encodeURIComponent(blockId)}`,
      body,
    )
    return data?.block ?? null
  },

  async deleteBlock(blockId) {
    const res = await http.delete(
      `/operational-sessions/session-blocks/${encodeURIComponent(blockId)}`,
    )
    if (res.status === 204) return { deleted: true, block: null, reset: false }
    return {
      deleted: false,
      block: res.data?.block ?? null,
      reset: Boolean(res.data?.reset),
    }
  },
}

/** Human labels for block types in coach UI. */
export const BLOCK_TYPE_LABELS = {
  warmup: 'Warmup',
  technical: 'Technical',
  conditioning: 'Conditioning',
  race_simulation: 'Race simulation',
  race: 'Race',
  assessment: 'Assessment',
  recovery: 'Recovery',
  cooldown: 'Cooldown',
}

export const BLOCK_TYPE_OPTIONS = Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))
