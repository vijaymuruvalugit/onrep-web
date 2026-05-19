# Coach operating system — skating module spec

Authoritative product framing lives in the skating coach OS plan; this document **signs off implementation alignment** and gives **QA / acceptance** anchors for `features/skating`. Do not treat this as generic sports ontology—it encodes **Layer 1 operational patterns** with **Layer 2 skating payloads**.

---

## Audit sign-off (APIs, DB, progression, assessments)

| Area | Status | Notes |
|------|--------|--------|
| APIs | **Aligned** | `GET /skating/students/:id/coach-summary` — glance bundle (`coachSummaryVersion`, progress counts, laps PB sample, momentum heuristic, note snippet). `POST /skating/training/sessions/:sessionId/rapid-observation` — `student_assessments` row with `kind: skating_rapid_observation`. Training bundle + laps unchanged as primary rhythm. |
| DB | **Aligned** | Assessments via existing `student_assessments` JSON payload + `schemaVersion`; no parallel skating-only table required for Rapid Observation v1. |
| Progression | **Unchanged contract** | Lap-driven progression remains on training lap APIs; coach summary is **read-only** visibility. |
| Assessments | **Rapid Observation v1** | Bounded KPI keys in UI (`rapidObservationKpis.js`); server accepts **1–9** score keys per submit (values 1–5). |

---

## Interaction surfaces (SkatingOps anchor)

| Surface | Role | Mapping |
|---------|------|---------|
| **Primary shell** | Continuous operational context | [`SkatingOpsPage.jsx`](../pages/SkatingOpsPage.jsx) — single `/coach/skating` anchor; no new route per feature. |
| **Tray / rail** | Fast athlete rotation | [`AthletesInSessionPanel`](../components/AthletesInSessionPanel.jsx) + [`SessionAthleteGrid`](../components/SessionAthleteGrid.jsx) — **sole** session skater picker (no duplicate roster `<select>` on capture surfaces). |
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

Shared rules: **preserve selection** where possible; **no full-page blocking** during active session; **background session sync** merges one domain at a time after save (never `setBundle` / full snapshot replace on the live workspace).

---

## Local-first live coaching (architecture)

Live coaching is a **write-heavy interaction system**, not a snapshot dashboard.

| Rule | Implementation |
|------|----------------|
| **Live coaching shell** | Session header, phase strip, athlete strip, athlete workspace — renders from day-board / operational session + blocks + roster **before** sync domains load. |
| **Background session sync domains** | `laps`, `leaderboard`, `race results`, `coaching events` (+ narrow `sessionMeta`) via [`useLiveSessionRefresh.js`](../hooks/useLiveSessionRefresh.js). |
| **Interaction state ownership** | Selected athlete/phase, drafts, tabs, scroll, focus — shell-owned; sync must not reset them. |
| **No full object replacement** | Forbidden: `setBundle(next)`. Allowed: `mergeSyncDomains` per domain. |
| **Render before sync** | [`CoachLiveSessionView`](../components/CoachLiveSessionView.jsx) mounts when `?session=` + day-board row exists — not when bundle returns. |
| **Sync is secondary** | Good/Watch/Best markers do not trigger full refresh; coaching events domain only after tag/score batch. |
| **Failure tolerance** | Sync errors are inline; coaching continues (fail open). |
| **Background athlete intelligence** | Skills/history/progress lazy per athlete — never blocks shell ([`useAthleteIntelligence.js`](../hooks/useAthleteIntelligence.js)). |

### Bundle removal phase (planned — do not extend)

`SkatingOpsPage` still exposes a **deprecated** read-only `bundle` object derived from `syncDomains`. New code must use `syncDomains` or [`syncDomainSelectors.js`](../hooks/syncDomainSelectors.js) — never add `useEffect(..., [bundle])` or new `bundle?.` dependencies. Remove the bridge in a dedicated follow-up. Long-term, the **laps sync domain** may use `GET /training/sessions/:id/recent-laps` instead of full snapshot merge (deferred).

