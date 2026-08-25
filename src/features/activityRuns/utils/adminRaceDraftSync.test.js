import { describe, expect, it, vi } from 'vitest'
import {
  createVersionedPatchQueue,
  normalizeFinishMarksCompat,
  reconcileFinishMarks,
} from './adminRaceDraftSync'

describe('reconcileFinishMarks (Slice 1E)', () => {
  it('keeps server A/B and local C/D after 409', () => {
    const server = [
      { id: 'A', captured_sequence: 1, captured_elapsed_ms: 100 },
      { id: 'B', captured_sequence: 2, captured_elapsed_ms: 200 },
    ]
    const local = [
      { id: 'A', captured_sequence: 1, captured_elapsed_ms: 100 },
      { id: 'B', captured_sequence: 2, captured_elapsed_ms: 200 },
      { id: 'C', captured_sequence: 3, captured_elapsed_ms: 300 },
      { id: 'D', captured_sequence: 4, captured_elapsed_ms: 400 },
    ]
    const { marks, conflicts } = reconcileFinishMarks(local, server)
    expect(conflicts).toHaveLength(0)
    expect(marks.map((m) => m.id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('surfaces immutable conflict and keeps server captured evidence', () => {
    const server = [{ id: 'A', captured_sequence: 1, captured_elapsed_ms: 100 }]
    const local = [{ id: 'A', captured_sequence: 1, captured_elapsed_ms: 999, student_id: 's1' }]
    const { marks, conflicts } = reconcileFinishMarks(local, server)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].field).toBe('captured_elapsed_ms')
    expect(marks[0].captured_elapsed_ms).toBe(100)
    expect(marks[0].student_id).toBe('s1')
  })

  it('normalizes legacy finish_marks for compatibility', () => {
    const marks = normalizeFinishMarksCompat([
      { id: 'legacy', finish_order: 1, time_ms: 1500 },
    ])
    expect(marks[0].captured_sequence).toBe(1)
    expect(marks[0].captured_elapsed_ms).toBe(1500)
  })
})

describe('createVersionedPatchQueue (Slice 1E)', () => {
  it('first PATCH uses start version and updates on success', async () => {
    let version = 0
    const calls = []
    const queue = createVersionedPatchQueue({
      getVersion: () => version,
      setVersion: (v) => {
        version = v
      },
      patchFn: async (body) => {
        calls.push(body.expectedVersion)
        return { runVersion: body.expectedVersion + 1 }
      },
    })
    await queue.flush({ runPayload: { race_meta: { finish_marks: [] } }, partial: true })
    expect(calls[0]).toBe(0)
    expect(version).toBe(1)
  })

  it('coalesces overlapping writes so stale payloads do not win', async () => {
    let version = 0
    const payloads = []
    let resolveFirst
    const firstGate = new Promise((r) => {
      resolveFirst = r
    })
    let call = 0
    const queue = createVersionedPatchQueue({
      getVersion: () => version,
      setVersion: (v) => {
        version = v
      },
      patchFn: async (body) => {
        call += 1
        payloads.push(body.runPayload.n)
        if (call === 1) await firstGate
        return { runVersion: version + 1 }
      },
    })
    const p1 = queue.flush({ runPayload: { n: 1 }, partial: true })
    const p2 = queue.flush({ runPayload: { n: 2 }, partial: true })
    resolveFirst()
    await Promise.all([p1, p2])
    expect(payloads[payloads.length - 1]).toBe(2)
    expect(version).toBeGreaterThan(0)
  })

  it('409 reconciles and retries with current version', async () => {
    let version = 0
    const expectedSeen = []
    let attempts = 0
    const queue = createVersionedPatchQueue({
      getVersion: () => version,
      setVersion: (v) => {
        version = v
      },
      patchFn: async (body) => {
        attempts += 1
        expectedSeen.push(body.expectedVersion)
        if (attempts === 1) {
          const err = new Error('conflict')
          err.response = {
            status: 409,
            data: {
              currentVersion: 5,
              run: {
                runVersion: 5,
                runPayload: {
                  race_meta: {
                    finish_marks: [
                      { id: 'A', captured_sequence: 1, captured_elapsed_ms: 100 },
                      { id: 'B', captured_sequence: 2, captured_elapsed_ms: 200 },
                    ],
                  },
                },
              },
            },
          }
          throw err
        }
        return { runVersion: body.expectedVersion + 1 }
      },
      reconcilePayload: (requestBody, serverRun) => {
        const local =
          requestBody.runPayload?.race_meta?.finish_marks || []
        const server =
          serverRun.runPayload?.race_meta?.finish_marks || []
        const { marks } = reconcileFinishMarks(local, server)
        return {
          race_meta: { finish_marks: marks },
        }
      },
    })
    await queue.flush({
      runPayload: {
        race_meta: {
          finish_marks: [
            { id: 'A', captured_sequence: 1, captured_elapsed_ms: 100 },
            { id: 'B', captured_sequence: 2, captured_elapsed_ms: 200 },
            { id: 'C', captured_sequence: 3, captured_elapsed_ms: 300 },
            { id: 'D', captured_sequence: 4, captured_elapsed_ms: 400 },
          ],
        },
      },
      partial: true,
    })
    expect(expectedSeen[0]).toBe(0)
    expect(expectedSeen[1]).toBe(5)
    expect(version).toBe(6)
  })
})
