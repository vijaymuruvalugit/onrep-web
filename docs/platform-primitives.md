# Platform primitives & operational UI policy

Shared vocabulary for coach/instructor operational surfaces (Batch Operations, attendance lists, timelines). Activity-specific terms (skating, music, yoga) stay in **activity modules** or localized copy — not in generic API or shared component names.

**AI / onboarding context pack:** [../CONTEXT/README.md](../CONTEXT/README.md) (batches, schedule, start-session flow). **Backend API:** `onrep-backend/CONTEXT/12-operational-sessions-and-batches.md`.

## Core primitives

| Primitive | Meaning |
|-----------|---------|
| Batch / group | Roster container for recurring or logical groups |
| Session instance | One concrete dated occurrence (attendance target) |
| Weekly schedule / cadence | Human-readable default pattern (days + time window) |
| Operational timeline | Near-term chronological session list — not a calendar product |
| Operational focus | Single “what matters now” message + at most one primary action |
| Attendance | Present/absent for a session — lightweight |

## User-facing language

Prefer: **extra session**, **skip session**, **fill upcoming session dates**, **view session** / **start session**.  
Avoid on shared surfaces: **event**, **recurrence exception**, **generate sessions** (use **fill / update dates** instead).

## Forbidden on shared operational UI

- Competitive / comparative semantics by default: PBs, rankings, race logic, leaderboards (unless activity-scoped or explicit opt-in).
- Vertical leakage into core names: rink, race, skater-as-generic, etc., as **cross-activity** API or shared component identifiers.

## Batch Workspace utilities (governance)

The collapsed **Schedule setup** area may contain **only** rare operational maintenance (weekly schedule quick-add, fill dates, extra session, skip, adjust times). It must **not** become a configuration ecosystem; ongoing setup belongs in **Settings** or dedicated routes.

## Batches list (2026-05)

- **No dedicated Status column** in list view. Setup gaps appear as **small hints under the batch name** (empty batch, needs schedule, coach not assigned, etc.), not a parallel badge column.
- **Tiles** remain the default layout; list view is for dense scanning with the same data columns minus status.

## Start session timing (current app split)

- **Batch Workspace** currently routes the primary "Roster check-in" action to the skating live-session shell (`/coach/skating?session=...`). It does **not** call `POST /operational-sessions/:id/start` itself.
- **Skating Ops** owns canonical live-session lifecycle actions (`POST /operational-sessions/:id/start`, `pause`, `end`, `cancel`) through `operationalSessionsApi`.
- The ±10 minute early/late confirmation helper exists as a governance rule, but it is not currently wired into the Batch Workspace CTA. If product wants strict actual-start capture from the batch screen, wire the helper and start call there before changing copy.
- `/coach/attendance/class/:id` is a compatibility redirect into the skating/live-session route, not the primary attendance target.

## Interaction validation checklist (ship / iterate)

Use with real coaches and mobile devices:

- [ ] Focus message feels **predictable**, not algorithmic.
- [ ] Header stays **who / where / when next** only (no status console).
- [ ] Timeline scans in a **few seconds**; Today / Tomorrow read clearly without cards.
- [ ] One-thumb path: open batch → understand focus → open attendance → back.
- [ ] Utilities stay closed by default; no junk-drawer growth in one PR.
- [ ] After marking attendance, screen feels **quiet continuity** (complete + next), not empty.

This document is the canonical reference for naming and restraint; extend via PR review, not ad hoc copy.
