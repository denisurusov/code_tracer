```yaml
id: noteworthy-authoritative-form
type: noteworthy
title: Principle — one authoritative form, projections on demand
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
# Principle: one authoritative form, projections on demand

**Principle.** Every piece of state in this design has **exactly one
authoritative representation**. Everything else that looks like state is a
**projection** — derived on demand, never separately maintained, never a
co-authority.

Named because it has now been arrived at independently four times:

| Authoritative | Projection | Fixed in |
|---|---|---|
| CycloneDX SBOM | SPDX export on demand | `noteworthy-sbom-format` |
| Hash-chained `ledger-event` log | `ledger-row`, `state-pointer` | `noteworthy-ledger-substrate` |
| Accepted L-1 contracts | `(package, line)` lineage registry | `noteworthy-candidate-key` |
| OCI evidence bundle | deterministic tar export | `noteworthy-bundle-format` |

**Why co-authorities are the failure mode.** Two maintained representations of
the same fact diverge — not immediately, but on the day one is updated and the
other is not, and the divergence is discovered by whoever trusted the stale one.
A projection cannot drift: it is recomputed from the authority, so a bug produces
a *wrong view*, never a *second truth*.

**Corollaries.**
- **Conversion may be lossy in one direction only.** SPDX loses pedigree detail;
  tar loses blob sharing. Acceptable, because nothing reads back from a
  projection into the authority.
- **The projection is never the input to a decision.** The gate reads the
  authority; the console reads projections.
- **Identity is preserved across projection where it matters.** The evidence
  bundle's manifest digest is identical in OCI and tar form precisely so that
  `verdict.bundleDigest` stays meaningful.

**Standing test.** If a new format or store is proposed, ask which of the two it
is. If the answer is "both" or "it depends," the design is not finished.

**Notes:** `noteworthy-sbom-format`, `noteworthy-ledger-substrate`,
`noteworthy-candidate-key`, `noteworthy-bundle-format`.
