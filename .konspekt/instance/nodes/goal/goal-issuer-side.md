```yaml
id: goal-issuer-side
type: goal
title: Issuer side — alliance tooling
status: open
review: proposed
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-21T14:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T14:00:00Z
```
# Goal: Issuer side — alliance tooling

The alliance-facing half of the product, brought into scope 2026-07-21
(`noteworthy-two-sited-scope`). Where `goal-the-gate` consumes evidence inside
the bank, this goal **produces the root referent** the whole chain is verified
against, and **curates the trust material** the gate verifies with.

Sibling to `goal-admission-gate` rather than a retitle of it: the root goal is
accepted and pinned as bank-side, and a scope expansion should be legible as an
addition rather than a silent rewrite.

Decomposes into three components: ⑦ contract authoring, ⑧ contract issuance,
⑨ verifier registry and trust root. Component ① (layout compiler) is shared
rather than owned here — it is dual-sited by `noteworthy-compiler-siting`.
