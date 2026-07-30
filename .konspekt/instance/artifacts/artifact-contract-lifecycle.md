```yaml
id: artifact-contract-lifecycle
type: artifact
title: code_tracer — Project lifecycle (issuer side)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-30T00:00:00Z
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

> **Amendment 2026-07-27.** §1's Proposed row said the state was backed by an
> "L-1 candidate". That was the last bare use of the retired noun in the graph,
> and it carried a *fourth* sense — a contract awaiting countersignature —
> distinct from all three grains the split identified, which is a fair measure
> of how overloaded the word had become. It now reads **proposed L-1**, chosen
> over *L-1 draft* because Drafted is the state immediately above it and reusing
> that word would blur two adjacent rows.

> **Amendment 2026-07-30 (`noteworthy-signer-verification`).** Fulfilled is
> reached when **every signatory** has published a conforming VSA with zero
> dissent, rather than when a computed k-of-n threshold is met. §3's
> `verification.k` is now the signatory set itself, and the contract additionally
> freezes digest-pinned **rebuild inputs** so any bound party — and any bank
> adopting later — can reproduce the build (`noteworthy-adoption-rebuild`). A
> team-mode project needs at least two signatories to exist at all, which makes
> co-funding a precondition of commissioning rather than only of verification.

**Why a separate artifact.** The three machines track different referents: this
one tracks a **commitment**, the package machine tracks an **artifact**, the
product machine tracks a **bridge**. They have different actors, different zones,
different terminal states, and a project can fail (withdrawn, breached, expired
unfulfilled) without any package ever existing.

## 1. States

| State | Actor | Meaning | Backed by |
|---|---|---|---|
| Drafted | issuer | governance, scope, baseline, corpus, schedule, `osera.line` authored; unsigned | draft record (mutable) |
| Proposed | issuer | issued to the provider for acceptance; terms frozen pending signature | proposed L-1, signed by issuer |
| Accepted | provider | provider countersigns; scope/baseline/acceptanceCriteria immutable | **L-1 contract** (the root referent) |
| Delivered | provider | L0–L7 minted and handed off under a frozen delivery manifest | provider claims + delivery manifest |
| Fulfilled | signatories | every signatory's VSA asserts conformance == FULL, zero dissent | L8 set |
| **Withdrawn** | issuer | terminal — retracted before acceptance | reason recorded |
| **Breached** | signatories | terminal — delivered, non-conforming, not remediable under this version | VSA conformance BREACH |
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
| Delivered → Fulfilled | a conforming VSA from **every** signatory, zero dissent, conformance == FULL |
| Delivered → Breached | conformance == BREACH **(terminal)** |
| Accepted → Lapsed | `now > schedule.deliverBy`, nothing delivered **(terminal)** |
| Accepted → Accepted′ | **amendment** — new version, fresh countersignature, supersession pointer |

**A signatory that never verifies stalls the project.** Fulfilled requires the
whole signatory set, so an unperformed verification duty is indistinguishable
from late delivery in the terminal record: the project simply reaches
`deliverBy` and Lapses. The two failures deserve different responses and produce
the same state, which is why time-to-verify is a figure the operating layer has
to measure rather than a rule the machine can enforce.

**The delivery manifest is the hand-off freeze.** Provider-assembled, containing
L-1 + L0–L7, checked mechanically for completeness against the contract's
`requiredAttestations`, and frozen by a **transparency-log entry rather than a
signature** — establishing that this exact set existed at time T without
asserting anything about its correctness. It is a distinct container from the
evidence bundle: see `artifact-evidence-bundle` §1.

## 3. What the contract freezes

Beyond scope, baseline, corpus and schedule (architecture §3.2), issuance fixes
three further things at Accepted:

- **`governance`** — mode (team | solo), sponsor, `mandateRef` digest,
  `trustPath`, and the **signatory set**. Makes "was this properly
  commissioned?" and "who owes verification?" both checkable rather than assumed,
  and `trustPath` must agree with the namespace the artifact is signed under
  (`noteworthy-governance-modes`).
- **`verification.k`** — **the signatory set itself**, frozen at acceptance.
  Every signatory verifies and all must agree; team mode requires at least two,
  solo has exactly one. The parties carrying the financial risk are the parties
  that check the work, which removes verifier assignment as a problem rather than
  solving it. Judged against the set that applied when it was commissioned, so a
  membership change mid-delivery cannot move the target
  (`noteworthy-signer-verification`).
- **Rebuild inputs** — source locator and digest, transformation digest, and
  toolchain locator and digest. Pinned by digest and never by tag: a tag is a
  mutable pointer that would reintroduce a live dependency. These are what let a
  signatory verify outside the perimeter and, later, any adopting bank rebuild
  inside its own (`noteworthy-adoption-rebuild`).

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
- `artifact-architecture` §3.2, §3.5, §3.6 — the L-1 contract, how it binds the
  chain, and who verifies it.
- `artifact-data-model` §4 — the L-1 row, including `governance`; the
  pre-acceptance **draft** record and the **delivery manifest** are new elements.
- `noteworthy-lifecycle-nouns` — the decision that retitled this machine to the
  project axis.
- `docs/historical/osera-backpatch-contract.md` — the schema sketch and the §6
  working-group questions this artifact resolves.

## 8. Open

- **Who may issue** — resolved by `noteworthy-governance-modes`: by member vote
  in team mode, by the sponsoring bank in solo mode. What remains is the
  alliance's own process for validating a mandate.
- **The demand pipeline** — interest declarations, seconding threshold,
  prioritization ballot and contribution-weighted commissioning ballot feed
  Drafted in team mode. Described in `docs/lifecycle.md`; not yet carrying its
  own noteworthy, and the threshold values and ballot weighting basis are unset.
  The pipeline now has a hard precondition it did not have before: a team-mode
  project needs a second signatory before it can be commissioned at all.
- **Provider selection** — the contract records which provider was chosen, and
  the mandate records the authorisation. Who selects, and against what criteria,
  is alliance policy and unsettled.
- **Corpus provenance** — should the supplemental test suite carry its own
  attestation? It is executable code the provider is bound to; recommend yes,
  same argument as attesting the recipe set.
- **Schedule breach** — flag or failure? Contract doc recommends flag-not-fail: a
  late but correct backpatch is still valuable, and the schedule is for planning
  rather than gating security outcomes.
- **Contract-schema compatibility policy** — the L-1 schema is the interface
  between issuer and consumer sides; versioning and compatibility rules are
  unspecified (`noteworthy-two-sited-scope`).
