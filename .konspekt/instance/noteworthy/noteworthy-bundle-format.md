```yaml
id: noteworthy-bundle-format
type: noteworthy
title: Decision — evidence bundle is OCI-canonical with a deterministic tar projection
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T18:45:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 62f7c4b932187a51625b047401a2925cb3b0715e
  contentHash: 62f7c4b932187a51625b047401a2925cb3b0715e
  timestamp: 2026-07-21T18:45:00Z
createdAt: 2026-07-21T18:45:00Z
updatedAt: 2026-07-21T18:45:00Z
```
# Decision: evidence bundle format — OCI canonical, tar projection

**Decision.** The evidence bundle is an **OCI image index with the attestation
set attached as referrers** — canonical. A **deterministic tar + manifest
export** is emitted on demand for air-gapped transfer. **The manifest digest is
identical across both forms**, so `verdict.bundleDigest` means the same thing
regardless of how the bundle travelled.

**Why OCI is canonical.**
- It is **native to the resolution path already chosen** — cosign, the Referrers
  API, `cosign download attestation <digest>` (architecture §7). Nothing new to
  build for the common case.
- It **dissolves the size problem** flagged in `artifact-evidence-bundle` §6:
  blobs are content-addressed and shared, so a single trust-root snapshot is
  *referenced* by every bundle that uses it rather than copied into each. The
  deduplication-vs-self-containment tension only bites when there is no registry.
- Digest-addressed by construction, which is the same grain as everything else
  in the model.

**Why tar remains.** Self-containment has to become *physical* when there is no
registry at the boundary. The tar form is fat by necessity — every referenced
blob materialized — and that is the correct trade for an air gap. It is emitted
when air-gapping actually happens, not by default.

**Determinism is required of the tar export** (fixed entry ordering, normalized
metadata, no timestamps), because the manifest digest must survive the round
trip. A tar that hashes differently from its OCI original would break
`bundleDigest` as a stable identity.

**Settles Archivista (architecture §9) by implication.** With an OCI-canonical
bundle, Archivista is **optional** — storage and DAG-traversal convenience, not
transport. Component ③ remains a real build (assembly, verification wiring,
bundle export) but a smaller one, and adopting Archivista later changes its
storage backend rather than its role.

**Binds:** resolves `artifact-evidence-bundle` §6 format and size items;
`artifact-architecture` §4 ③ and §9 (Archivista).
