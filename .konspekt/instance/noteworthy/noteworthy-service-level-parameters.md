```yaml
id: noteworthy-service-level-parameters
type: noteworthy
title: Decision — service levels are named parameters; the notice window is derived
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-31T00:00:00Z
createdAt: 2026-07-31T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: service levels are named parameters; the notice window is derived

**Decision.** Every service level is a **named parameter carrying a provisional
value**, and the notice window is **computed from them and never set directly**.
The operating model states the shape; the alliance and each bank fill in the
numbers.

| Parameter | Spans | Owner | Provisional |
|---|---|---|---|
| `CADENCE_BALLOT` | nomination → commissioning | alliance | TBD |
| `SL_OFFER` | A2 issue → A2a countersign | issuer | TBD |
| `SL_VERIFY` | B2 delivered → C3 attested | alliance | TBD |
| `SL_SEAL` | Fulfilled → A3 | issuer | TBD |
| `SL_RESOLVE` | Verified → envelope sealed | bank | TBD |
| `SL_GATE_QUEUE` | D1 → verdict | bank | measured, no target |
| `SL_RECONCILE` | S4, S6 | issuer, bank | TBD |
| `SL_DRILL` | E2a replay | bank | TBD |
| `RELEASE_TRAIN` | admitted → deployed | bank | estate-specific |

```
WINDOW_NOTICE = CADENCE_BALLOT + SL_OFFER + contract.deliverBy
              + SL_VERIFY + SL_SEAL + SL_RESOLVE + SL_GATE_QUEUE
              + RELEASE_TRAIN + BUFFER
```

**Why derived rather than chosen.** The window has one job: to give a successor
project time to complete before the incumbent bridge lapses. Picking a number and
hoping the path fits inside it inverts the dependency, and the error is not
theoretical — 90 days was proposed earlier in the design and is wrong by roughly
a factor of two, which only became visible once the path was summed.

**Two things the formula makes visible:**

- **`CADENCE_BALLOT` dominates.** The window can never be shorter than one ballot
  cycle, so lengthening the cadence lengthens every bridge in the estate. That is
  a governance decision with an operational cost most participants would not
  otherwise see attached to it.
- **If the sum exceeds what a release train absorbs, that is a finding about the
  path** rather than a reason to shorten the notice. Shortening it would move the
  problem rather than solve it, and would put bridges into Sunset with work still
  in flight.

The window is also why `noteworthy-successor-project` matters here: a successor
runs the full pipeline, so `CADENCE_BALLOT` is in the sum and cannot be dropped.

**What is deliberately NOT a placeholder.** The **freshness windows are real,
settled values** — trust-root snapshot ≤ 7 days, checkpoint set ≤ 24 hours —
enforced as admission rule 15 and tightenable per bank. They are a different kind
of clock: a validity window the gate checks, rather than a service level anyone
is measured against (`noteworthy-bundle-freshness`). Marking them TBD alongside
the rest would suggest the gate has an unset parameter, which it does not.

**Why placeholders at all.** An operating model with no cadence and no service
level cannot be run, so the parameters must exist and be named. Their *values*
are alliance and bank policy. Naming them separates the two cleanly: a document
can reference `SL_VERIFY` without asserting a number, and no document restates a
value that has not been ratified.

**Binds:** `artifact-operating-model` §5 and §7 item 2;
`artifact-product-lifecycle` §10, whose sunset-signalling item this closes by
formula rather than by value. **Relates:**
`noteworthy-successor-project`, `noteworthy-bundle-freshness`.
