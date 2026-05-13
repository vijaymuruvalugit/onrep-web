# Skating Ops — flow mode (v1) and future assist

## v1 (implemented)

**Athlete selection:** [`AthletesInSessionPanel`](../components/AthletesInSessionPanel.jsx) / [`SessionAthleteGrid`](../components/SessionAthleteGrid.jsx) is the **only** skater picker for live capture. There is no secondary “who is this for?” control on the lap or observation surfaces.

**After lap save (live session):** focus returns to the **athlete list** container (`athletePanelRef`) so the coach can pick the next skater without hunting for the roster.

**Observation chain:** optional advance to the next athlete in roster order remains in [`SkatingOpsPage.jsx`](../pages/SkatingOpsPage.jsx) (debounced autosave + advance UI).

## Future (not v1) — next-athlete assist (plan §4)

Possible enhancements once internal metrics show friction:

- Soft highlight of “next” athlete without auto-saving a signal
- Keyboard flow (e.g. Tab / shortcuts) across roster rows
- Swipe or edge gesture on tablet for “next skater”

Any assist must stay **opt-in** and preserve **no scoring pressure** guardrails from the coach-first plan.
