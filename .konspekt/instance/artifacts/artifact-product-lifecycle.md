```yaml
id: artifact-product-lifecycle
type: artifact
title: code_tracer — Package and product lifecycles
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-26T18:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  contentHash: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  timestamp: 2026-07-17T17:15:00Z
createdAt: 2026-07-17T17:15:00Z
updatedAt: 2026-07-26T18:00:00Z
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
> (`noteworthy-candidate-key`, amended); `candidate-version` survives as a field
> name pending the rest of the rename.

## 1. The boundary

Every state sits in one of two zones, split at the bank perimeter:

- **Outside — production.** The provider's and quorum's infrastructure; evidence
  is *produced* here. The consumer side of code_tracer does not run here.
- **Inside — bank.** Resolve, gate, adopt, track, sunset; evidence is
  *consumed* here, hermetic and offline.

The crossing itself is a copy of a self-contained evidence bundle
(`artifact-evidence-bundle`), never a protocol.

## 2. Package machine — states

Digest-keyed. Every state below is a statement about one `hardened_digest`.

| State | Zone | Meaning | Backed by |
|-------|------|---------|-----------|
| Built | outside | hardened artifact produced; provider claims minted | L0–L7 |
| Verified | outside | independently rebuilt by the quorum, zero dissent | L8 (k-of-n VSAs) |
| Resolved | inside | evidence bundle collected and sealed inside the bank, keyed to the digest | component ③ |
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
| Built → Verified | k-of-n verifiers rebuild and publish L8 VSAs; zero dissent |
| Verified → Resolved | crosses the bank boundary; resolver (③) assembles the ingest envelope over the evidence core and seals it |
| Resolved → Gate | gate invoked — layout compiled and recompiled locally (①), Rego loaded (②), acceptance harness staged (④) |
| Gate → Adopted | structural + semantic + L9 acceptance all pass **(admit)** |
| Gate → Rejected | any admission rule fails, dissent present, or L9 fails **(terminal)** |
| Adopted → Active | **the handover** — L9 minted over the digest; the exposure opens against the lineage |

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
  `…-osera.2` are two immutable package records, each with its own frozen
  evidence chain, linked by a `supersedes` edge (osera.2 → osera.1).
- **Audit-answerable.** The bank can reconstruct exactly which bridge was in
  force at any past date, and what scope it covered — a question a mutable
  status field cannot answer after the fact.
- **Lineage-stable.** `lineKey` (version-less upstream purl +
  `contract.osera.line`) is constant across the supersedes chain, so the
  state-pointer and ledger follow renewals. A renewal that jumps lines is a new
  lineage: the old line Retires and a new one starts with a fresh project.
- **Aligned with konspekt's grain** — append-only, superseding, hash-anchored —
  so the same discipline runs end to end.

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
  its §4–§5 describe the gate and ledger that back the inside states.
- `artifact-evidence-bundle` — what crosses at Verified → Resolved.
- `artifact-data-model` — one record schema per state, keyed by digest on the
  package side and by lineage on the product side, carrying the
  append-only/supersedes semantics fixed in §7.
- `noteworthy-lifecycle-nouns` — the decision that split this artifact in two.

## 10. Open items

- **Sunset signaling** — how far ahead of lapse the ledger (⑤) surfaces an
  Active product as approaching Sunset. The computed-view decision is settled
  (`artifact-data-model` §5); the window value is not.
- **Identifier rename pass** — `candidateKey` is now `lineKey`;
  `candidate-version` is package-grain and still carries the retired noun.
- **Multi-package products** — a product shipping as several packages currently
  yields one lineage per package, so one backpatch touching three modules is
  three lineages for one project.
