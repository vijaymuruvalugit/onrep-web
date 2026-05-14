/**
 * @typedef {'scheduled'|'upcoming'|'active'|'paused'|'completed'|'archived'|'cancelled'} OperationalSessionState
 */

/**
 * Canonical operational session (camelCase) from GET /operational-sessions/day-board or /board.
 *
 * @typedef {object} OperationalSession
 * @property {string} id
 * @property {string} state
 * @property {string} sessionKind
 * @property {string} sourceType
 * @property {string|null} sourceId
 * @property {string|null} title
 * @property {string|null} description
 * @property {string|null} batchId
 * @property {string|null} batchName
 * @property {string|null} placeId
 * @property {string|null} placeName
 * @property {string|null} scheduledStartAt
 * @property {string|null} scheduledEndAt
 * @property {string|null} actualStartAt
 * @property {string|null} actualEndAt
 * @property {string|null} coachId
 * @property {string|null} coachName
 * @property {number} athleteCount
 * @property {string|null} rosterMode
 * @property {string|null} attendanceMode
 * @property {string|null} createdBy
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {object|null} metadataJson
 * @property {string|null} [scheduleId]
 * @property {string|null} [sessionDate]
 * @property {string|null} [startTime]
 * @property {string|null} [endTime]
 * @property {boolean} [attendanceMarked]
 * @property {boolean} [isOneTime]
 * @property {string|null} [status]
 * @property {boolean} [isCancelled]
 */

export {}
