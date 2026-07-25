```yaml
id: artifact-data-model
type: artifact
title: code_tracer — Data model
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-25T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 259d3019f66d621539c97fbba96ac8d3ad138e53
  contentHash: 259d3019f66d621539c97fbba96ac8d3ad138e53
  timestamp: 2026-07-17T17:45:00Z
createdAt: 2026-07-17T17:45:00Z
updatedAt: 2026-07-25T00:00:00Z
```
# code_tracer — Data model

**Status:** accepted (`review: accepted`). The third factored axis: the *records*
that back each state of the product lifecycle. It sits on
`artifact-product-lifecycle` (states/transitions) and `artifact-architecture`
§3 (the L-1…L9 evidence chain), and is organized by **facets** — orthogonal
qualities an element can carry several of at once, each contributing a reusable
schema mixin.

> **Amendment 2026-07-21.** §4 (`verdict`, `policy-object`, L-1 `governance`,
> L8 `log.checkpoint`) and §5 (`ledger-event`, revocation) amended per the
> issuer-side batch — excerpts `c284e12b3f1e77a4f712644a85aba7e8195b4648`,
> `b73f250d059666768988095d440fa673548ef9d2`,
> `362e1ebe2a81cdfabf6b106db12db1e3ade7531a`,
> `62f7c4b932187a51625b047401a2925cb3b0715e`,
> `19c83a6696b0385da970572660b26d3871318fad`.
>
> **Amendment 2026-07-25.** §2, §3 and §4 (`verdict.coreDigest`) amended for the
> core/envelope split — excerpt `7aa6325730d0516102bfe4d0adffadbc846626f1`
> (`noteworthy-bundle-split`); §4 gains the `evidence-core` record shape —
> excerpt `4c033a33595c2cf803123955559edfbeb6585d05` (`noteworthy-core-manifest`).

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
| Delivery manifest | ✓ | ✓ | ✓ | — | out | Delivered | immutable |
| Evidence core | ✓ | ✓ | ✓ | — | out | Fulfilled | immutable |
| Ingest envelope | — | ✓ | ✓ | — | in | Verified→Resolved | immutable |
| Compiled layout ① + Rego policy ② | — | ✓ | ✓ | ✓ | in | Gate (compiled from L-1) | immutable |
| Candidate version (digest + snapshot) | — | ~ purl | ✓ | — | spans | Commissioned (exists across all) | immutable |
| Admission verdict (gate-run record) | ✓ | ~ | ✓ | ✓ | in | Gate | immutable |
| Supersedes link (version → prior) | — | — | ✓ | — | in | Sunset (at renewal) | immutable |
| Contract draft | — | — | ✗ | — | out | Drafted (issuer-side) | mutable |
| Current-state pointer | — | — | ✗ | — | in | all (recomputed each transition) | projection |
| Ledger event (append-only, hash-chained) | — | — | ✗ | — | in | Adopted→Sunset | append-only |
| Ledger / exposure row (projection) | — | — | ✗ | — | in | Adopted→Sunset | projection |
| Application record (CMDB) | — | ~ | ✗ | — | in | Adopted+ (standing) | mutable |
| Verifier registry entry | — | ~ TUF | ✗ | ✓ | in | Verified/Gate (standing) | mutable |

The facets predict the grain, and the grain splits in **time**: immutable rows
are all born in the Commissioned→Gate span (production plus the admission
decision) and frozen forever; mutable rows all live in the Adopted→Sunset span
(the operational afterlife) — with one exception on the issuer side, the contract
draft, which is deliberately mutable *before* Accepted and frozen from it. The
one element spanning the operational split — the current-state pointer — is a
projection replayed from the ledger events: its job is to present current motion,
not to store it.

## 3. Two storage grains

