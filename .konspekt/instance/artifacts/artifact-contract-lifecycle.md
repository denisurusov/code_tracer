```yaml
id: artifact-contract-lifecycle
type: artifact
title: code_tracer — Project lifecycle (issuer side)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-26T17:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-26T17:00:00Z
```
# code_tracer — Project lifecycle (issuer side)

**Status:** accepted. The **first** of the three post-evidence axes, and the only
one that lives entirely *outside* the bank. It tracks a **project**: work on a
product within a particular scope, against one release line. The **contract** is
the L-1 instrument that scopes it — one contract per project — and the states
below are the states of that project as its contract is authored, signed,
delivered against and verified.

> **Amendment 2026-07-26 (`noteworthy-lifecycle-nouns`).** Retitled from
> *Contract lifecycle*. Project and contract are 1:1, so the state set is
> unchanged; naming the machine for the work rather than for the document makes
> it symmetric with the package and product machines, and matches the fact that
> Delivered and Fulfilled are states of the *work* rather than of the document.
> **maker → provider** and **mutualized → team** throughout.

**Why a separate artifact.** The three machines track different referents: this
one tracks a **commitment**, the package machine tracks an **artifact**, the
product machine tracks a **bridge**. They have different actors, different zones,
different terminal states, and a project can fail (withdrawn, breached, expired
unfulfilled) without any package ever existing.

## 1. States

| State | Actor | Meaning | Backed by |
|---|---|---|---|
| Drafted | issuer | governance, scope, baseline, corpus, schedule, `osera.line` authored; unsigned | draft record (mutable) |
| Proposed | issuer | issued to the provider for acceptance; terms frozen pending signature | L-1 candidate, signed by issuer |
| Accepted | provider | provider countersigns; scope/baseline/acceptanceCriteria immutable | **L-1 contract** (the root referent) |
| Delivered | provider | L0–L7 minted and handed off under a frozen delivery manifest | provider claims + delivery manifest |
| Fulfilled | quorum | k-of-n VSAs assert conformance == FULL | L8 set |
| **Withdrawn** | issuer | terminal — retracted before acceptance | reason recorded |
| **Breached** | quorum | terminal — delivered, non-conforming, not remediable under this version | VSA conformance BREACH |
| **Lapsed** | — | terminal — schedule expired with no delivery | derived from `schedule.deliverBy` |

`Accepted` is the hinge: it is the freeze, and it is the state the **package
machine opens from** (`artifact-product-lifecycle` §3). Everything before it is
issuer-internal and mutable; everything from it on is immutable and signed.

## 2. Transitions

| From → To | Guard |
|---|---|
| Drafted → Proposed | issuer signs; contract digest minted |
| Proposed → Drafted | provider rejects or negotiates; returns to mutable draft |
| Proposed → Withdrawn | issuer retracts **(terminal)** |
| Proposed → Accepted | provider countersignature verifies **(freeze)** |
| Accepted → Built | the package machine opens (`artifact-product-lifecycle` §3) |
| Accepted → Delivered | L0–L7 present and resolvable; **delivery manifest assembled by the provider, complete against `contract.requiredAttestations`, and its digest logged** |
| Delivered → Fulfilled | k-of-n VSAs, zero dissent, conformance == FULL |
| Delivered → Breached | conformance == BREACH **(terminal)** |
| Accepted → Lapsed | `now > schedule.deliverBy`, nothing delivered **(terminal)** |
| Accepted → Accepted′ | **amendment** — new version, fresh countersignature, supersession pointer |

**The delivery manifest is the hand-off freeze.** Provider-assembled, containing
L-1 + L0–L7, checked mechanically for completeness against the contract's
`requiredAttestations`, and frozen by a **transparency-log entry rather than a
signature** — establishing that this exact set existed at time T without
asserting anything about its correctness. It is a distinct container from the
evidence bundle: see `artifact-evidence-bundle` §1.

## 3. What the contract freezes

Beyond scope, baseline, corpus and schedule (architecture §3.2), issuance now
fixes two further things at Accepted:

- **`governance`** — mode (team | solo), sponsor, `mandateRef` digest and
  `trustPath`. Makes "was this properly commissioned?" checkable rather than
  assumed, and `trustPath` must agree with the namespace the artifact is signed
  under (`noteworthy-governance-modes`).
- **`verification.k`** — the quorum size in force at commissioning, computed as
  `max(3, ceil(n/3))` and written into the contract, so a package is judged
  against the quorum that applied when it was commissioned rather than one that
  drifted afterwards (`noteworthy-quorum-parameters`).

## 4. Amendment vs re-issue

An in-flight scope change is a **version bump with an explicit supersession
pointer**, rather than a fresh contract. Same reasoning as the renewal loop
(`artifact-product-lifecycle` §7) — append-only, content-addressed, and the chain
records which contract *version* it fulfilled. A fresh contract would break the
audit trail of what changed and when.

Note the asymmetry with renewal: a renewal is a **new project** under the same
`osera.line`; an amendment is a **new version of the same project's commitment**.
Different edges, and they must not be collapsed.

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
CVE moves to `explicitlyOutOfScope` with a stated reason, the provider
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

- `artifact-product-lifecycle` — the **package** machine opens from this
  artifact's Accepted state, and the **product** machine closes back onto it at
  renewal (Sunset → Drafted′).
- `artifact-evidence-bundle` — §1 there defines the delivery manifest this
  lifecycle freezes at Delivered, and the bundle assembled after Fulfilled.
- `artifact-architecture` §3.2, §3.5 — the L-1 contract and how it binds the chain.
- `artifact-data-model` §4 — the L-1 row, including `governance`; the
  pre-acceptance **draft** record and the **delivery manifest** are new elements.
- `noteworthy-lifecycle-nouns` — the decision that retitled this machine to the
  project axis.
- `docs/osera-backpatch-contract.md` — the schema sketch and the §6 working-group
  questions this artifact resolves.

## 8. Open

- **Who may issue** — resolved by `noteworthy-governance-modes`: by member vote
  in team mode, by the sponsoring bank in solo mode. What remains is the
  alliance's own process for validating a mandate.
- **The demand pipeline** — interest declarations, seconding threshold,
  prioritization ballot and contribution-weighted commissioning ballot feed
  Drafted in team mode. Described in `docs/osera-lifecycle.md`; not yet carrying
  its own noteworthy, and the threshold values and ballot weighting basis are
  unset.
- **Corpus provenance** — should the supplemental test suite carry its own
  attestation? It is executable code the provider is bound to; recommend yes,
  same argument as attesting the recipe set.
- **Schedule breach** — flag or failure? Contract doc recommends flag-not-fail: a
  late but correct backpatch is still valuable, and the schedule is for planning
  rather than gating security outcomes.
- **Contract-schema compatibility policy** — the L-1 schema is the interface
  between issuer and consumer sides; versioning and compatibility rules are
  unspecified (`noteworthy-two-sited-scope`).
