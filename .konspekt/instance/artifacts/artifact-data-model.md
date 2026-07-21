```yaml
id: artifact-data-model
type: artifact
title: code_tracer — Data model
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T16:55:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 259d3019f66d621539c97fbba96ac8d3ad138e53
  contentHash: 259d3019f66d621539c97fbba96ac8d3ad138e53
  timestamp: 2026-07-17T17:45:00Z
createdAt: 2026-07-17T17:45:00Z
updatedAt: 2026-07-21T16:55:00Z
```
# code_tracer — Data model

**Status:** accepted (`review: accepted`). The third factored axis: the *records*
that back each state of the product lifecycle. It sits on
`artifact-product-lifecycle` (states/transitions) and `artifact-architecture`
§3 (the L-1…L9 evidence chain), and is organized by **facets** — orthogonal
qualities an element can carry several of at once, each contributing a reusable
schema mixin.

> **Amendment 2026-07-21.** §4 (`verdict`, `policy-object`) and §5
> (`ledger-event`) amended per the issuer-side batch — excerpts
> `c284e12b3f1e77a4f712644a85aba7e8195b4648` and
> `b73f250d059666768988095d440fa673548ef9d2`. The binding records
> (`noteworthy-trust-root-ownership`, `noteworthy-compiler-siting`,
> `artifact-evidence-bundle`) are `review: proposed` pending the architecture
> pass; these field additions are applied on human commit ahead of that.

## 1. Facets

An element's qualities are not mutually-exclusive categories; they are
orthogonal facets, and each facet carries its own shared machinery:

- **evidence** — plays a role in the attestation chain; carries a level
  (L-1…L9), a `subject` (purl + digest), `inputs[]` (attestation digests — the
  DAG edges), and a verify hook.
- **standard-bound** — conforms to an external spec; carries `predicateType`,
  `schema`, `validator` (in-toto, SLSA, CycloneDX, OpenVEX, DSSE, purl).
- **immutable** — content-addressed, append-only; never edited, only
  *superseded* — a chain candidate (lifecycle §5).
- **signed** — has an authenticated author (DSSE envelope + signer identity).
  Distinct from evidence: authorship vs role.
- **mutable-operational** — the deliberate opposite of immutable: bank-side
  state that legitimately changes. Named explicitly so nothing that must move is
  accidentally content-addressed.
- **zone** — produced outside vs created inside the bank; sets trust handling.

A seventh column, **lifecycle phase**, records which state *creates/owns* the
element. It is a mapping onto `artifact-product-lifecycle`, not a facet.

## 2. Element inventory

`ev` evidence · `std` standard-bound · `imm` immutable · `sig` signed.

| Element | ev | std | imm | sig | zone | lifecycle phase | grain |
|---|:---:|:---:|:---:|:---:|:---:|---|---|
| Attestations L-1…L9 | ✓ | ✓ | ✓ | ✓ | out (L9 in) | Commissioned→Adopted (accrue) | immutable |
| Compiled layout ① + Rego policy ② | — | ✓ | ✓ | ✓ | in | Gate (compiled from L-1) | immutable |
| Candidate version (digest + snapshot) | — | ~ purl | ✓ | — | spans | Commissioned (exists across all) | immutable |
| Admission verdict (gate-run record) | ✓ | ~ | ✓ | ✓ | in | Gate | immutable |
| Supersedes link (version → prior) | — | — | ✓ | — | in | Sunset (at renewal) | immutable |
| Current-state pointer | — | — | ✗ | — | in | all (recomputed each transition) | projection |
| Ledger event (append-only, hash-chained) | — | — | ✗ | — | in | Adopted→Sunset | append-only |
| Ledger / exposure row (projection) | — | — | ✗ | — | in | Adopted→Sunset | projection |
| Application record (CMDB) | — | ~ | ✗ | — | in | Adopted+ (standing) | mutable |
| Verifier registry entry | — | ~ TUF | ✗ | ✓ | in | Verified/Gate (standing) | mutable |

The facets predict the grain, and the grain splits in **time**: immutable rows
are all born in the Commissioned→Gate span (production plus the admission
decision) and frozen forever; mutable rows all live in the Adopted→Sunset span
(the operational afterlife). The one element spanning both — the current-state
pointer — is a projection replayed from the ledger events: its job is to present
current motion, not to store it.

## 3. Two storage grains

