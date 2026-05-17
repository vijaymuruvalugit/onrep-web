# OnRep Admin — project overview

## What this repo is

**onrep-admin** — React (Vite) coach/owner **web** app built on CoreUI. It is the primary **management and operational** surface for academies (batches, schedule, attendance, students, skating ops, payments). Mobile execution stays in **ezyplay-frontend**; this app calls **ezyplay-backend** at `/api/v1`.

Git remote is often named **onrep-web**; package name **`@onrep/onrep-admin`**.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18, CoreUI, React Router, Redux Toolkit |
| Build | Vite |
| HTTP | Axios wrapper in `src/api/http.js` |
| Tests | Vitest |

## Repository layout (high signal)

```
onrep-admin/
├── CONTEXT/                    # This pack
├── docs/                       # Platform primitives, contracts, QA matrices
├── src/
│   ├── api/http.js             # JWT + x-activity-id interceptors
│   ├── core/activityWorkspace/ # Workspace bootstrap, active activity id
│   ├── domain/operationalSessions/  # API client + adapters for board rows
│   ├── features/
│   │   ├── batches/            # List + Batch Workspace
│   │   ├── schedule/           # Full schedule, SessionDetailDrawer
│   │   ├── attendance/         # Mark attendance per class session
│   │   ├── skating/            # Skating Ops day board
│   │   └── workspace/          # Activity switcher state
│   ├── routes/                 # protectedRoutes, dashboardPagesRegistration
│   └── views/dashboard/onrep/  # Shell / layout wiring
└── package.json
```

## Activity workspace

- Header **`x-activity-id`** must match the program the coach is working in.
- Redux: `workspace.activeActivityId`, `workspace.activities`, `workspace.bootstrapComplete`.
- Batch list filters rows where **`activityWorkspaceId`** matches the active activity.
- Opening a batch from another activity shows a **workspace mismatch** warning on Batch Workspace.

## Auth

- JWT in storage; `http` attaches `Authorization: Bearer …`.
- Role-gated routes via `protectedRoutes` / coach nav registration.

## Key coach routes (non-exhaustive)

| Path | Feature |
|------|---------|
| `/coach/batches` | Batches list (tiles or table) |
| `/coach/batches/:batchId` | Batch Workspace (`?tab=schedule\|students\|settings`) |
| `/coach/schedule` | Activity schedule board |
| `/coach/attendance/class/:classId` | Attendance entry |
| `/coach/skating` | Skating Ops (operational day board) |

## Environment

See root **`README.md`** / Vite env for API URL. Local dev typically proxies or points `VITE_*` API base at **ezyplay-backend**.

## When to update this pack

- New shared operational primitives or copy rules → `docs/platform-primitives.md` + this pack if behavior changes.
- Batches / schedule / operational session UX → [02-batches-schedule-ops.md](02-batches-schedule-ops.md).
- Backend API contract changes → mirror updates in **ezyplay-backend/CONTEXT/**.
