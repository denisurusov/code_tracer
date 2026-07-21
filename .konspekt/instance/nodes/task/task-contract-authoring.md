```yaml
id: task-contract-authoring
type: task
title: Contract authoring UI
status: open
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T18:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T18:20:00Z
```
# Task: Contract authoring UI

Component ⑦. The issuer-side surface where an L-1 backpatch contract is drafted:
governance (mode, sponsor, mandate), baseline (by digest, anchor-checked against
Maven Central), `cvesInScope` and `explicitlyOutOfScope`, the frozen test corpus
by digest, thresholds, schedule, and `osera.line`.

Four things this must get right, all of which are evidence rather than UX:

- **Governance capture.** `mode` (mutualized | solo), `sponsor`, and a
  `mandateRef` digest — the vote record in mode 1, the sponsoring bank's
  authorization in mode 2 — plus the `trustPath` the artifact will be signed
  under. `governance.trustPath` must agree with that namespace; a mismatch is a
  contract error caught at admission (`noteworthy-governance-modes`).
- **The `osera.line` choice.** Declared not derived (`noteworthy-candidate-key`).
  The UI shows the live `(package, line) → current candidate-version` projection
  and forces an explicit continuation-vs-new-lineage decision. No free-text field.
- **Anchor verification at authoring time.** The baseline digest is an immutable
  external referent, so it is checked live against public Maven Central *while
  drafting* — a contract cannot be issued against a baseline that does not
  publicly resolve (`noteworthy-referent-binding`, architecture §3.4).
- **Fixability under the contract's own constraints.** Because conformance is
  binary at the gate (`noteworthy-conformance-binary`), a CVE that cannot be
  fixed under the declared `apiAbiStability` must never enter `cvesInScope` —
  discovering it at delivery costs an amendment round-trip. Scoping must surface
  the question at commissioning.

Drafts are `mutable-operational`; everything from signature onward is frozen.
Feeds `artifact-contract-lifecycle` states Drafted → Proposed.