```
# IMMUTABLE record — content-addressed, stored sources-style (hash-named), append-only
id:          <sha256>                 # identity IS the content address
kind:        candidate-version | attestation | verdict | policy-object
zone:        outside | inside
bornPhase:   Commissioned … Gate
supersedes:  <id> | null              # chain-candidate link (lifecycle §5)
  # facet mixins, included when the facet is present:
  signed:    { envelope: dsse, signer, cert|keyref, rekor }
  standard:  { predicateType, schema, validator }
  evidence:  { level, subject:{purl,digest}, inputs:[<id>…], asserts:{…} }

# OPERATIONAL side — NOT content-addressed. Durable facts are append-only,
# hash-chained events; the rest are projections replayed from them, or external.
kind:        ledger-event | state-pointer | ledger-row | application | verifier-entry
updateRule:  append-only (ledger-event) | projection (pointer, row) | external (application) | TUF (verifier)
key/id:      ledger-event by <sha256>+prev; projections by candidateKey / (appId, candidateKey)
refs:        [<immutable id>…]        # still points UP into the immutable store — only
```

The invariant the two grains impose: **the immutable store never references the
mutable store** (its hash would otherwise depend on moving state), so every
pointer runs mutable → immutable, and the `sha256` digest is both the join key
across the immutable side and the handle the mutable side holds.

## 4. Immutable elements

The candidate version is the spine — the lifecycle-§5 chain candidate,
identified by the deployed digest:

```
candidate-version
  id:          <hardened_digest>              # the deployed artifact
  purl:        pkg:maven/…@3.2.1-osera.1
  class:       a | b                          # the only field that differs by ingest class
  contractRef: <L-1 id>
  chain:       [<L0 id> … <L9 id>]
  supersedes:  <prior candidate-version id> | null
```

Every attestation shares one envelope (`signed` + `standard` + `evidence`
mixins); only `asserts` differs per level:

| Level | subject | `asserts` (distinctive fields) |
|---|---|---|
| L-1 contract | contract digest | contractId, version, baseline.digest, osera.line, scope.cvesInScope[], explicitlyOutOfScope[], acceptanceCriteria.testCorpus.digest, schedule |
| L0 baseline | baseline_digest | source_ref (commit SHA), coordinates — anchor, publicly re-derivable |
| L1 vuln assessment | baseline_digest | baselineSbomRef, cves[]:{id, component} |
| L2 transformation | baseline→hardened | recipeSet.digest \| patch.digest |
| L3 provenance (SLSA) | hardened_digest | builder, toolchain(pinned), materials[] |
| L4 test results | hardened_digest | corpus.digest, results, compat(api/abi), patchedPathCoverage |
| L5 vuln proof | both | per cve: pocRef, failsOnBaseline, passesOnHardened |
| L6 SBOM + diff | hardened_digest | sbom.digest, diffVsL0 |
| L7 VEX | hardened_digest | per cve: status=fixed, justifiedBy→L5 id |
| L8 VSA | hardened_digest | verifier, rebuild.digestMatch, l4/l5 recheck, policyPassed, osera{contract{…,conformance}} — one record per verifier; the quorum is the *set* |
| L9 acceptance | hardened_digest | bankTests.pass, harnessRunRef, promotedTo |

```
verdict                                        policy-object
  id:          <sha256 of verdict>               id:        <digest of compiled artifact>
  candidateRef:<candidate-version id>            kind:      layout ① | rego ②
  inputs:      {layoutRef, policyRef}            bornPhase: Gate (compiled from L-1)
  bundleDigest:<evidence-bundle manifest>        signed:    {signer: bank}
  trustRootVersion: <TUF snapshot version>       standard:  {validator: in-toto | rego}
  trustPath:   osera-root | delegated:<bank>     compilerVersion: <for kind: layout>
  structural / semantic / l9: pass|fail
  decision:    admit | reject
  failingRule?:<rule #>   signed:{signer: bank}
```

Three fields make the verdict **self-contained for replay** (amendment
2026-07-21):

- **`bundleDigest`** — the exact evidence set the decision was reached from, so
  a regulator re-running the gate names the same inputs (`artifact-evidence-bundle`).
- **`trustRootVersion`** — the TUF snapshot verified against. Without it,
  "re-run offline and reach the same verdict" becomes false the moment the
  verifier registry changes; the registry is a mutable external referent and is
  pinned by the same rule as any other (`noteworthy-referent-binding`).
- **`trustPath`** — whether admission came over the OSERA root or a delegated
  bilateral namespace. **Attribution, not leniency:** the admission policy is
  identical across paths (`noteworthy-trust-root-ownership`).

`policy-object` gains **`compilerVersion`** for `kind: layout`, because the
layout compiler is dual-sited and byte-deterministic: the bank recompiles from
the signed contract and compares digests, so a version skew must surface as a
digest mismatch rather than silent divergence (`noteworthy-compiler-siting`).

The **supersedes link** is not a separate record; it is the `supersedes` field
on `candidate-version`, projected into the graph as a `supersedes` edge. A
renewal's contract carries the *same* `osera.line` as its predecessor; a line
change means a new lineage, not a supersede — so the `supersedes` edge and the
shared `osera.line` must agree (a checkable admission invariant).

## 5. Operational elements

