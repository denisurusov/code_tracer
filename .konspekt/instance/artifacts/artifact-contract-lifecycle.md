```yaml
id: artifact-contract-lifecycle
type: artifact
title: code_tracer — Contract lifecycle (issuer side)
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
# code_tracer — Contract lifecycle (issuer side)

**Status:** proposed. The **fourth** factored axis, and the first that lives
*outside* the bank. `artifact-product-lifecycle` opens at **Commissioned**,
defined as "L-1 issued and accepted" — everything that *produces* that state was
unmodeled while the issuer side was out of scope. It no longer is
(`noteworthy-two-sited-scope`).

**Why a separate artifact, not a section.** The two machines track different
referents: this one tracks a **commitment**, the candidate lifecycle tracks an
**artifact**. They have different actors, different zones, different terminal
states, and a contract can fail (withdrawn, breached, expired unfulfilled)
without any candidate ever existing. Bolting this onto §2 of the candidate
lifecycle would conflate a promise with a thing.

## 1. States

| State | Actor | Meaning | Backed by |
|---|---|---|---|
| Drafted | issuer | scope, baseline, corpus, schedule, `osera.line` authored; unsigned | draft record (mutable) |
| Proposed | issuer | issued to the maker for acceptance; terms frozen pending signature | L-1 candidate, signed by issuer |
| Accepted | maker | maker countersigns; scope/baseline/acceptanceCriteria immutable | **L-1 contract** (the root referent) |
| Delivered | maker | L0–L7 minted against this contract | maker claims |
| Fulfilled | quorum | k-of-n VSAs assert conformance == FULL | L8 set |
| **Withdrawn** | issuer | terminal — retracted before acceptance | reason recorded |
| **Breached** | quorum | terminal — delivered, non-conforming, not remediable under this version | VSA conformance BREACH |
| **Lapsed** | — | terminal — schedule expired with no delivery | derived from `schedule.deliverBy` |

`Accepted` is the hinge: it is the freeze, and it is the state that emits
**Commissioned** into `artifact-product-lifecycle`. Everything before it is
issuer-internal and mutable; everything from it on is immutable and signed.

## 2. Transitions

| From → To | Guard |
|---|---|
| Drafted → Proposed | issuer signs; contract digest minted |
| Proposed → Drafted | maker rejects or negotiates; returns to mutable draft |
| Proposed → Withdrawn | issuer retracts **(terminal)** |
| Proposed → Accepted | maker countersignature verifies **(freeze)** |
| Accepted → Delivered | L0–L7 present and resolvable |
| Delivered → Fulfilled | k-of-n VSAs, zero dissent, conformance == FULL |
| Delivered → Breached | conformance == BREACH **(terminal)** |
| Accepted → Lapsed | `now > schedule.deliverBy`, nothing delivered **(terminal)** |
| Accepted → Accepted′ | **amendment** — new version, fresh countersignature, supersession pointer |

## 3. Amendment vs re-issue

The contract doc's §6 open question, resolved consistently with the rest of the
design: an in-flight scope change is a **version bump with an explicit
supersession pointer**, not a fresh contract. Same reasoning as the renewal loop
(`artifact-product-lifecycle` §5) — append-only, content-addressed, and the chain
records which contract *version* it fulfilled. A fresh contract would break the
audit trail of what changed and when.

Note the asymmetry with candidate renewal: a renewal is a **new lineage member**
under the same `osera.line`; an amendment is a **new version of the same
commitment**. Different edges, and they must not be collapsed.

## 4. Partial fulfilment — still open

If the maker fixes 4 of 5 in-scope CVEs: `PARTIAL` conformance that promotes with
the shortfall carried as explicit open exposure, or a breach that blocks? The
contract doc recommends PARTIAL-promotable, on the grounds that blocking punishes
honest partial delivery. **But** admission rule 13 requires
`conformance == "FULL"`, so as written the gate rejects it regardless. These
contradict; one must give. Flagged, not resolved.

## 5. The `osera.line` authoring moment

`noteworthy-candidate-key` fixed that the line is **declared, not derived** —
authored at commissioning and frozen into L-1. That judgement now has a screen
(`task-contract-authoring`). Whoever selects line "3" over "4" is creating or
continuing a **lineage**, and a mis-pick is a contract error caught at admission
rather than silent operational drift. The UI must present the existing
`(package, line)` projection over accepted contracts and make continuation vs
new-lineage an explicit, defaulted-to-nothing choice.

## 6. Relation to other artifacts

- `artifact-product-lifecycle` — consumes **Accepted** as its Commissioned entry.
- `artifact-architecture` §3.2, §3.5 — the L-1 contract and how it binds the chain.
- `artifact-data-model` — the L-1 row already exists; the pre-acceptance
  **draft** record is new, and is `mutable-operational` (the only issuer-side
  element that legitimately changes).
- `docs/osera-backpatch-contract.md` — the schema sketch and the §6 working-group
  questions this artifact partially resolves.

## 7. Open

- Partial fulfilment vs rule 13 (§4).
- Who may issue — any participant or the governance body only.
- Corpus provenance: should the supplemental test suite carry its own attestation.
- Schedule breach as flag vs failure (contract doc recommends flag-not-fail).
