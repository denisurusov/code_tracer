```yaml
id: artifact-product-lifecycle
type: artifact
title: code_tracer — Product candidate lifecycle
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T17:15:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  contentHash: 37d8d29a487a1e1e02ec3995be23d7d422179fab
  timestamp: 2026-07-17T17:15:00Z
createdAt: 2026-07-17T17:15:00Z
updatedAt: 2026-07-17T17:15:00Z
```
# code_tracer — Product candidate lifecycle

**Status:** accepted (`review: accepted`). One of three factored views of the
system; see §7. This is the *product* axis — the state machine of the candidate
artifact (the thing being built, tested, admitted, adopted, tracked). It is
distinct from the **evidence chain** (L-1…L9, `artifact-architecture` §3, *what
proof has accrued*) and the **data model** (records backing each state — a
separate artifact, still to come). The three map onto each other but are
different axes; keeping them separate is the "clean artifacts" refactor.

## 1. The boundary

Every state sits in one of two zones, split at the bank perimeter:

- **Outside — production.** The vendor's and quorum's infrastructure; evidence
  is *produced* here. code_tracer does not run in this zone.
- **Inside — bank.** Resolve, gate, adopt, track, sunset; evidence is
  *consumed* here, hermetic and offline. This is code_tracer.

## 2. States

| State | Zone | Meaning | Backed by |
|-------|------|---------|-----------|
| Commissioned | outside | L-1 backpatch contract issued and accepted; scope/baseline/corpus/schedule frozen | L-1 contract |
| Built | outside | hardened artifact produced; maker claims minted | L0–L7 |
| Verified | outside | independently rebuilt by the quorum, zero dissent | L8 (k-of-n VSAs) |
| Resolved | inside | attestation set discovered and collected inside the bank, keyed to the digest | component ③ |
| Gate | inside | under evaluation: structural + semantic + acceptance | components ①②④ |
| Adopted | inside | admitted, promoted to the golden repo, deployed | L9 |
| Active | inside | in production; within the bridge window; tracked | component ⑤ |
| Sunset | inside | the time-bound backpatch has lapsed | component ⑤ |
| **Rejected** | inside | terminal — an admission rule failed | (reason recorded) |
| **Retired** | inside | terminal — superseded by an upstream fix | — |

## 3. Transitions & guards

| From → To | Guard |
|-----------|-------|
| Commissioned → Built | vendor builds the hardened artifact; L0–L7 minted |
| Built → Verified | k-of-n verifiers rebuild and publish L8 VSAs; zero dissent |
| Verified → Resolved | crosses the bank boundary; resolver (③) collects the attestation set by digest |
| Resolved → Gate | gate invoked — layout compiled (①), Rego loaded (②), acceptance harness staged (④) |
| Gate → Adopted | structural + semantic + L9 acceptance all pass **(admit)** |
| Gate → Rejected | any admission rule fails, dissent present, or L9 fails **(terminal)** |
| Adopted → Active | promoted to golden repo, deployed; ledger (⑤) begins tracking |
| Active → Sunset | bridge window lapses |
| Sunset → Retired | the application has moved to an upstream-fixed release **(terminal)** |
| Sunset → Commissioned′ | **renewal** — a new, superseding candidate enters the loop (§5) |

## 4. Class (a)/(b) divergence — isolated to the top band

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

## 5. The renewal loop — superseding versions, not a status flip

A backpatch is a **bridge**: a deliberately temporary hardening of an old
version that closes the gap between "vulnerable now" and "upstream fix adoptable
later." It ships with a sunset date because a privately-maintained fork is itself
a standing liability. At sunset, exactly one of two things happens — Retire (the
proper upstream fix is now in reach) or **Renew**.

A renewal is modeled as a **new candidate that `supersedes` the prior one**, not
as the same record cycling back with a mutated status. The reason is that the
referent itself changes: each renewal is issued under its *own* L-1 contract,
with its own `baseline.digest` (a new functionality baseline) and its own
`cvesInScope` (very likely a new problem set discovered since the last bridge).
A status field could not represent this without silently overwriting the prior
contract it was verified against.

Consequences, which the data model inherits:

- **Append-only, content-addressed.** `commons-x:3.2.1-osera.1` and
  `…-osera.2` are two immutable records, each with its own frozen evidence
  chain, linked by a `supersedes` edge (osera.2 → osera.1).
- **Audit-answerable.** The bank can reconstruct exactly which bridge was in
  force at any past date, and what scope it covered — a question a mutable
  status field cannot answer after the fact.
- **Aligned with konspekt's grain** — append-only, superseding, hash-anchored —
  so the same discipline runs end to end.

## 6. Terminals

- **Rejected** — the candidate failed the gate. Terminal, with the failing rule
  recorded. A corrected re-submission is a *new* candidate, not a reopening.
- **Retired** — the bridge is no longer needed because the application adopted an
  upstream-fixed release. Clean exit; the ledger closes the exposure.

## 7. Relation to the other artifacts

- `artifact-architecture` — the integrating narrative. Its §3 (the L-1…L9
  attestation chain) is the *evidence* axis this lifecycle is threaded onto;
  its §4–§5 describe the gate and ledger that back the inside states. Once the
  data-model artifact exists, the architecture doc is demoted to overview and
  cross-references both.
- `artifact-data-model` *(pending)* — one record schema per state, keyed by
  digest, carrying the append-only/supersedes semantics fixed in §5.

## 8. Open items

- **Data model** — the next artifact; §2's states and §5's superseding-version
  rule are its fixed inputs.
- **Sunset signaling** — how far ahead of lapse the ledger (⑤) surfaces an
  Active candidate as approaching Sunset (an "expiring" sub-status vs a computed
  view) — deferred to the data model.
- **Architecture refactor** — demote `artifact-architecture` to integrating
  overview once the data model lands, so the factoring is done once.
