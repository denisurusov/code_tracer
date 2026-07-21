```yaml
id: task-contract-issuance
type: task
title: Contract issuance and countersignature
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
# Task: Contract issuance and countersignature

Component ⑧. Turns a completed draft into the signed, content-addressed L-1
contract and drives it to Accepted: issuer signing, transmission to the maker,
countersignature capture and verification, freeze enforcement, amendment
versioning with supersession pointers, and schedule/lapse tracking.

Runs the `artifact-contract-lifecycle` state machine (Proposed → Accepted →
Delivered → Fulfilled, plus the three terminals). Emits **Commissioned** into
`artifact-product-lifecycle` on acceptance.

Carries the issuance signing key — issuer-side key custody the bank side does not
have, and a "who may press issue" governance question attached
(`noteworthy-trust-root-ownership`, residue).

Also emits the compiled layout via the dual-sited compiler ①; the bank recompiles
and compares digests at gate time (`noteworthy-compiler-siting`), so this
component must pin and publish its compiler version.
