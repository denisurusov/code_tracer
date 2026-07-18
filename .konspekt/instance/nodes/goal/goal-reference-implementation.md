```yaml
id: goal-reference-implementation
type: goal
title: Reference implementation — walking skeleton
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
# Goal: Reference implementation — walking skeleton

Prove the one load-bearing claim of the whole design — the L-1 contract compiles
to an in-toto/Witness layout a stock verifier enforces **offline**, so the bank
needs no new verification mechanism (`osera-bank-verification.md`) — end-to-end
on a single synthetic class-(a) backpatch, producing a signed promote/reject
`verdict` a regulator can re-run to the same answer.

The RI implements only code_tracer's **consumption half** (architecture §1, the
"Inside" zone): gate components ①–⑤ (`goal-the-gate`) wired into one offline
`gate` CLI, plus the lifecycle console ⑥ (`task-lifecycle-ui`). The
**production** side (Moderne's L0–L7, the quorum's real rebuilds) is faked with
fixtures (`task-fixtures`) — if the RI starts standing up a patching pipeline it
has lost the plot.

**In scope (v1):** class (a) only; the five gate components + UI ⑥; offline
hermetic verify; append-only ledger with renewal (osera.1 → osera.2).
**Out:** class (b) FINOS-native (later parameterization); TUF trust-root
governance (static throwaway keys stand in); real CMDB (JSON file); Archivista
(resolver v1 reads a local dir, Archivista a later swap behind the same
interface).

Stack fixed to tiered-A (Witness engine + TypeScript app/UI); see
`noteworthy-ri-stack`. Full phase plan and acceptance criteria in
`artifact-reference-implementation`.
