/**
 * Stable operational contract from `GET /api/v1/skating/training/sessions/:id/bundle`.
 * Raw DB rows are not exposed — only explicit camelCase fields (`bundleVersion` ≥ 1).
 *
 * @typedef {object} SessionOperational
 * @property {string} id
 * @property {string|null} sessionDate
 * @property {string|null} placeId
 * @property {string|null} placeName
 * @property {string|null} rinkOrRoad
 * @property {string|null} notes
 * @property {string|null} startedAt
 * @property {string|null} endedAt
 * @property {string[]} sessionSkaterIds
 * @property {'upcoming'|'active'|'ended'} opsState
 *
 * @typedef {object} LapOperational
 * @property {string} id
 * @property {string} studentId
 * @property {string|null} studentName
 * @property {number|null} lapMs
 * @property {string|null} recordedAt ISO
 * @property {string|null} raceId
 * @property {string|null} groupId
 * @property {string|null} trainingSessionId
 *
 * @typedef {object} SessionOperationalBundle
 * @property {number} bundleVersion
 * @property {string} generatedAt ISO
 * @property {SessionOperational} session
 * @property {object[]} groups
 * @property {object[]} races
 * @property {LapOperational[]} recentLaps
 * @property {string|null} suggestedFocusRaceId
 * @property {number} totalLapCount
 * @property {number} recentLapCount
 */

export {}
