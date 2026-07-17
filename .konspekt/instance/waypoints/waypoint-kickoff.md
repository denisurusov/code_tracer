```yaml
id: waypoint-kickoff
type: waypoint
title: Kickoff — instance loaded, architecture accepted
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T16:30:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: a3cb74abf34a3cff7862ef6bd9694857d60372fc
  contentHash: a3cb74abf34a3cff7862ef6bd9694857d60372fc
  timestamp: 2026-07-17T16:30:00Z
createdAt: 2026-07-17T16:30:00Z
updatedAt: 2026-07-17T16:30:00Z
```
# Waypoint: Kickoff

First pinned checkpoint of the code_tracer design effort. At this pin the
instance carries the root goal (`goal-admission-gate`) and its accepted
decomposition — the two ingest classes, the gate (five components ①–⑤), and the
domain map — plus the accepted Architecture & Design artifact
(`artifact-architecture`), which inlines the L-1…L9 attestation chain in full,
the verification gate, the ledger, the component register, the standards
binding, and the regulatory narrative.

This is also the **first entity backed by a real source excerpt.** The kickoff
conversation is captured verbatim at
`sources/a3cb74abf34a3cff7862ef6bd9694857d60372fc.md` and cited above via
`provenance.sourceRef` + `contentHash`. Verify structurally with
`git hash-object` against that file. It closes — from here forward — the
provenance gap noted for the reconstructed earlier work, which carries only
`conversationId` because its verbatim source did not persist.

Open items carried forward (artifact §9): CycloneDX-vs-SPDX, TUF-shaped
trust-root governance, admission-ruleset review, ingest-class-(b) depth,
Archivista adoption, quorum parameters.
