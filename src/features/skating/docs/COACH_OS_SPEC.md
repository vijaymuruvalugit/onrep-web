# Coach operating system — skating module spec

Authoritative product framing lives in the skating coach OS plan; this document **signs off implementation alignment** and gives **QA / acceptance** anchors for `features/skating`. Do not treat this as generic sports ontology—it encodes **Layer 1 operational patterns** with **Layer 2 skating payloads**.

---

## Audit sign-off (APIs, DB, progression, assessments)

| Area | Status | Notes |
|------|--------|--------|
| APIs | **Aligned** | `GET /skating/students/:id/coach-summary` — glance bundle (`coachSummaryVersion`, progress counts, laps PB sample, momentum heuristic, note snippet). `POST /skating/training/sessions/:sessionId/rapid-observation` — `student_assessments` row with `kind: skating_rapid_observation`. Training bundle + laps unchanged as primary rhythm. |
| DB | **Aligned** | Assessments via existing `student_assessments` JSON payload + `schemaVersion`; no parallel skating-only table required for Rapid Observation v1. |
| Progression | **Unchanged contract** | Lap-driven progression remains on training lap APIs; coach summary is **read-only** visibility. |
| Assessments | **Rapid Observation v1** | Five fixed KPI keys in UI (`rapidObservationKpis.js`); server validates 1–5 scores, 1–5 keys per submit. |

---

## Interaction surfaces (SkatingOps anchor)

| Surface | Role | Mapping |
|---------|------|---------|
| **Primary shell** | Continuous operational context | [`SkatingOpsPage.jsx`](../pages/SkatingOpsPage.jsx) — single `/coach/skating` anchor; no new route per feature. |
| **Tray / rail** | Fast athlete rotation | Roster table + skater `<select>` — same session context. |
| **Peek** | Low-density glance elsewhere | [`StudentSkatingSnapshotCard.jsx`](../components/StudentSkatingSnapshotCard.jsx) — coach-summary only; not a dashboard. |
| **Capture sheet** | Structured KPI capture | “Rapid observation” block — chips 1–5, optional notes. |
| **Session context strip** | Situational awareness | Session id prefix, place, rink/road, ops badge — no navigation. |

New capabilities **embed** here; avoid parallel “modules” for each capture type.

---

## Unified performance capture (philosophy)

One **rhythm**: select athlete → enter performance signal → commit → quiet success → repeat.

| Event type | Transport | UX on SkatingOps |
|------------|-----------|------------------|
| Lap | `POST /skating/training/laps` | Seconds field + submit; undo window; pending row. |
| Rapid Observation | `POST .../rapid-observation` | Five KPI chips + save; success message clears automatically. |
| Progression | Server-driven from lap | Inline info alert after lap when applicable. |

Shared rules: **preserve selection** where possible; **no full-page blocking** during active session; **incremental** bundle refresh after save.

---

## Rapid Observation model

- **≤ 5 KPIs** per capture (fixed list for muscle memory).
- **Scores** 1–5 integers; **≥ 1** KPI required per submit (server allows up to 5 keys).
- **Payload** (Layer 2): `schemaVersion: 1`, `kind: skating_rapid_observation`, `activityType: skating`, `trainingSessionId`, optional `raceId`, `scores`, optional `notes`.
- **Throughput goal**: UI supports **≤ 2 taps per KPI** after athlete selected (chip = one tap).

Keys (labels): Stride, Edges, Posture, Accel, Recovery — see `constants/rapidObservationKpis.js`.

---

## Operational timeline (API rules — forward-looking)

When a full timeline ships, it must be **signal-first**:

- **Prioritize**: progression transitions, PB moments, recent Rapid Observations (summarized), coach notes snippets, attendance anomalies (when wired).
- **Deprioritize**: raw event spam, internal mutations.
- **Mechanics**: grouping, session/day buckets, collapsible detail, capped initial fetch.

---

## Resilience checklist (active session)

| Requirement | Implementation / intent |
|-------------|---------------------------|
| Draft persistence | Lap draft in `sessionStorage` (`SK_LAP_DRAFT`); session id in `SK_ACTIVE_SESSION`. |
| Optimistic / pending | Pending lap row + spinner on lap submit. |
| Resume | `visibilitychange` refreshes bundle + snapshot. |
| No panic UX | Lap failure: message + **Retry** (refetch bundle); observation failure: inline alert. |
| Retry queue | **Out of scope v1** — explicit button retry only. |

---

## Coach Session Mode