```
# durable substrate — append-only, hash-chained (the operational-side log)
ledger-event   { id: <sha256>, prev: <prior event id for candidateKey> | null,
                 candidateKey, ref: <cand id>,
                 kind: issued | renewed | expired | retired | verifier-revoked, at,
                 coveredCves[] (from L-1 scope) }

# projections — replayed from the event chain, NOT authoritative state
state-pointer  { candidateKey          → current <cand id> + <lifecycle state> }
ledger-row     { (appId, candidateKey) → active window, expiresAt }

# external-mutable
application     { key: appId, name, owner, deployed:[<cand id>…], source: CMDB }

# trust history — its own append-only signed log (TUF), not this event chain
verifier-entry  { key: verifierId, keys[], status: active|revoked, rotationRef, signed: root }
```

`candidateKey` = the version-less upstream purl + `contract.osera.line` — the
handle for one **bridge lineage**, constant across the supersedes chain so the
pointer and ledger follow renewals. `app` is deliberately *not* in it: a bridge
is built and verified once regardless of how many apps adopt it, so the per-app
dimension lives only in the ledger's composite `(appId, candidateKey)`. See
`noteworthy-candidate-key`.

**`verifier-revoked`** (amendment 2026-07-21) records that a verifier key backing
an already-admitted candidate has been revoked. Candidates admitted on that
verifier's VSAs were validly admitted *at the time* and now rest on a compromised
signer; the event exists so the hash-chained ledger can answer "which admitted
candidates depend on verifier X" — a question a last-write row cannot. Whether
revocation forces re-verification or records an exposure is **open**; the
recommendation is record-an-exposure with a review trigger, on the same reasoning
as `Expiring` being computed rather than stored.

Two rules fixed inside the model:

- **`Expiring` is a computed view, not a stored state** — `now ≥ expiresAt −
  window` over the ledger row. Deriving it avoids a mutable status needing its
  own writer and clock. (Resolves lifecycle §8.)
- **The ledger is an append-only, hash-chained event log** (Merkle-style, not a
  consensus blockchain) — each `ledger-event` carries the digest of its
  predecessor for that `candidateKey`; `ledger-row`/`state-pointer` are replayed
  projections. This answers "which bridge was in force on a past date, covering
  what?" (a last-write row cannot) and makes tampering detectable: break one
  hash and the whole tail is invalid. The verifier registry gets the same
  *pattern* via its own mechanism, TUF. See `noteworthy-ledger-substrate`.

**Chain integrity is load-bearing.** The hash-chaining above is not a storage
convenience — it is the property the whole evidence model rests on. The
attestation DAG, the ledger event chain, and the TUF registry are each
tamper-evident by construction, and every admission claim ultimately reduces to
"these digests link, unbroken, back to an independently observable anchor." Break
one link and everything above it is worthless (architecture §3.1, §3.4, §5.1).

## 6. Relation to other artifacts & open items

- `artifact-product-lifecycle` — the state set (§2) and superseding-version rule
  (§5) are this model's fixed inputs; each state names the element(s) it owns.
- `artifact-architecture` §3 — the L-1…L9 chain this model gives record shapes
  to; `artifact-architecture` is now the integrating overview cross-referencing
  all three axes.
- `artifact-contract-lifecycle` *(proposed)* — the issuer-side machine; adds a
  pre-acceptance **draft** record (`mutable-operational`) and the maker's
  **delivery manifest** (`immutable`, outside zone).
- `artifact-evidence-bundle` *(proposed)* — the perimeter interface; `immutable`,
  born at Verified → Resolved, referenced by `verdict.bundleDigest`.

Open:

- **purl namespace — decided (Option B).** Backpatched artifacts carry a distinct
  suffixed purl `@<upstream>-osera.N`; digest stays identity, the hardening
  relationship is declared in L2/L6/L7. Fixes `candidate-version.purl` (§4). See
  `noteworthy-purl-namespace`.
- **SBOM format — decided (CycloneDX).** L6 `sbom` is CycloneDX (authoritative),
  purl-first, with SPDX license IDs embedded and an SPDX projection emitted on
  demand; VEX stays OpenVEX at L7. See `noteworthy-sbom-format`.
- **Event-log substrate — decided.** The ledger is an append-only hash-chained
  event log (`ledger-event`); `ledger-row`/`state-pointer` are projections. The
  verifier registry keeps the same append-only pattern via TUF, not this log;
  the attestation chain via Rekor-style transparency. Hash-chaining everywhere,
  consensus nowhere. See `noteworthy-ledger-substrate`.
- **candidateKey — decided.** = version-less upstream purl + `contract.osera.line`;
  constant across a bridge lineage (the supersedes chain); `app` dropped from the
  key (it lives in the ledger's `(appId, candidateKey)`). The line is declared in
  L-1 and verified with the contract. See `noteworthy-candidate-key`.
- **Revocation semantics — open.** Re-verify vs record-an-exposure (§5).
