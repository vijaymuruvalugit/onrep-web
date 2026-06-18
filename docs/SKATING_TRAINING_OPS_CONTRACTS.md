# Skating training ops — preserved API contracts (admin)

This document lists the **unchanged** REST surface used by **Skating Ops** (`onrep-admin` coach live session UI). UX refactors must keep these paths and payload shapes unless a deliberate backend change is shipped separately.

**Backend reference (mount, bundle fields, rapid-observation persistence):** in the same monorepo, see `ezyplay-backend/CONTEXT/11-skating-training-ops-api.md`, `ezyplay-backend/docs/openapi.yaml`, and the canonical operational-session routes under `/api/v1/operational-sessions`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/operational-sessions/day-board?date=YYYY-MM-DD` | Canonical day board + session list |
| `GET` | `/operational-sessions/board` | Range board for operational sessions |
| `POST` | `/operational-sessions/:id/start` / `pause` / `end` / `cancel` | Canonical live-session lifecycle |
| `GET` | `/skating/training/sessions/:id/bundle` | Session bundle (session, groups, races, recent laps) |
| `POST` | `/skating/training/sessions` | Create session (`date`, `placeId`, `sessionSkaterIds`, `rinkOrRoad`, `notes`, `createdBy`, …) |
| `PATCH` | `/skating/training/sessions/:id` | Patch `sessionSkaterIds`, `startedAt`, `endedAt`, `sessionFocus`, `objectivesJson`, `sessionAthleteFocusJson`, … |
| `POST` | `/skating/training/laps` | Record lap (`skaterId`, `lapTime`, `trainingSessionId`, `raceUuid` optional, `skillId` optional) |
| `DELETE` | `/skating/training/laps/:lapId` | Undo lap |
| `PUT` | `/skating/training/sessions/:id/groups/:groupKey` | Merge / upsert group |
| `POST` | `/skating/training/sessions/:id/groups/:groupKey/races` | Add race (timing lane) |
| `POST` | `/skating/training/sessions/:id/rapid-observation` | Rapid observation KPI scores |
| `GET` | `/skating/training/session-presets` | Session preset list for planning/live setup |
| `GET` | `/skating/training/skaters/active` | Active skaters for live-session selection |
| `POST` | `/skating/training/sessions/:id/coaching-events` | Record coaching event |
| `GET` | `/skating/training/race-results` | Race result rows |
| `GET` | `/skating/training/leaderboard` | Leaderboard data |
| `GET` | `/skating/training/sessions/:id/races-aggregate` | Aggregated race data for a session |

## Skating intelligence (governance + longitudinal state)

Mounted on the same **`/api/v1/skating`** coach router (requires `x-activity-id`). See `ezyplay-backend/src/modules/skating/skatingIntelligence.routes.js`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/skating/intelligence/skill-catalog` | Merged platform + custom skill definitions with academy overlay (`?studentId=` optional) |
| `PATCH` | `/skating/intelligence/students/:id/skills/:definitionId` | Skill level tap `currentLevel` 1–5, optional `latestNote` (**trend is derived server-side**) |
| `GET` | `/skating/intelligence/students/:id/kpi-snapshots` | KPI snapshots filtered to academy-visible KPIs |
| `GET` | `/skating/intelligence/students/:id/timeline` | Compact history (snapshots, notes, assessments) |
| `GET` | `/skating/intelligence/academy-settings` | Skill + KPI academy configuration |
| `PATCH` | `/skating/intelligence/academy-settings` | Patch skills / KPIs (visibility, order, targets, thresholds) |
| `POST` | `/skating/intelligence/custom-skills` | Create academy custom skill (+ config row) |
| `PUT` | `/skating/intelligence/batches/:batchId/focus-skills` | Replace batch development focus (`body.skillIds` UUID array) |

## Admin UI notes (no API change)

The live session header can show an **observation count** for coach rhythm. That value is **incremented client-side** on successful `POST …/rapid-observation` responses and reset when the selected session changes; the session bundle does not currently expose a total rapid-observation count.

## Lap `meta` / tags

`recordLap` builds `meta` server-side from known fields (`skillId`, `lapSkill`, `raceLabel`, …). There is **no** generic passthrough of arbitrary client `meta` for ad-hoc tags today. For focus/session tags on laps, either extend the backend allowlist or attach short structured text via existing assessment/notes flows.

## Phase 2 (not implemented here)

When reporting needs stronger SQL filters, consider first-class columns such as `batch_id`, `session_type`, `primary_focus`, `training_load` instead of overloading `objectives_json` alone.
