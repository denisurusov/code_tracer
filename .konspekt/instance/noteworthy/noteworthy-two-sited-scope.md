```yaml
id: noteworthy-two-sited-scope
type: noteworthy
title: Decision — the product is two-sited (issuer + consumer)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T17:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T17:20:00Z
```
# Decision: the product is two-sited (issuer + consumer)

**Decision.** code_tracer spans **two zones, not one**. Alliance-side (issuer)
tooling — contract authoring, contract issuance, verifier-registry and trust-root
curation — is **in scope and in the reference implementation**, alongside the
bank-side gate and ledger it already carried.

**Applied to `artifact-architecture` 2026-07-21** (commit `55d85de`): §1
rewritten for the issuer/consumer split and three zones; §6 Build split into
consumer-side and issuer-side columns with ⑦⑧⑨ added.

**What this contradicted.** §1 formerly stated the product was "the bank-side
admission gate and ledger at the end of the OSERA supply chain — not the supply
chain itself," listing the alliance's governance under *what it is not*; §6
placed trust-root governance under **the gap**. Both were wrong in the same
direction. As amended:

- §1 *what it is not* keeps the **patching pipeline** and the **maker's
  attestation production** (L0–L7) out of scope; the blanket exclusion of
  alliance tooling is gone, but alliance **governance** (who may issue, what the
  thresholds are) remains explicitly out.
- §6 trust-root governance moved to *build* in **mechanism only** (see
  `noteworthy-trust-root-ownership`); the-gap narrowed to alliance policy.
- `goal-admission-gate` (root) is titled bank-side and is narrower than the
  effort. Added sibling `goal-issuer-side` rather than a retitle, so the accepted
  root is not silently rewritten.

**Consequences.**
- **Two deployment targets**, two trust roots, two operating envelopes — the
  issuer side is a multi-tenant alliance service; the bank side stays hermetic
  and offline. Nothing about the bank's offline property is relaxed by the
  issuer side existing.
- **The versioned L-1 contract schema becomes the interface between them** —
  the one artifact both sides compile against, and therefore the thing that
  needs a compatibility policy.
- **Three zones, not two** (from the `Origins` schematic, 2026-07-17): public
  upstream is its own band because nobody in the alliance controls it, and it is
  the anchor (§3.4). Issuer-side scope does not annex it.
- **The perimeter crossing is a copy, not a protocol.** Because the bank
  verifies offline, what crosses is a transportable **evidence bundle**:
  artifact + attestation set + compiled layout + trust-root snapshot +
  transparency-log checkpoint. Now defined in `artifact-evidence-bundle`.

**Binds:** `artifact-architecture` §1, §6 — applied. **Opened and since
resolved:** the evidence-bundle definition. **Still open:** contract-schema
compatibility policy.
