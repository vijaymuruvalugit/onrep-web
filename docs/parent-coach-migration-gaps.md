# Parent + coach migration — known gaps (phase)

## Parent

- **Notifications:** `GET /parent/notifications` returns title, message, `createdAt` only. There is **no read/unread** field in the current contract; the UI is list-only.
- **Profile:** No dedicated parent profile PATCH under `/parent/*`. The profile page uses **auth session user** only; linked students are not loaded from a separate family endpoint in this phase.
- **Payment history:** Implemented as a **sort/view** over the same `/parent/fees` payload (`paid_at`, obligation rows) — not a separate transaction ledger API.
- **Home data:** Uses `GET /parent/dashboard` plus `GET /parent/fees` for the fee summary card (two calls). A future BFF aggregate could combine these without changing existing endpoints.

## Coach

- **Parents overview:** Scoped to **directory + invite resend/revoke** per existing `/parents/overview` and `/invites/parent/*` APIs — not CRM or messaging.

## Academy owner — coach invites (OnRep)

- **Route:** `/coach/onboarding/coaches` (sidebar: **Owner → Coach invites** for `academy_owner` only).
- **APIs:** `GET /onboarding/coach-invites`, `POST /onboarding/coach-invite`, `DELETE /onboarding/coach-invites/:userId` (same as mobile `ManageCoachesScreen`).
- Coaches who open this page see a read-only notice; the backend returns **403** if they call owner endpoints.

## Deferred (by design)

- Optimistic attendance + offline retry queue.
- Skating, reports, billing product work.
