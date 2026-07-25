```yaml
id: noteworthy-bundle-split
type: noteworthy
title: Decision — evidence core (issuer-sealed, shared) + ingest envelope (per-bank)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-25T00:00:00Z
provenance:
  conversationId: konspekt-osera-member-deck
  sourceRef: 7aa6325730d0516102bfe4d0adffadbc846626f1
  contentHash: 7aa6325730d0516102bfe4d0adffadbc846626f1
  timestamp: 2026-07-25T00:00:00Z
createdAt: 2026-07-25T00:00:00Z
updatedAt: 2026-07-25T00:00:00Z
```
# Decision: evidence core + ingest envelope

**Decision.** The perimeter container splits in two.

| | **Evidence core** | **Ingest envelope** |
|---|---|---|
| Sealed by | issuer, once | resolver ③, once per consuming bank |
| At | Fulfilled | Verified → Resolved |
| Holds | delivery manifest + L-1 + L0–L8 + compiled layout + policy bundle | core digest + trust-root snapshot + checkpoint set + Fulcio chain + local artifact locator |
| Identity | one digest, shared across the membership | bank-local digest |
| Clock | none — frozen | trust root ≤ 7 days, checkpoints ≤ 24 hours, measured at the gate |

The `verdict` gains **`coreDigest`** alongside the existing `bundleDigest`, which
now names the envelope. Two banks admitting the same candidate produce different
`bundleDigest`s and the same `coreDigest`.

**The cut is evidence against trust material.** Evidence does not go stale: what
the maker claimed and what the quorum independently re-derived are fixed at
Fulfilled and identical for every consumer. The material used to *judge* that
evidence — registry state, keys, delegations, log heads — does go stale, and must
be current at the moment a particular bank decides. One container cannot carry
both, because one of the two needs a clock and the other must not have one.

**What forced it.** Two statements in the accepted graph could not both hold.
`artifact-evidence-bundle` §1 had the bundle assembled bank-side by ③ at
Verified → Resolved; `artifact-deployment-topology` §4 had the bundle as the one
thing that crosses the perimeter. A container assembled on arrival is not a
container that crossed. What crosses is the element set; the bank seals around it.

Following that through surfaced the real cost of per-bank assembly, which is not
compute — assembly is discovery and copy, and OCI blob sharing means shared
elements are referenced rather than duplicated. The cost is **identity**: n banks
produce n manifest digests over one evidence set, so no two members can cite the
same evidence to each other, and neither can cite it to a supervisor. Sealing the
common part once recovers a shared identifier.

**Why issuer sealing costs no independence.** Because sealing confers nothing.
Neither container carries a signature of its own; every element inside is
independently signed and independently verified, and a manifest is a digest over
them. This was already fixed as a property of the bundle
(`artifact-evidence-bundle` §3), and the split rests on it: if sealing meant
anything, issuer assembly would be an endorsement and the alliance would have
acquired a trust role it is designed not to have. The bank still verifies every
element itself, against trust material it chose and refreshed.

**Rejected: keep one per-bank bundle and use the delivery manifest's log entry as
the shared identifier.** It is already logged, already common, and free. It also
covers only L-1 and L0–L7 — the maker's submission — and stops short of the L8
set, the compiled layout and the policy bundle. It identifies what was handed
over rather than what was verified, and L8 is the only thing that converts claims
into evidence. An identifier for the evidence has to include the evidence.

**Rejected: seal everything once, including trust material.** This is the
arrangement the freshness rule already forbids. A core sealed for the alliance
carries a trust-root snapshot and checkpoints that age from the moment of
sealing, so the second bank to ingest fails the freshness rule through no fault
of its own, and the natural repair — loosening the window — is exactly what
`noteworthy-bundle-freshness` rules out. It would also take from each bank the
choice of what trust state to admit against.

**Consequences.**

- **`verdict.coreDigest`** joins `bundleDigest`, `trustRootVersion` and
  `trustPath` as a replay field (`artifact-data-model` §4).
- **Two immutable elements** replace one in the inventory: evidence core (outside
  zone, born Fulfilled) and ingest envelope (inside zone, born Verified →
  Resolved).
- **Component ③ seals the envelope**, and mirrors or references the core. Its job
  is unchanged in kind and smaller in volume.
- **Re-admission gets cheap.** A bank re-running an old decision, or a second bank
  admitting the same candidate a year later, works from the same core with a
  fresh envelope. The core has no expiry.
- **The air gap gets easier.** The large, stable half crosses on any schedule and
  can be batched; only the small, fresh half is on the 24-hour tempo.
- **The freshness clock moves to the envelope.** `noteworthy-bundle-freshness`
  needs amending to say so, and to distinguish the tree heads frozen in L8 from
  the current head the envelope must carry.

**Binds:** `artifact-evidence-bundle` §1–§3, §5–§7; `artifact-deployment-topology`
§4–§5; `artifact-data-model` §2–§4 and §6. **Resolves:** the assembled-inside
versus crosses-the-perimeter contradiction between those first two.
