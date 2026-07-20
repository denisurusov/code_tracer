```yaml
id: task-lifecycle-mockup
type: task
title: Lifecycle mockup — one candidate, end to end
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-20T19:45:00Z
review: accepted
provenance:
  conversationId: konspekt-conformance-install
  confidence: 0.6
  timestamp: 2026-07-20T00:00:00Z
createdAt: 2026-07-20T00:00:00Z
updatedAt: 2026-07-20T19:45:00Z
```
# Task: Lifecycle mockup — one candidate, end to end

A **design mockup, not code** — the visual target `task-lifecycle-ui` (component
⑥) is built against, settled before the console is implemented rather than
discovered during it.

**The brief:** show the *end-to-end result* by walking a single candidate across
the whole state machine — `commons-collections@3.2.1 → 3.2.1-osera.1`, the
fixture scenario in `artifact-ri-fixtures-spec` §1 — from **Commissioned**
through to **Sunset**, and round the renewal loop to `-osera.2`. One artifact,
every state, so the mockup answers "what does the operator actually see at each
step" in one artefact rather than per-screen.

Covers the four views in `task-lifecycle-ui`, each shown at the lifecycle moment
where it carries the most information:

- **Cycle board** — every candidate by state (`state-pointer`), with the
  outside/inside boundary visible: Commissioned→Verified is someone else's
  infrastructure, Resolved onward is ours.
- **Candidate detail** — the `verdict` (admit/reject + failing rule), the
  L-1…L9 chain, the k-of-n VSA set with a dissent called out.
- **Exposure / sunset table** — `ledger-row` per app with `Expiring` computed,
  not stored.
- **Lineage** — the supersedes chain, constant `candidateKey` across the
  renewal.

**Must show both outcomes, not just the happy path.** An ADMIT *and* a REJECT
naming its failing admission rule — the known-bad variants
(`artifact-ri-fixtures-spec` §7) are the product's most distinctive behaviour and
a mockup that only shows success misrepresents the gate.

**Constraints inherited from the design, which the mockup must not contradict:**
- The console is a **read tier over projections** — no control may imply a
  direct write; every state change routes through the gate (`verdict`) or the
  ledger (`ledger-event`).
- v1 is **dashboard + gate-trigger**; the v2 write-paths (risk-acceptance
  sign-off, retire-vs-renew) may appear only as clearly-marked future state.
- Offline and hermetic — nothing in the UI may imply a live call out to the
  alliance at verify time.

Deliverable: annotated static mockup (any fidelity above wireframe) plus a short
note on what a reviewer should look for. Feeds `task-lifecycle-ui`; sits under
`goal-reference-implementation`.