Shell loading is owned by [`useLiveSessionShell.js`](../hooks/useLiveSessionShell.js) only (no duplicate block/phase fetches on the page). Session enter and tab visibility use [`useLiveSessionLifecycle.js`](../hooks/useLiveSessionLifecycle.js).

---

## Rapid Observation model

- **≤ 9 KPIs** per capture (fixed list for muscle memory; server allows 1–9 keys per request).
- **Scores** 1–5 integers; **≥ 1** KPI required per submit.
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
| Resume | `visibilitychange` runs silent **background session sync** + day-board refetch — no full-page spinners after shell is visible. |
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

- After saves: **patch the relevant sync domain** (e.g. coaching events, laps) — no full route reload or workspace remount.
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

## Flow mode v1 + internal metrics (plan §4 / §15)

- **Flow:** [`FLOW_MODE.md`](./FLOW_MODE.md) — athlete list is the sole picker; lap save returns focus to the roster when live; future keyboard/swipe “next athlete” assist stays **out of v1**.
- **Internal counters:** [`utils/skatingOpsInternalMetrics.js`](../utils/skatingOpsInternalMetrics.js) — in-memory adoption signals (lap save, observation save, session start/end, add lane, add athletes). Expose via `getSkatingOpsInternalMetrics()` in DevTools; optional `console.debug` in **development** only. **Not** shown in coach UI.

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

---

## Live coaching UX (v2 — athlete-centered)

When `coachLive` is true (`SkatingOpsPage`), the layout is a **vertical mobile-first stack**:

1. [`SessionLiveHeader`](../components/SessionLiveHeader.jsx) — compact session context + Start/End/Race  
2. [`PhaseModeStrip`](../components/PhaseModeStrip.jsx) — horizontal phase mode-switch (`Warmup • 2`)  
3. [`AthleteCardStrip`](../components/AthleteCardStrip.jsx) — sticky athlete cards (tap → select)  
4. [`ActiveAthleteWorkspace`](../components/ActiveAthleteWorkspace.jsx) — capture + [`AthleteIntelligenceTabs`](../components/AthleteIntelligenceTabs.jsx)

Orchestration: [`CoachLiveSessionView`](../components/CoachLiveSessionView.jsx).

### Live copy rules

- **Never** render `KPI` / `KPIs` in live components (enforced by `coachLiveUiForbidden.test.js`).  
- UI labels: **Score**, **Progress**, **Skills**, **Track**, **Note** — internal keys unchanged.  
- `LIVE_WORDS_MAX = 2` in [`coachLiveLabels.js`](../constants/coachLiveLabels.js).  
- Mode surfaces via `getLiveUiProfile(sessionMode, isRaceMode, blockType)` — same APIs, different layout emphasis.

### QA checklist (live)

- [ ] Phase tap → athlete tap → score tap without drawer or side column  
- [ ] Athlete strip visible while scrolling workspace  
- [ ] Today | Skills | Progress | History reachable in one tap (no “More” bucket)  
- [ ] No Setup link on live athlete workspace  
- [ ] Race phase: timing-first; coaching stack collapsible  
- [ ] Assessment `session_mode`: nine-dimension **Score** grid expanded

## Phase capture (v1)

- **Observation-first:** tags/notes primary; at most one inline rating row per athlete card; notes/counters in detail drawer only.
- **Card height:** fixed horizontal rows (~56px fast / ~72px full); no expandable list cards.
- **Modes:** Full vs Fast capture; coach defaults (`Coaching preferences`) + session presets at start.
- **Lifecycle:** Complete phase / Skip on strip; `runtime_status` on phases.
- Components: `phaseCapture/*`, `usePhaseCapture`, `usePhaseEntryAutosave`; APIs via `phaseCaptureApi.js`.