- **Trigger**: `opsState === 'active'` on the selected session → `coach-session-live` card class + [`skating-ops.css`](../skating-ops.css) (larger controls).
- **Principles**: Larger tap targets for primary actions; session anchor always visible; rapid observation disabled when UI paused or session ended.

Optional future: glare-safe theme token — not implemented.

---

## Latency budgets (acceptance)

| Budget | Target |
|--------|--------|
| Rapid Observation commit | ≤ 2 taps per KPI after athlete selected |
| Athlete switch | Perceived fast — roster tap updates selection without route change |
| Coach snapshot card | ~500 ms p95 network + render **goal** (environment-dependent) |
| Session bundle refresh | ~1 s **goal** under normal conditions |
| Active coaching | No full-page spinner on lap/observation save — inline pending only |

Vitest guard: `rapidObservationKpis.test.js` asserts exactly five KPI rows (budget tied to spec).

---

## Parent / family data contracts

- Events stored with **stable ids**, **timestamps**, **session linkage**, **`schemaVersion`** on JSON payloads.
- Family routes already consume laps; assessments remain readable generically — **no throwaway schema** when parent UI expands.

---

## Attention preservation & ambient UX

- Success for Rapid Observation: short inline green alert; auto-dismiss — **no confetti**.
- Coach-value signals on snapshot: **momentum** label, **PB hint**, **note snippet** — sparse copy.

---

## Session continuity QA matrix

| Case | Expected |
|------|----------|
| Refresh mid-session | URL `?session=` or stored session restores; bundle reloads. |
| Tab away / back | Bundle + snapshot refresh via visibility handler. |
| Lap failure | Draft fields preserved; Retry refetches bundle. |
| Select athlete | `lapStudentId` + roster highlight; observation scores reset per athlete (fresh capture). |
| End session | Lap + observation controls disabled. |

---

## Peek card rules

- **One card** on student profile: answers “where is skating attention?” — counts + PB + momentum + optional note line.
- **Anti-dashboard**: no charts; link to Skating ops for depth.

---

## Outdoor ergonomics

Documented for QA: contrast of numeric lap field; thumb-sized roster rows and KPI chips in coach-session-live; session anchor readable at arm’s length.

---

## Continuous UI discipline

- After saves: **patch state via `loadBundle`** — no full route reload.
- Avoid wiping unrelated UI flags except intentional session change (`selectSession`).

---

## Error calmness

- Recoverable errors: **inline** text + action (**Retry** on lap path).
- Avoid modal stacks for transient network failures during coaching.

---

## Primary surface hierarchy

1. **SkatingOpsPage** — authoritative operational surface.
2. **Student snapshot card** — secondary glance.
3. Future tray/peek variants remain **subordinate** — no competing “home” for coaching.

---

## Lightweight presence UI

Session anchor strip shows: truncated session id, place, rink/road, ops state badge — **zero navigation** cost.

---

## Operational layering

- **Layer 1**: session-centric flow, calm errors, chip capture, glance APIs — reusable philosophy.
- **Layer 2**: skating KPI keys, lap/race semantics, momentum heuristic — stay in `modules/skating` + skating features.

---

## Extraction threshold gate

Shared primitives (shared React components, generic timeline) ship only when **≥ 2 activities** share the same operational semantics and rhythm — see plan. Skating-specific code remains until then.

---

## Anti-admin drift

Feature priority: **rink-side capture and glance** over ERP completeness. Admin expansions must not replace coach OS as the “real” product.

---

## Coach-value signals (minimal)

- Inline **momentum** copy (`improving_pace` / `slowing_pace`) from recent lap averages.
- **PB hint** from best lap in recent sample window.
- No push-notification product — signals stay **in-context**.

---

## Engagement prototype

Qualitative validation: observe real coach sessions for tap rhythm, glare, and interruption recovery — **not** gated on analytics dashboards.

---

## Feature budget guard

Periodic review: count surfaces (routes/modals), KPI rows, and toast patterns — **simplicity under depth**; five KPI cap enforced in UI and API.

---

## Phase / product priority note

**Shipped first**: operational read path (`coach-summary`) + Rapid Observation capture + SkatingOps integration — ahead of a full operational timeline UI. Stakeholder trade-offs for deeper “development dashboard” work are **out of band** to this spec.

---

## Assessment storage strategy (v1)

**Chosen path**: `student_assessments` rows with typed JSON payloads (`skating_rapid_observation`). Dedicated `skating_assessment_events` + `activity_id` migration is deferred until multi-tenant assessment reporting requires it.
