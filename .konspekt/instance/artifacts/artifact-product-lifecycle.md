```yaml
id: artifact-product-lifecycle
type: artifact
title: code_tracer — Package and product lifecycles
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  contentHash: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  timestamp: 2026-07-17T17:15:00Z
createdAt: 2026-07-17T17:15:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# code_tracer — Package and product lifecycles

**Status:** accepted (`review: accepted`). Two of the factored views of the
system; see §9. This artifact holds the two machines that run *after* the
project machine freezes: the **package** machine (the hardened artifact being
built, verified, admitted) and the **product** machine (the bridge being tracked,
lapsing, renewing). They are distinct from the **evidence chain** (L-1…L9,
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
> **maker → provider** and **mutualized → team** across every artifact. The
> retired noun now survives only where it names the decision that retired it,
> and in the entity id `noteworthy-candidate-key`, which keeps its name because
> renaming a content-addressed id would orphan the citations to it.

> **Amendment 2026-07-30 (`noteworthy-signer-verification`,
> `noteworthy-adoption-rebuild`).** Verified is reached when **every contract
> signatory** has published a conforming VSA with zero dissent, replacing the
> k-of-n threshold. The **Verified → Resolved** transition now also carries the
> adopting bank's **own rebuild**, which runs while the resolver is still online
> and produces an L8 the bank signs itself. This is identical in both governance
> modes, and it is what keeps solo output consumable without a weaker tier.

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
| Resolved | inside | evidence bundle collected and sealed inside the bank, and the bank's own rebuild done | component ③ |
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
| Sunset → Drafted′ | **renewal** — a new project is drafted against the same line (§7) |

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

The same invariant now holds across governance modes: from Resolved inward, a
team package and a solo package are handled identically, including the bank's own
rebuild. Mode changes what accompanied the package across the perimeter, never
what happens to it after.

## 7. The renewal loop — superseding versions

A backpatch is a **bridge**: a deliberately temporary hardening of an old
version that closes the gap between "vulnerable now" and "upstream fix adoptable
later." It ships with a sunset date because a privately-maintained fork is itself
a standing liability. At sunset, exactly one of two things happens — Retire (the
proper upstream fix is now in reach) or **Renew**.

A renewal is modeled as a **new project whose package `supersedes` the prior
one**, with the same record cycling back under a mutated status explicitly
rejected. The reason is that the referent itself changes: each renewal is issued
under its *own* L-1 contract, with its own `baseline.digest` (a new functionality
baseline) and its own `cvesInScope` (very likely a new problem set discovered
since the last bridge). A status field could not represent this without silently
overwriting the prior contract it was verified against.

Consequences, which the data model inherits:

- **Append-only, content-addressed.** `commons-x:3.2.1-osera.1` and
  `…-osera.2` are two immutable `package-version` records, each with its own
  frozen evidence chain, linked by a `supersedes` edge (osera.2 → osera.1).
- **Audit-answerable.** The bank can reconstruct exactly which bridge was in
  force at any past date, and what scope it covered — a question a mutable
  status field cannot answer after the fact.
- **Lineage-stable.** `lineKey` (version-less upstream purl +
  `contract.osera.line`) is constant across the supersedes chain, so the
  state-pointer and ledger follow renewals. A renewal that jumps lines is a new
  lineage: the old line Retires and a new one starts with a fresh project.
- **Aligned with konspekt's grain** — append-only, superseding, hash-anchored —
  so the same discipline runs end to end.

A renewal also re-enters at the **commissioning ballot** rather than at
nomination: the lineage was already voted in, and a continuation carries the same
`osera.line`. What it does need is a signatory set of its own, which may differ
from the original project's.

## 8. Terminals

- **Rejected** — the package failed the gate. Terminal, with the failing rule
  recorded. A corrected re-submission is a *new* package under a *new* project,
  never a reopening.
- **Retired** — the bridge is no longer needed because the application adopted an
  upstream-fixed release. Clean exit; the ledger closes the exposure.

## 9. Relation to the other artifacts

- `artifact-contract-lifecycle` — the **project** machine, whose Accepted state
  is this artifact's entry point (§3).
- `artifact-architecture` — the integrating narrative. Its §3 (the L-1…L9
  attestation chain) is the *evidence* axis these machines are threaded onto;
  its §3.6 names who verifies, and §4–§5 describe the gate and ledger that back
  the inside states.
- `artifact-evidence-bundle` — what crosses at Verified → Resolved, and the
  rebuild references the bank's own reproduction runs from.
- `artifact-data-model` — one record schema per state, keyed by digest on the
  package side and by lineage on the product side, carrying the
  append-only/supersedes semantics fixed in §7.
- `noteworthy-lifecycle-nouns` — the decision that split this artifact in two.

## 10. Open items

- **Sunset signaling** — how far ahead of lapse the ledger (⑤) surfaces an
  Active product as approaching Sunset. The computed-view decision is settled
  (`artifact-data-model` §5); the window value is not, and it should be derived
  from the renewal path's own durations rather than picked, since the notice has
  to cover commissioning, delivery, verification and admission.
- **Multi-package products** — a product shipping as several packages currently
  yields one lineage per package, so one backpatch touching three modules is
  three lineages for one project.
- **Rebuild cost at Resolved** — the bank's own reproduction costs roughly what
  production cost, per package, per adopting institution. Accepted as the price
  of mode-independent admission; whether an estate can absorb it at scale is a
  rollout question the topology has to answer.
