```yaml
id: artifact-contract-lifecycle
type: artifact
title: code_tracer — Contract lifecycle (issuer side)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T19:30:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T19:30:00Z
```
# code_tracer — Contract lifecycle (issuer side)

**Status:** accepted. The **fourth** factored axis, and the first that lives
*outside* the bank. `artifact-product-lifecycle` opens at **Commissioned**,
defined as "L-1 issued and accepted" — everything that *produces* that state was
unmodeled while the issuer side was out of scope. It no longer is
(`noteworthy-two-sited-scope`).

> **Provenance of amendments.** §2's delivery-manifest guard, §4 and §6 derive
> from excerpts `b73f250d059666768988095d440fa673548ef9d2`,
> `05038f93a541216c0f6713ea13bcff58a40d823d`,
> `362e1ebe2a81cdfabf6b106db12db1e3ade7531a` and
> `19c83a6696b0385da970572660b26d3871318fad`.

**Why a separate artifact, not a section.** The two machines track different
referents: this one tracks a **commitment**, the candidate lifecycle tracks an
**artifact**. They have different actors, different zones, different terminal
states, and a contract can fail (withdrawn, breached, expired unfulfilled)
without any candidate ever existing. Bolting this onto §2 of the candidate
lifecycle would conflate a promise with a thing.

## 1. States

| State | Actor | Meaning | Backed by |
|---|---|---|---|
| Drafted | issuer | governance, scope, baseline, corpus, schedule, `osera.line` authored; unsigned | draft record (mutable) |
| Proposed | issuer | issued to the maker for acceptance; terms frozen pending signature | L-1 candidate, signed by issuer |
| Accepted | maker | maker countersigns; scope/baseline/acceptanceCriteria immutable | **L-1 contract** (the root referent) |
| Delivered | maker | L0–L7 minted and handed off under a frozen delivery manifest | maker claims + delivery manifest |
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
| Accepted → Delivered | L0–L7 present and resolvable; **delivery manifest assembled by the maker, complete against `contract.requiredAttestations`, and its digest logged** |
| Delivered → Fulfilled | k-of-n VSAs, zero dissent, conformance == FULL |
| Delivered → Breached | conformance == BREACH **(terminal)** |
| Accepted → Lapsed | `now > schedule.deliverBy`, nothing delivered **(terminal)** |
| Accepted → Accepted′ | **amendment** — new version, fresh countersignature, supersession pointer |

**The delivery manifest is the hand-off freeze.** Maker-assembled, containing
L-1 + L0–L7, checked mechanically for completeness against the contract's
`requiredAttestations`, and frozen by a **transparency-log entry rather than a
signature** — establishing that this exact set existed at time T without
asserting anything about its correctness. It is *not* the evidence bundle: see
`artifact-evidence-bundle` §1.

## 3. What the contract freezes

Beyond scope, baseline, corpus and schedule (architecture §3.2), issuance now
fixes two further things at Accepted:

- **`governance`** — mode (mutualized | solo), sponsor, `mandateRef` digest and
  `trustPath`. Makes "was this properly commissioned?" checkable rather than
  assumed, and `trustPath` must agree with the namespace the artifact is signed
  under (`noteworthy-governance-modes`).
- **`verification.k`** — the quorum size in force at commissioning, computed as
  `max(3, ceil(n/3))` and written into the contract, so an artifact is judged
  against the quorum that applied when it was commissioned rather than one that
  drifted afterwards (`noteworthy-quorum-parameters`).

## 4. Amendment vs re-issue

An in-flight scope change is a **version bump with an explicit supersession
pointer**, not a fresh contract. Same reasoning as the renewal loop
(`artifact-product-lifecycle` §5) — append-only, content-addressed, and the chain
records which contract *version* it fulfilled. A fresh contract would break the
audit trail of what changed and when.

Note the asymmetry with candidate renewal: a renewal is a **new lineage member**
under the same `osera.line`; an amendment is a **new version of the same
commitment**. Different edges, and they must not be collapsed.

Amendment is also the **only** route by which a shortfall reaches admission —
see §5.

## 5. Partial fulfilment — resolved

**Settled by `noteworthy-conformance-binary`.** Conformance at the gate is
binary: `FULL` promotes, `PARTIAL` and `BREACH` never do, and admission rule 13
stands unamended. The contract doc's §6 item 2 recommendation
(PARTIAL-promotable) is rejected — the L-1 contract is on a path to
smart-contract execution and executable terms have no room for a discretionary
middle state.

An honest shortfall therefore routes through **amendment** (§4): the unfixable
CVE moves to `explicitlyOutOfScope` with a stated reason, the maker
re-countersigns, and delivery is `FULL` against a contract that tells the truth.
The residual exposure ends up in a signed contract rather than in a softened gate
verdict.

## 6. The `osera.line` authoring moment

`noteworthy-candidate-key` fixed that the line is **declared, not derived** —
authored at commissioning and frozen into L-1. That judgement has a screen
(`task-contract-authoring`). Whoever selects line "3" over "4" is creating or
continuing a **lineage**, and a mis-pick is a contract error caught at admission
rather than silent operational drift. The UI must present the existing
`(package, line)` projection over accepted contracts and make continuation vs
new-lineage an explicit, defaulted-to-nothing choice.

## 7. Relation to other artifacts

- `artifact-product-lifecycle` — consumes **Accepted** as its Commissioned entry.
- `artifact-evidence-bundle` — §1 there defines the delivery manifest this
  lifecycle freezes at Delivered, and the bundle assembled after Fulfilled.
- `artifact-architecture` §3.2, §3.5 — the L-1 contract and how it binds the chain.
- `artifact-data-model` §4 — the L-1 row, including `governance`; the
  pre-acceptance **draft** record and the **delivery manifest** are new elements.
- `docs/osera-backpatch-contract.md` — the schema sketch and the §6 working-group
  questions this artifact resolves.

## 8. Open

- **Who may issue** — resolved by `noteworthy-governance-modes`: by member vote
  in mutualized mode, by the sponsoring bank in solo mode. What remains is the
  alliance's own process for validating a mandate.
- **Corpus provenance** — should the supplemental test suite carry its own
  attestation? It is executable code the maker is bound to; recommend yes, same
  argument as attesting the recipe set.
- **Schedule breach** — flag or failure? Contract doc recommends flag-not-fail: a
  late but correct backpatch is still valuable, and the schedule is for planning
  rather than gating security outcomes.
- **Contract-schema compatibility policy** — the L-1 schema is the interface
  between issuer and consumer sides; versioning and compatibility rules are
  unspecified (`noteworthy-two-sited-scope`).
