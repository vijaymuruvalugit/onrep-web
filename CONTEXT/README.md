# OnRep Admin — context pack for AI / new chats

Use these files when working in **onrep-admin** (coach/owner web app; deployed from the **onrep-web** Git remote). Paths are relative to this package root.

| File | Contents |
|------|----------|
| [01-project-overview.md](01-project-overview.md) | Stack, repo layout, API client, workspace header |
| [02-batches-schedule-ops.md](02-batches-schedule-ops.md) | Batches list, Batch Workspace, operational sessions client, start/attendance flow |

**Related backend context** (sibling repo / monorepo): **`onrep-backend/CONTEXT/`**, especially [12-operational-sessions-and-batches.md](../../onrep-backend/CONTEXT/12-operational-sessions-and-batches.md).

**Product vocabulary (shared surfaces):** [docs/platform-primitives.md](../docs/platform-primitives.md)

**Skating Ops (live session command center):** [src/features/skating/docs/COACH_OS_SPEC.md](../src/features/skating/docs/COACH_OS_SPEC.md)

**Contracts:** `@onrep/contracts` via `file:../packages/onrep-contracts` (or monorepo root `packages/onrep-contracts`).

**API base:** Configured in `src/api/http.js` — all coach routes send JWT + **`x-activity-id`** when a workspace is selected.