```
# IMMUTABLE record — content-addressed, stored sources-style (hash-named), append-only
id:          <sha256>                 # identity IS the content address
kind:        candidate-version | attestation | verdict | policy-object
             | delivery-manifest | evidence-core | ingest-envelope
zone:        outside | inside
bornPhase:   Drafted … Gate
supersedes:  <id> | null              # chain-candidate link (lifecycle §5)
  # facet mixins, included when the facet is present:
  signed:    { envelope: dsse, signer, cert|keyref, rekor }
  standard:  { predicateType, schema, validator }
  evidence:  { level, subject:{purl,digest}, inputs:[<id>…], asserts:{…} }

# OPERATIONAL side — NOT content-addressed. Durable facts are append-only,
# hash-chained events; the rest are projections replayed from them, or external.
kind:        ledger-event | state-pointer | ledger-row | application
             | verifier-entry | contract-draft
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
| L-1 contract | contract digest | contractId, version, governance{mode, sponsor, mandateRef.digest, trustPath}, baseline.digest, osera.line, scope.cvesInScope[], explicitlyOutOfScope[], acceptanceCriteria.testCorpus.digest, verification.k, schedule |
| L0 baseline | baseline_digest | source_ref (commit SHA), coordinates — anchor, publicly re-derivable |
| L1 vuln assessment | baseline_digest | baselineSbomRef, cves[]:{id, component} |
| L2 transformation | baseline→hardened | recipeSet.digest \| patch.digest |
| L3 provenance (SLSA) | hardened_digest | builder, toolchain(pinned), materials[] |
| L4 test results | hardened_digest | corpus.digest, results, compat(api/abi), patchedPathCoverage |
| L5 vuln proof | both | per cve: pocRef, failsOnBaseline, passesOnHardened |
| L6 SBOM + diff | hardened_digest | sbom.digest, diffVsL0 |
| L7 VEX | hardened_digest | per cve: status=fixed, justifiedBy→L5 id |
| L8 VSA | hardened_digest | verifier, rebuild.digestMatch, l4/l5 recheck, policyPassed, **log.checkpoint** (observed Rekor tree head + inclusion proofs), osera{contract{…,conformance}} — one record per verifier; the quorum is the *set* |
| L9 acceptance | hardened_digest | bankTests.pass, harnessRunRef, promotedTo |

The **evidence core** is the one immutable record that is a plain file rather
than a signed envelope — a list of digests, identified by the digest of the list
(`noteworthy-core-manifest`):

```
evidence-core
  id:          <sha256 of canonical file bytes>   # = verdict.coreDigest
  schema:      osera/evidence-core/v{N}
  contractRef: <L-1 digest>
  seq:         N                                  # 1 on first seal
  supersedes:  <prior coreDigest> | null          # a later VSA arriving re-seals
  elements[]:  { role, sha256, locator }          # role: delivery-manifest | L0…L8
                                                  #     | layout | policy-bundle
  sealedAt:    <timestamp>
  logEntry:    <rekor index over id>              # the freeze
```

It carries no signature of its own — every element it names is independently
signed, and a wrong locator fails against the `sha256` beside it. Canonical
serialization (RFC 8785 + trailing LF) is part of the schema, because the digest
of the bytes is the identity. Published at
`cores/{contractId}/v{N}/{seq}.json`; the git blob SHA of that path is a locator
and no admission rule keys on it.

**The L-1 `governance` block** makes the commissioning mandate checkable rather
than assumed — the same move L-1 already made for scope and corpus:

```
governance
  mode:        mutualized | solo
  sponsor:     <alliance URI | sponsoring bank id>
  mandateRef:  { sha256: <vote record | bank authorization digest> }
  trustPath:   osera-root | delegated:<bank>
```

`governance.trustPath` MUST agree with the namespace the artifact is actually
signed under — a checkable admission invariant, in the same family as the
supersedes-agrees-with-line rule below. Mode changes *who is accountable for the
commissioning judgement*, never what the gate requires
(`noteworthy-governance-modes`). `verification.k` is likewise frozen at
issuance — `max(3, ceil(n/3))` at that moment — so an artifact is judged against
the quorum in force when it was commissioned
(`noteworthy-quorum-parameters`).

**L8 `log.checkpoint`** is the Rekor tree head each verifier *observed*, not one
the log asserted. Because the log is FINOS-operated, a single checkpoint would
have to be trusted; k independently observed ones cannot be split without
producing a dissent, which is already disqualifying. Quorum agreement over
checkpoints is therefore split-view detection built from machinery that already
exists (`noteworthy-transparency-log`).

```
verdict                                        policy-object
  id:          <sha256 of verdict>               id:        <digest of compiled artifact>
  candidateRef:<candidate-version id>            kind:      layout ① | rego ②
  inputs:      {layoutRef, policyRef}            bornPhase: Gate (compiled from L-1)
  coreDigest:  <evidence-core manifest>          signed:    {signer: bank}
  bundleDigest:<ingest-envelope manifest>        standard:  {validator: in-toto | rego}
  trustRootVersion: <TUF snapshot version>       compilerVersion: <for kind: layout>
  trustPath:   osera-root | delegated:<bank>
  structural / semantic / l9: pass|fail
  decision:    admit | reject
  failingRule?:<rule #>   signed:{signer: bank}
