```yaml
id: noteworthy-ri-stack
type: noteworthy
title: Decision — RI stack (Witness engine + TypeScript app/UI, three tiers)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T21:40:00Z
provenance:
  conversationId: konspekt-ri-scoping
  sourceRef: 73d4e7b0880a1a1fb720911ac7360c99f54583f9
  contentHash: 73d4e7b0880a1a1fb720911ac7360c99f54583f9
  timestamp: 2026-07-17T20:45:00Z
createdAt: 2026-07-17T20:45:00Z
updatedAt: 2026-07-17T21:40:00Z
```
# Decision: RI stack (Witness engine + TypeScript app/UI, three tiers)

**Decision.** The reference implementation is built in **three tiers**, chosen so
the UI-across-the-cycle requirement is met without compromising the verification
core:

1. **Verification engine = Witness.** The OSERA L-1 contract compiles to a
   *Witness policy* embedding the Rego attribute-checks alongside the
   step/functionary structure, so compiler ① and Rego ② collapse into one
   compiled artifact and structural + semantic verification run as a **single
   `witness verify` pass** — the most literal realization of architecture §4's
   "one gate, two passes."
2. **App / orchestration + UI = TypeScript** (Node + React), invoking Witness /
   cosign / in-toto-verify as **subprocesses**. The engine being a Go binary is
   irrelevant across that boundary, so choosing TS for the app tier costs
   nothing on the engine side while giving the UI the strongest ecosystem.
3. **Fixtures generator independent** (`task-fixtures`), any convenient language.

**The UI reads projections, never writes state.** The mutable side
(`state-pointer`, `ledger-row`) exists precisely to render current motion without
being authoritative; the console reads it and routes every change through the
gate (`verdict`) or ledger (`ledger-event`), preserving the offline-replay
property (architecture §5.1).

**Rejected — Option B (Python monolith).** `in-toto-verify` reference impl + OPA
as a subprocess, one language end-to-end, fastest to a Phase-1 skeleton. But it
hand-glues two runtimes, forgoes the single-`witness verify` collapse, and gives
up the strongest UI ecosystem for a first-class lifecycle console — a poor trade
once UI is in scope.

**Binds:** adds component **⑥ (lifecycle console)** to the architecture §6 Build
register; fixes the stack for `goal-reference-implementation` and its phases in
`artifact-reference-implementation`.
