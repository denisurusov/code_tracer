```yaml
id: noteworthy-compiler-siting
type: noteworthy
title: Decision — layout compiler is dual-sited; digest agreement is an admission rule
status: active
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
# Decision: layout compiler dual-sited, digest agreement admissible

**Decision.** Component ① (contract → in-toto layout compiler) is **not moved**
to the issuer side. It runs on **both sides**, the compile is **deterministic**,
and **agreement between the two compiled layout digests becomes an admission
check**.

```
  14. Recompile layout L' from the signed L-1 contract C.
      digest(L') == digest(L) as distributed.        [layout-compile agreement]
```

**Why not simply move it.** If the alliance compiles and signs the layout and
the bank merely verifies the signature, a **trusted compiler** has been inserted
into a design whose entire premise is *verify, don't trust*. The bank would be
accepting that the layout faithfully represents the contract on the issuer's
word — precisely the class of claim the chain exists to eliminate. A signed
layout is authenticated, not verified.

**Why dual-siting works.** The same reasoning as reproducible builds and the
k-of-n quorum (architecture §3.6), applied one layer up: a deterministic
transform means two independent parties converge on the same digest **without
coordinating**. Agreement is a Schelling point, not a protocol. The marginal cost
is one local compile at gate time.

**Consequence — determinism becomes a requirement, not a property.** The
compiler must be specified as byte-deterministic: fixed key ordering, no
timestamps, no locale or environment dependence, pinned version. A compiler
version skew between issuer and bank surfaces as a digest mismatch, which is the
correct and loud failure. The compiler version therefore rides in the
`policy-object` record alongside the layout it produced.

**Binds:** `task-layout-compiler` (①) gains an issuer-side siting and a
determinism spec; `artifact-architecture` §3.7 gains rule 14; `artifact-data-model`
`policy-object` gains `compilerVersion`.
