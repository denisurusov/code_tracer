```yaml
id: task-contract-authoring
type: task
title: Contract authoring UI
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
# Task: Contract authoring UI

Component ⑦. The issuer-side surface where an L-1 backpatch contract is drafted:
baseline (by digest, anchor-checked against Maven Central), `cvesInScope` and
`explicitlyOutOfScope`, the frozen test corpus by digest, thresholds, schedule,
and `osera.line`.

Two things this must get right, both of which are evidence rather than UX:

- **The `osera.line` choice.** Declared not derived (`noteworthy-candidate-key`).
  The UI shows the live `(package, line) → current candidate-version` projection
  and forces an explicit continuation-vs-new-lineage decision. No free-text field.
- **Anchor verification at authoring time.** The baseline digest is an immutable
  external referent, so it is checked live against public Maven Central *while
  drafting* — a contract cannot be issued against a baseline that does not
  publicly resolve (`noteworthy-referent-binding`, architecture §3.4).

Drafts are `mutable-operational`; everything from signature onward is frozen.
Feeds `artifact-contract-lifecycle` states Drafted → Proposed.
