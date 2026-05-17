# Batches list, Batch Workspace, and operational timelines

Coach flows for **groups (batches)**, **recurring patterns**, and **near-term session instances**. Backend contract: **ezyplay-backend** [12-operational-sessions-and-batches.md](../../ezyplay-backend/CONTEXT/12-operational-sessions-and-batches.md).

---

## Batches list (`BatchesListPage`)

**Paths:** `src/features/batches/pages/BatchesListPage.jsx`, `BatchesListPage.scss`

- **Views:** Tiles (default) or **List** table; preference in `localStorage` key `onrep-batches-view`.
- **Data:** `useBatches` → batch API with per-row **`weeklySummary`**, **`todaySessionSnapshot`**, **`nextSessionSnapshot`**, student counts, coach name.
- **No Status column:** Setup gaps are **inline pill hints** under the batch name (`BatchAttentionHints`), not a separate table column. Rows that need attention get a light **left accent** (`onrep-batch-list-row--attention`).
- **Hint tones:** `muted` (inactive), `warn` (empty batch, coach missing), `info` (needs schedule), `risk` (sessions need review).
- **Today’s next session** in list view uses a soft highlight on the time line (`onrep-batch-list-row__next--today`).
- **Tiles:** Whole card navigates to Batch Workspace; nested links (Add schedule, Assign) use `stopPropagation`.

**Presentation helpers:** `src/features/batches/utils/batchPresentation.js` (`batchNeedsSchedule`, `batchNeedsCoach`, `getBatchStudentCount`).

---

## Batch Workspace (`BatchWorkspacePage`)

**Path:** `src/features/batches/pages/BatchWorkspacePage.jsx`

### Tabs

| Tab | Purpose |
|-----|---------|
| `schedule` | Recurring patterns + upcoming operational rows |
| `students` | `BatchStudentsTab` roster |
| `settings` | Name, coaches, default place |

### Operational board (upcoming sessions)

- Loads **`operationalSessionsApi.getBoardRange(from, to, batchId)`**.
- **`operationalToday`** from API drives **`todayIso`** (not browser calendar alone).
- Rows adapted via **`operationalSessionToScheduleCompactRow`** (`src/domain/operationalSessions/adapters/toScheduleCompactRow.js`).
- **Sort:** `compareOperationalSessionsChronological` — uses `scheduledStartAt` ISO, not time-only sort.
- **Upcoming filter:** `isOperationalSessionStillUpcoming` drops rows whose **`scheduledEndAt`** is in the past (cancelled excluded).
- **Display date:** `effectiveOperationalSessionDateYmd` + `formatOperationalSessionRange` in `CompactSessionRow` (Today / Tomorrow / weekday date + clock range).

**Header focus:** `computeOperationalFocus` (`batchWorkspaceOperations.js`) — attendance pending, completed today, or no session today; primary **Start session** when attendance is open for today.

### Start session (±10 minutes + actual times)

**Helpers:** `analyzeSessionStartWindow`, `SESSION_SLOT_TOLERANCE_MS` (10 min), `formatRowScheduledWhenLine` in `batchWorkspaceOperations.js`.

**Flow:**

1. Coach clicks **Start session** (header) or **Start** on a today row in upcoming list.
2. If now is outside scheduled window ±10 minutes → **modal** (“Start outside scheduled time?”) with scheduled slot copy; **Start anyway** continues.
3. **`POST /operational-sessions/:id/start`** then navigate to **`/coach/attendance/class/:id`**.
4. Backend records **`actual_start_at`** / class **`actual_start_time`** (see backend context doc). End time set on operational **end** or when **bulk attendance** is saved.

**Do not** link straight to attendance without start when implementing new entry points — keep the same guard + API call.

### Session drawer

`SessionDetailDrawer` — view/edit session; `onUpdated` refreshes schedules + operational board.

---

## Schedule page (activity-wide)

**Path:** `src/features/schedule/pages/SchedulePage.jsx`

- Same **`getBoardRange`** pattern; uses **`operationalToday`** for display after load.
- May navigate to attendance with start semantics — keep aligned with Batch Workspace when changing start rules.

---

## Shared display utilities

**Path:** `src/features/classes/utils/sessionDisplay.js`

| Export | Use |
|--------|-----|
| `normalizeSessionDateYmd` | Parse API date fields |
| `formatOperationalSessionRange` | “Today · 5:30 PM – 7:00 PM” |
| `effectiveOperationalSessionDateYmd` | Fallback from `operationalDayLocal` / `scheduledStartAt` + `timezone` |
| `compareOperationalSessionsChronological` | Board sort |
| `isOperationalSessionStillUpcoming` | Hide ended slots from “upcoming” |
| `sessionStartsAt` | Prefer `scheduledStartAt` for focus logic |

---

## Operational sessions API client

**Path:** `src/domain/operationalSessions/operationalSessionsApi.js`

| Method | Backend |
|--------|---------|
| `getDayBoard(date)` | `GET /operational-sessions/day-board` |
| `getBoardRange(from, to, batchId?)` | `GET /operational-sessions/board` |
| `startSession(id)` | `POST /operational-sessions/:id/start` |
| `endSession(id)` | `POST /operational-sessions/:id/end` |

Types: `src/domain/operationalSessions/types.js` (`OperationalSession` JSDoc).

---

## Attendance

**Path:** `src/features/attendance/pages/AttendanceEntryPage.jsx`  
**API:** `GET /sessions/:id/roster`, `POST /sessions/:id/attendance/bulk` via `attendanceApi.js`.

Session id = operational / training session uuid (shared id).

---

## Skating Ops (related, not batch-scoped)

**Path:** `src/features/skating/pages/SkatingOpsPage.jsx` — uses **`getDayBoard`** for selected calendar day, not batch-filtered board range. See [COACH_OS_SPEC.md](../src/features/skating/docs/COACH_OS_SPEC.md).

---

## Files to touch for batch/schedule changes

| Change | Likely files |
|--------|----------------|
| List layout / hints | `BatchesListPage.jsx`, `.scss`, `batchPresentation.js` |
| Workspace timeline / start | `BatchWorkspacePage.jsx`, `batchWorkspaceOperations.js`, `CompactSessionRow.jsx` |
| API shape | `toScheduleCompactRow.js`, `operationalSessionsApi.js`, backend DTO |
| Copy / naming policy | `docs/platform-primitives.md` |
