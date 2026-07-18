```yaml
id: task-fixtures
type: task
title: Fixtures — the synthetic supply chain
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
# Task: Fixtures — the synthetic supply chain

Generate the content-addressed test corpus the gate runs against, standing in
for the production side the RI deliberately does not build. Phase 0 — blocks
every other component (you cannot test a gate without one).

Emits: a synthetic L-1 contract (OSERA-2026-0142), a baseline/hardened artifact
pair with distinct digests, and the full L0–L9 DSSE-wrapped attestation set
signed by throwaway keys standing in for Moderne / the quorum / the bank.

Critically, also emits **one known-bad variant per failure mode** — wrong
baseline digest, scope mismatch, a dissenting VSA, expired layout, missing L5
proof, undeclared SBOM component. These bad variants *are* the gate's test
suite: each must drive a REJECT naming the failing admission rule (§3.7).

Independent of the engine/UI stack choice; whatever language is convenient.
Component of the RI (`goal-reference-implementation`), not of the gate proper.
