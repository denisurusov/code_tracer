```yaml
id: artifact-product-lifecycle
type: artifact
title: code_tracer — Package and product lifecycles
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  contentHash: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  timestamp: 2026-07-17T17:15:00Z
createdAt: 2026-07-17T17:15:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# code_tracer — Package and product lifecycles

**Status:** accepted (`review: accepted`). Two of the factored views of the
system; see §9. This artifact holds the two machines that run *after* the
project machine freezes: the **package** machine (the hardened artifact being
built, verified, admitted) and the **product** machine (the bridge being tracked,
lapsing, succeeded). They are distinct from the **evidence chain** (L-1…L9,
`artifact-architecture` §3, *what proof has accrued*), the **project machine**
(`artifact-contract-lifecycle`, *what was commissioned*), and the **data model**
(`artifact-data-model`, *what records back each state*).

> **Amendment 2026-07-26 (`noteworthy-lifecycle-nouns`).** This artifact
> previously described a single "candidate" machine spanning Commissioned →
> Sunset. That word covered three grains. It is retired here:
>
> - **Commissioned** is dropped as a duplicate of the project machine's
>   **Accepted** (`artifact-contract-lifecycle` §1 already names Accepted as the
>   state that emits it). The package machine opens at **Accepted → Built**.
> - **Built, Verified, Resolved, Gate, Adopted, Rejected** are package-grain,
>   keyed by `hardened_digest`. §2–§3.
> - **Active, Sunset, Retired** are product-grain, keyed by lineage. §4–§5.
>
> `candidateKey` is renamed **`lineKey`** in the same pass
> (`noteworthy-candidate-key`, amended).

> **Amendment 2026-07-27.** The identifier rename pass is complete.
> `candidate-version` → **`package-version`** and `verdict.candidateRef` →
> **`packageRef`** (`noteworthy-lifecycle-nouns`, amended), alongside
> **maker → provider** and **mutualized → team** across every artifact.

> **Amendment 2026-07-30 (`noteworthy-signer-verification`,
> `noteworthy-adoption-rebuild`).** Verified is reached when **every contract
> signatory** has published a conforming VSA with zero dissent. The
> **Verified → Resolved** transition also carries the adopting bank's **own
> rebuild**, identical in both governance modes.

> **Amendment 2026-07-31 (`noteworthy-successor-project`,
> `noteworthy-service-level-parameters`).** §7 is retitled: what was a *renewal
> loop* is a **successor project**, and nothing is renewed. §5's Sunset →
> Drafted′ transition is a successor entering the demand pipeline at nomination,
> not a loop back to the ballot. §10's sunset-signalling item is **closed by
> formula** — the notice window is derived rather than chosen.

## 1. The boundary

Every state sits in one of two zones, split at the bank perimeter:

- **Outside — production.** The provider's and the signatories' infrastructure;
  evidence is *produced* here. The consumer side of code_tracer does not run
  here.
- **Inside — bank.** Resolve, rebuild, gate, adopt, track, sunset; evidence is
  *consumed* here, and the gate itself runs hermetic and offline.

The crossing itself is a copy of a self-contained evidence bundle
(`artifact-evidence-bundle`), never a protocol.

**Resolution is the last online step**, and the bank's own rebuild happens there
with it. Everything after the envelope is sealed reads only what the envelope
contains.

## 2. Package machine — states

Digest-keyed. Every state below is a statement about one `hardened_digest`.

| State | Zone | Meaning | Backed by |
|-------|------|---------|-----------|
| Built | outside | hardened artifact produced; provider claims minted | L0–L7 |
| Verified | outside | independently rebuilt by every contract signatory, zero dissent | L8 set |
| Resolved | inside | evidence bundle collected and sealed, and the bank's own rebuild done | component ③ |
| Gate | inside | under evaluation: structural + semantic + acceptance | components ①②④ |
| Adopted | inside | admitted, promoted to the golden repo | L9 |
| **Rejected** | inside | terminal — an admission rule failed | (failing rule recorded) |

**Adopted is the last package state.** It mints L9 over a digest, which is
package-grain, and it opens the exposure row, which is product-grain. Assigning
it here puts the grain seam exactly where `artifact-data-model` §2 already draws
it: immutable rows born in the production-and-admission span, mutable rows living
in the operational afterlife.

## 3. Package machine — transitions & guards

| From → To | Guard |
|-----------|-------|
| Accepted → Built | project frozen (`artifact-contract-lifecycle`); provider builds the hardened artifact; L0–L7 minted |
| Built → Verified | every signatory rebuilds and publishes an L8; zero dissent; conformance FULL |
| Verified → Resolved | crosses the bank boundary; resolver (③) discovers the attestation set, **rebuilds the package from the core's pinned references and signs the bank's own L8**, then assembles the ingest envelope over the evidence core and seals it |
| Resolved → Gate | gate invoked — layout compiled and recompiled locally (①), Rego loaded (②), acceptance harness staged (④) |
| Gate → Adopted | structural + semantic + L9 acceptance all pass **(admit)** |
| Gate → Rejected | any admission rule fails, dissent present, or L9 fails **(terminal)** |
| Adopted → Active | **the handover** — L9 minted over the digest; the exposure opens against the lineage |

**The bank's rebuild sits in the transition rather than in the gate**, because it
needs the network and the gate must not. Its inputs are fetched from digest-pinned
references the core carries; its output is one signed record, which is all the
gate reads. A rebuild that fails to reproduce the digest is dissent like any
other, and the package never reaches Gate
(`noteworthy-adoption-rebuild`).

## 4. Product machine — states

Keyed by `lineKey`. Lapse and exposure attach to the bridge rather than to a
digest, which is why the key is version-less (`noteworthy-candidate-key`).

| State | Zone | Meaning | Backed by |
|-------|------|---------|-----------|
| Active | inside | in production; within the bridge window; tracked | component ⑤ |
| Sunset | inside | the time-bound backpatch has lapsed | component ⑤ |
| **Retired** | inside | terminal — superseded by an upstream fix | — |

`Expiring` is a computed view over the ledger row rather than a stored state
(`artifact-data-model` §5).

## 5. Product machine — transitions & guards

| From → To | Guard |
|-----------|-------|
| Adopted → Active | promoted to golden repo, deployed; ledger (⑤) writes `issued` and begins tracking |
| Active → Sunset | bridge window lapses |
| Sunset → Retired | the application has moved to an upstream-fixed release **(terminal)** |
| Sunset → Drafted′ | a **successor project** was commissioned against the same line and has reached Accepted (§7) |

The last row is not a loop. `Drafted′` belongs to a *different* project, which
entered the demand pipeline at nomination and ran the whole of it — seconding,
prioritisation, commissioning ballot, issuance. What connects the two is
`osera.line` and a `supersedes` edge, not a shortcut through the pipeline
(`noteworthy-successor-project`).

## 6. Class (a)/(b) divergence — isolated to the top band

The two ingest classes differ *only* in what Built and Verified mean:

- **(a) backpatched OSS** — Built/Verified are about a baseline and its
  transformation (L0–L7 as written, vuln-proof against the prior artifact).
- **(b) FINOS-native** — no baseline; Built/Verified collapse to project
  health, origin, and provenance of new code.

**From Resolved inward the machine is class-agnostic.** The gate, adoption,
ledger, and sunset behave identically regardless of class. This invariant is
load-bearing: it is what lets the gate be a single parameterized tool rather
than two, and the data model relies on it (one record shape inside the boundary,
class only tags the production-side evidence).

The same invariant holds across governance modes: from Resolved inward, a team
package and a solo package are handled identically, including the bank's own
rebuild. Mode changes what accompanied the package across the perimeter, never
what happens to it after.

## 7. Successor projects — nothing is renewed

A backpatch is a **bridge**: a deliberately temporary hardening of an old
version that closes the gap between "vulnerable now" and "upstream fix adoptable
later." It ships with a sunset date because a privately-maintained fork is itself
a standing liability. At sunset, exactly one of two things happens — **Retire**
(the proper upstream fix is now in reach) or a **successor project**.

**A successor is a fresh commissioning decision in every respect.** Its own
contract, its own `baseline.digest`, very likely its own CVE set discovered since
the last bridge, its own signatories, its own money. It is nominated, seconded,
prioritised and commissioned like any other project. The only thing carried over
is `contract.osera.line`, and a line is a **label rather than a funding
decision** (`noteworthy-successor-project`).

The word *renewal* was retired because it implied otherwise, and the implication
was load-bearing: it produced a serious proposal that a renewal could skip the
commissioning ballot under a standing authorisation for its line, on the grounds
that the alliance had already decided the bridge was worth funding. It had
decided the *previous* bridge was, against different inputs and possibly with
different members paying.

What genuinely continues, and is unaffected:

- **Append-only, content-addressed.** `commons-x:3.2.1-osera.1` and
  `…-osera.2` are two immutable `package-version` records, each with its own
  frozen evidence chain, linked by a `supersedes` edge (osera.2 → osera.1).
- **Audit-answerable.** The bank can reconstruct exactly which bridge was in
  force at any past date, and what scope it covered — a question a mutable
  status field cannot answer after the fact.
- **Lineage-stable.** `lineKey` (version-less upstream purl +
  `contract.osera.line`) is constant across the supersedes chain, so the
  state-pointer and ledger follow successors. A successor that jumps lines is a
  new lineage: the old line Retires and a new one starts fresh.
- **Aligned with konspekt's grain** — append-only, superseding, hash-anchored —
  so the same discipline runs end to end.

These are continuities of **lineage**. What does not continue is the
**commitment**, and one word had been conflating the two.

## 8. Terminals

- **Rejected** — the package failed the gate. Terminal, with the failing rule
  recorded. A corrected re-submission is a *new* package under a *new* project,
  never a reopening.
- **Retired** — the bridge is no longer needed because the application adopted an
  upstream-fixed release. Clean exit; the ledger closes the exposure.

## 9. Relation to the other artifacts

- `artifact-contract-lifecycle` — the **project** machine, whose Accepted state
  is this artifact's entry point (§3), and whose terminal states now have a
  defined route out (`noteworthy-failure-vote`).
- `artifact-architecture` — the integrating narrative. Its §3 (the L-1…L9
  attestation chain) is the *evidence* axis these machines are threaded onto;
  its §3.6 names who verifies, and §4–§5 describe the gate and ledger that back
  the inside states.
- `artifact-evidence-bundle` — what crosses at Verified → Resolved, and the
  rebuild references the bank's own reproduction runs from.
- `artifact-data-model` — one record schema per state, keyed by digest on the
  package side and by lineage on the product side, carrying the
  append-only/supersedes semantics fixed in §7.
- `artifact-operating-model` — who performs each transition, on what clock. Its
  §5 formula supplies the notice window §10 used to leave open.
- `noteworthy-lifecycle-nouns` — the decision that split this artifact in two.

## 10. Open items

- **Sunset signalling — closed by formula.** How far ahead of lapse the ledger
  (⑤) surfaces an Active product as approaching Sunset is
  `WINDOW_NOTICE`, computed from the service-level parameters rather than chosen
  (`artifact-operating-model` §5,
  `noteworthy-service-level-parameters`). The window must cover a whole
  commissioning cycle, because a successor runs the full pipeline — which makes
  `CADENCE_BALLOT` its dominant term. What remains open is the **values**, and
  those are policy rather than design.
- **Multi-package products** — a product shipping as several packages currently
  yields one lineage per package, so one backpatch touching three modules is
  three lineages for one project.
- **Rebuild cost at Resolved** — the bank's own reproduction costs roughly what
  production cost, per package, per adopting institution. Accepted as the price
  of mode-independent admission; whether an estate absorbs it at scale is a
  rollout question the topology has to answer.
