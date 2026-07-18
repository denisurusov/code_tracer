```yaml
id: task-lifecycle-ui
type: task
title: Lifecycle console (UI) — component ⑥
status: active
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T20:45:00Z
review: accepted
provenance:
  conversationId: konspekt-ri-scoping
  timestamp: 2026-07-17T20:45:00Z
createdAt: 2026-07-17T20:45:00Z
updatedAt: 2026-07-17T20:45:00Z
```
# Task: Lifecycle console (UI) — component ⑥

A UI across the whole candidate lifecycle, reading the data model's **mutable
projections** — the first product component that is a read tier over projections
rather than part of the gate. TypeScript (Node + React), per
`noteworthy-ri-stack`.

Views, each backed by a projection (data-model §5):

- **Cycle board** — every candidate by lifecycle state (`state-pointer`); the
  Commissioned→Sunset machine, live.
- **Candidate detail** — the `verdict` (admit/reject + failing rule), the
  L-1…L9 chain, the quorum's VSAs and any dissent.
- **Exposure / sunset table** — `ledger-row` with `Expiring` computed, per app;
  the risk function's daily view.
- **Lineage** — the supersedes chain (osera.1 → osera.2), constant
  `candidateKey` across renewals; the "what was in force in March, covering
  what?" replay.

**Never a second writer.** The UI reads projections; it does not mutate state.
v1 is **dashboard + gate-trigger** — any state change routes through the gate
(emits a `verdict`) or the ledger (appends a `ledger-event`), never a direct
write, preserving offline replay (architecture §5.1). v2 write-paths (risk-
acceptance sign-off for the `warranty: none` finding §3.8, retire-vs-renew at
sunset) are deferred and each must still land as an event or signed attestation.

Component ⑥ of the RI (`goal-reference-implementation`); adds ⑥ to the
architecture §6 register.