```

Four fields make the verdict **self-contained for replay**:

- **`coreDigest`** — the evidence set itself, sealed once by the issuer and
  identical for every bank that admits this candidate
  (`artifact-evidence-bundle` §1). It is the only field in the verdict two
  members can compare directly, which is what makes "we admitted the same thing"
  a checkable statement rather than an assertion.
- **`bundleDigest`** — the ingest envelope this bank actually verified: the core
  digest plus the trust material current at its own gate. Bank-local by
  construction, and identical whether the envelope travelled as OCI or as its
  tar projection.
- **`trustRootVersion`** — the TUF snapshot verified against. Without it,
  "re-run offline and reach the same verdict" becomes false the moment the
  verifier registry changes. It is also what lets a past verdict *stand* when a
  verifier is later revoked (§5).
- **`trustPath`** — OSERA root or delegated bilateral namespace, and therefore
  which governance mode commissioned it. **Attribution, not leniency:** the
  admission policy is identical across paths.

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

**`verifier-revoked` — records an exposure, does not invalidate.** When a
verifier key is revoked, candidates admitted on its VSAs **remain admitted**:
admission was valid at the time against a pinned `trustRootVersion`, and the
artifacts themselves are unchanged — they still rebuild to the same digest and
still prove the same CVEs fixed. Forcing re-verification would let one revoked
key invalidate hundreds of candidates at once, a self-inflicted outage triggered
by a trust event rather than an artifact event. Instead the event is appended per
affected `candidateKey`, the ledger answers "which admitted candidates rest on
this signer," and the console (⑥) raises a **review trigger** for the risk
function to judge per candidate. Tolerable precisely because k ≥ 3 with zero
dissent means no single verifier was ever the sole basis for an admission
(`noteworthy-revocation-semantics`).

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
- `artifact-contract-lifecycle` — the issuer-side machine; owns the contract
  draft and the delivery manifest.
- `artifact-evidence-bundle` — the perimeter interface: the shared **evidence
  core** and the per-bank **ingest envelope**, referenced by
  `verdict.coreDigest` and `verdict.bundleDigest`.
- `artifact-architecture` §3 — the L-1…L9 chain this model gives record shapes
  to; it is the integrating overview across all four axes.

Decided:

- **purl namespace (Option B)** — `@<upstream>-osera.N`; digest stays identity.
  `noteworthy-purl-namespace`.
- **SBOM format (CycloneDX)** — authoritative, SPDX projection on demand.
  `noteworthy-sbom-format`.
- **Event-log substrate** — append-only hash-chained events; projections over
  them; consensus nowhere. `noteworthy-ledger-substrate`.
- **candidateKey** — version-less upstream purl + `contract.osera.line`.
  `noteworthy-candidate-key`.
- **Governance modes** — L-1 carries `governance`; mode selects accountability
  and trust path, never admission strictness. `noteworthy-governance-modes`.
- **Verdict replay fields** — `coreDigest`, `bundleDigest`, `trustRootVersion`,
  `trustPath`.
- **Bundle split** — issuer-sealed evidence core with one shared digest, per-bank
  ingest envelope carrying the trust material and its freshness clock.
  `noteworthy-bundle-split`.
- **Core form** — one canonical JSON file in the master repo, `sha256` over its
  bytes as identity, Rekor entry as the freeze. `noteworthy-core-manifest`.
- **Revocation semantics** — exposure with review trigger, verdict stands.
  `noteworthy-revocation-semantics`.
- **Quorum parameters** — `k = max(3, ceil(n/3))`, zero dissent, frozen at
  issuance. `noteworthy-quorum-parameters`.

Open: none at the data-model level.
