# Skating training ops — preserved API contracts (admin)

This document lists the **unchanged** REST surface used by **Skating Ops** (`onrep-admin` coach live session UI). UX refactors must keep these paths and payload shapes unless a deliberate backend change is shipped separately.

**Backend reference (mount, bundle fields, rapid-observation persistence):** in the same monorepo, see `ezyplay-backend/CONTEXT/11-skating-training-ops-api.md` and `ezyplay-backend/docs/openapi.yaml` under `/api/v1/skating/training/…`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/skating/training/ops/snapshot` | Day snapshot + session list |
| `GET` | `/skating/training/sessions/:id/bundle` | Session bundle (session, groups, races, recent laps) |
| `POST` | `/skating/training/sessions` | Create session (`date`, `placeId`, `sessionSkaterIds`, `rinkOrRoad`, `notes`, `createdBy`, …) |
| `PATCH` | `/skating/training/sessions/:id` | Patch `sessionSkaterIds`, `startedAt`, `endedAt`, `sessionFocus`, `objectivesJson`, `sessionAthleteFocusJson`, … |
| `POST` | `/skating/training/laps` | Record lap (`skaterId`, `lapTime`, `trainingSessionId`, `raceUuid` optional, `skillId` optional) |
| `DELETE` | `/skating/training/laps/:lapId` | Undo lap |
| `PUT` | `/skating/training/sessions/:id/groups/:groupKey` | Merge / upsert group |
| `POST` | `/skating/training/sessions/:id/groups/:groupKey/races` | Add race (timing lane) |
| `POST` | `/skating/training/sessions/:id/rapid-observation` | Rapid observation KPI scores |

## Admin UI notes (no API change)

The live session header can show an **observation count** for coach rhythm. That value is **incremented client-side** on successful `POST …/rapid-observation` responses and reset when the selected session changes; the session bundle does not currently expose a total rapid-observation count.

## Lap `meta` / tags

`recordLap` builds `meta` server-side from known fields (`skillId`, `lapSkill`, `raceLabel`, …). There is **no** generic passthrough of arbitrary client `meta` for ad-hoc tags today. For focus/session tags on laps, either extend the backend allowlist or attach short structured text via existing assessment/notes flows.

## Phase 2 (not implemented here)

When reporting needs stronger SQL filters, consider first-class columns such as `batch_id`, `session_type`, `primary_focus`, `training_load` instead of overloading `objectives_json` alone.
