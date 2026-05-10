# Activity Workspace QA Matrix (Phase Stabilization)

This matrix verifies operational correctness for **activity workspaces** (`x-activity-id` = enabled **platform** activity row).

## Preconditions

- **Platform-defined activities only** — academies enable types from the registry (`@onrep/contracts`), not custom categories. Today’s whitelist may be **skating-only** until additional verticals ship; use **two academies** or **staging with multiple types enabled** if you need a multi-workspace switch test.
- Academy has at least **two enabled activities** when testing switching (future: e.g. skating + swimming).
- Test users include: owner + coach with access to both activities.
- At least one batch, schedule, student, and attendance record exists in each activity.
- For debug logs, run frontend with `VITE_ACTIVITY_WORKSPACE_DEBUG=1`.

## Core Scenarios

| Scenario | Steps | Expected Result |
| --- | --- | --- |
| Switch activity | In `/coach` area, switch program from header workspace switcher | Lists/cards/counts refresh; subsequent API calls inject new `x-activity-id`; no stale data from previous workspace |
| Reload browser | Select an activity, refresh page | Previously selected activity restores from persisted state; protected pages load without reselection prompt |
| Activity removed / access revoked | Select activity A, then remove access to A in backend and refresh activities | Workspace fault shown, persisted activity cleared, user forced to reselect a valid activity |
| Two tabs with different activity | Open tab A and tab B, set different activities, switch in one tab | Other tab reconciles through BroadcastChannel/storage event and updates workspace safely |
| Attendance partition | Open attendance in skating workspace | No swimming students/sessions appear; all rows belong to skating activity context |
| Dashboard partition | Open coach dashboard / today cards across two workspaces | Numbers and upcoming schedule cards are workspace-scoped, not academy-wide |
| Batch creation behavior | Create/view batch in coach batches flow | Transitional behavior stays consistent with current contract; no cross-workspace schedule leakage |
| Student creation behavior | Create student with program selected in form | Request persists intended `activityId`; student appears in expected program context |
| Schedule filtering | View batches/schedules while workspace selected | Only schedules tied to active workspace are shown |

## API Classification Verification Checklist

For each critical endpoint, verify bucket assignment and runtime behavior:

- `bootstrap`: never sends `x-activity-id` (auth + activities bootstrap).
- `global`: intentionally academy-wide coach/admin surfaces.
- `exempt`: temporary legacy-global surfaces kept explicit.
- `scoped`: requires workspace and must send `x-activity-id`.

Minimum routes to verify in QA cycle:

- Attendance/session/schedule APIs are `scoped`.
- Dashboard operational aggregates are correctly scoped where expected.
- Billing/payments/onboarding remain global unless explicitly migrated.

## Temporary Workspace Logging Validation

When `VITE_ACTIVITY_WORKSPACE_DEBUG=1`, verify browser console entries like:

- `route` (current pathname)
- `requestUrl`
- `pathForRules`
- `activeActivityId`
- `skipActivityHeader`
- `injectedHeader`

Use these logs to catch:

- missing header injection on scoped endpoints
- accidental header on bootstrap/global endpoints
- stale activity id after switch/reload

Remove or keep disabled (`VITE_ACTIVITY_WORKSPACE_DEBUG` unset) after stabilization.
