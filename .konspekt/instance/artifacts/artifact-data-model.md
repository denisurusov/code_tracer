```yaml
id: artifact-data-model
type: artifact
title: code_tracer — Data model
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 259d3019f66d621539c97fbba96ac8d3ad138e53
  contentHash: 259d3019f66d621539c97fbba96ac8d3ad138e53
  timestamp: 2026-07-17T17:45:00Z
createdAt: 2026-07-17T17:45:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# code_tracer — Data model

**Status:** accepted (`review: accepted`). The records axis: the *records* that
back each state of the package and product lifecycles. It sits on
`artifact-product-lifecycle` (states/transitions), `artifact-contract-lifecycle`
(the project machine) and `artifact-architecture` §3 (the L-1…L9 evidence
chain), and is organized by **facets** — orthogonal qualities an element can
carry several of at once, each contributing a reusable schema mixin.

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
>
> **Amendment 2026-07-26 (`noteworthy-lifecycle-nouns`).** The retired noun
> *candidate* is removed throughout: **`candidate-version` → `package-version`**
> (digest-grain), **`candidateKey` → `lineKey`** (lineage-grain), and
> `verdict.candidateRef` → `verdict.packageRef`. `governance.mode` value
> `mutualized` → `team`. Lifecycle-phase names follow the split: the immutable
> span now opens at **Accepted** rather than Commissioned, which was a duplicate
> of it. Record shapes and semantics are unchanged.
>
> **Amendment 2026-07-30 (`noteworthy-signer-verification`,
> `noteworthy-adoption-rebuild`).** `governance` gains **`signatories[]`** and
> `verification.k` becomes that set rather than a computed threshold; L-1 gains
> **`rebuild`** references and the evidence core carries them; **L8 is written
> twice** — once per signatory outside, once by the adopting bank inside — so
> the attestation row is no longer wholly outside-zone; and §5's revocation
> argument is replaced, since it rested on the retired floor of three.

## 1. Facets

An element's qualities are not mutually-exclusive categories; they are
orthogonal facets, and each facet carries its own shared machinery:

- **evidence** — plays a role in the attestation chain; carries a level
  (L-1…L9), a `subject` (purl + digest), `inputs[]` (attestation digests — the
  DAG edges), and a verify hook.
- **standard-bound** — conforms to an external spec; carries `predicateType`,
  `schema`, `validator` (in-toto, SLSA, CycloneDX, OpenVEX, DSSE, purl).
- **immutable** — content-addressed, append-only; never edited, only
  *superseded* — a member of a supersedes chain (`artifact-product-lifecycle`
  §7).
- **signed** — has an authenticated author (DSSE envelope + signer identity).
  Distinct from evidence: authorship vs role.
- **mutable-operational** — the deliberate opposite of immutable: bank-side
  state that legitimately changes. Named explicitly so nothing that must move is
  accidentally content-addressed.
- **zone** — produced outside vs created inside the bank; sets trust handling.

A seventh column, **lifecycle phase**, records which state *creates/owns* the
element. It is a mapping onto the project, package and product machines, not a
facet.

## 2. Element inventory

`ev` evidence · `std` standard-bound · `imm` immutable · `sig` signed.

| Element | ev | std | imm | sig | zone | lifecycle phase | grain |
|---|:---:|:---:|:---:|:---:|:---:|---|---|
| Attestations L-1…L9 | ✓ | ✓ | ✓ | ✓ | out (L8-by-bank and L9 in) | Accepted→Adopted (accrue) | immutable |
| Delivery manifest | ✓ | ✓ | ✓ | — | out | Delivered | immutable |
| Evidence core | ✓ | ✓ | ✓ | — | out | Fulfilled | immutable |
| Ingest envelope | — | ✓ | ✓ | — | in | Verified→Resolved | immutable |
| Compiled layout ① + Rego policy ② | — | ✓ | ✓ | ✓ | in | Gate (compiled from L-1) | immutable |
| Package version (digest + snapshot) | — | ~ purl | ✓ | — | spans | Accepted (exists across all) | immutable |
| Admission verdict (gate-run record) | ✓ | ~ | ✓ | ✓ | in | Gate | immutable |
| Supersedes link (version → prior) | — | — | ✓ | — | in | Sunset (at renewal) | immutable |
| Contract draft | — | — | ✗ | — | out | Drafted (issuer-side) | mutable |
| Current-state pointer | — | — | ✗ | — | in | all (recomputed each transition) | projection |
| Ledger event (append-only, hash-chained) | — | — | ✗ | — | in | Adopted→Sunset | append-only |
| Ledger / exposure row (projection) | — | — | ✗ | — | in | Adopted→Sunset | projection |
| Application record (CMDB) | — | ~ | ✗ | — | in | Adopted+ (standing) | mutable |
| Verifier registry entry | — | ~ TUF | ✗ | ✓ | in | Verified/Gate (standing) | mutable |

The facets predict the grain, and the grain splits in **time**: immutable rows
are all born in the Accepted→Gate span (production plus the admission decision)
and frozen forever; mutable rows all live in the Adopted→Sunset span (the
operational afterlife) — with one exception on the issuer side, the contract
draft, which is deliberately mutable *before* Accepted and frozen from it. The
one element spanning the operational split — the current-state pointer — is a
projection replayed from the ledger events: its job is to present current motion,
not to store it.

The attestation row is the one element whose **zone is mixed rather than
singular**: L-1–L8 are produced outside, and two records at the same levels are
produced inside — the adopting bank's own L8 over its rebuild, and its L9. Same
shapes, same immutability, different side of the perimeter and different
disclosure (§4).

## 3. Two storage grains

```
# IMMUTABLE record — content-addressed, stored sources-style (hash-named), append-only
id:          <sha256>                 # identity IS the content address
kind:        package-version | attestation | verdict | policy-object
             | delivery-manifest | evidence-core | ingest-envelope
zone:        outside | inside
bornPhase:   Drafted … Gate
supersedes:  <id> | null              # supersedes-chain link (lifecycle §7)
  # facet mixins, included when the facet is present:
  signed:    { envelope: dsse, signer, cert|keyref, rekor }
  standard:  { predicateType, schema, validator }
  evidence:  { level, subject:{purl,digest}, inputs:[<id>…], asserts:{…} }

# OPERATIONAL side — NOT content-addressed. Durable facts are append-only,
# hash-chained events; the rest are projections replayed from them, or external.
kind:        ledger-event | state-pointer | ledger-row | application
             | verifier-entry | contract-draft
updateRule:  append-only (ledger-event) | projection (pointer, row) | external (application) | TUF (verifier)
key/id:      ledger-event by <sha256>+prev; projections by lineKey / (appId, lineKey)
refs:        [<immutable id>…]        # still points UP into the immutable store — only
```

The invariant the two grains impose: **the immutable store never references the
mutable store** (its hash would otherwise depend on moving state), so every
pointer runs mutable → immutable, and the `sha256` digest is both the join key
across the immutable side and the handle the mutable side holds.

## 4. Immutable elements

The package version is the spine — the member of the supersedes chain
(`artifact-product-lifecycle` §7), identified by the deployed digest:

```
package-version
  id:          <hardened_digest>              # the deployed artifact
  purl:        pkg:maven/…@3.2.1-osera.1
  class:       a | b                          # the only field that differs by ingest class
  contractRef: <L-1 id>
  chain:       [<L0 id> … <L9 id>]
  supersedes:  <prior package-version id> | null
```

Every attestation shares one envelope (`signed` + `standard` + `evidence`
mixins); only `asserts` differs per level:

| Level | subject | `asserts` (distinctive fields) |
|---|---|---|
| L-1 contract | contract digest | contractId, version, governance{mode, sponsor, mandateRef.digest, trustPath, **signatories[]**}, baseline.digest, osera.line, scope.cvesInScope[] (each with recordDigest), explicitlyOutOfScope[], acceptanceCriteria.testCorpus.digest, **rebuild{source, transformation, toolchain}**, verification.k, schedule |
| L0 baseline | baseline_digest | source_ref (commit SHA), coordinates — anchor, publicly re-derivable |
| L1 vuln assessment | baseline_digest | baselineSbomRef, cves[]:{id, component} |
| L2 transformation | baseline→hardened | recipeSet.digest \| patch.digest |
| L3 provenance (SLSA) | hardened_digest | builder, toolchain(pinned), materials[] |
| L4 test results | hardened_digest | corpus.digest, results, compat(api/abi), patchedPathCoverage |
| L5 vuln proof | both | per cve: pocRef, failsOnBaseline, passesOnHardened |
| L6 SBOM + diff | hardened_digest | sbom.digest, diffVsL0 |
| L7 VEX | hardened_digest | per cve: status=fixed, justifiedBy→L5 id |
| L8 VSA | hardened_digest | verifier, rebuild.digestMatch, l4/l5 recheck, policyPassed, **log.checkpoint** (observed Rekor tree head + inclusion proofs), osera{contract{…,conformance}} — **one record per signatory, plus one signed by the adopting bank** over its own rebuild |
| L9 acceptance | hardened_digest | bankTests.pass, harnessRunRef, promotedTo |

**L8 is written on both sides of the perimeter.** Outside, every signatory
publishes one and all must agree. Inside, the adopting bank rebuilds from the
pinned references and signs its own, which seals into the ingest envelope rather
than the core — it is that bank's record, not shared evidence. Same predicate and
same assertion, which is why it is L8 rather than a new level
(`noteworthy-adoption-rebuild`).

**Disclosure.** The bank's own L8 and its L9 are **unpublished by default and
disclosable on demand**. A supervisor may require confirmation that the
institution rebuilt and tested, so "never leaves the bank" overstates the
property; being able to produce both on request demonstrates the control.

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
                                                  #     | advisory-snapshot | rebuild-ref
  sealedAt:    <timestamp>
  logEntry:    <rekor index over id>              # the freeze
```

It carries no signature of its own — every element it names is independently
signed, and a wrong locator fails against the `sha256` beside it. Canonical
serialization (RFC 8785 + trailing LF) is part of the schema, because the digest
of the bytes is the identity. Published at
`cores/{contractId}/v{N}/{seq}.json`; the git blob SHA of that path is a locator
and no admission rule keys on it.

**`rebuild-ref` elements are locators plus digests, never bytes.** Source,
transformation and toolchain are pinned by digest so a fetch either yields the
named bytes or fails loudly; a tag is never acceptable in place of a digest.
Packing the images themselves would trade a small signed manifest for a container
the size of a build environment (`noteworthy-adoption-rebuild`).

**The L-1 `governance` block** makes the commissioning mandate checkable rather
than assumed — the same move L-1 already made for scope and corpus:

```
governance
  mode:         team | solo
  sponsor:      <alliance URI | sponsoring bank id>
  signatories:  [ <member id> … ]    # the parties that sign, fund and verify
  mandateRef:   { sha256: <vote record | bank authorization digest> }
  trustPath:    osera-root | delegated:<bank>
```

`governance.trustPath` MUST agree with the namespace the artifact is actually
signed under — a checkable admission invariant, in the same family as the
supersedes-agrees-with-line rule below. Mode changes *who is accountable for the
commissioning judgement* and how many reproductions precede the perimeter, never
what the gate requires (`noteworthy-governance-modes`).

**`verification.k` is the signatory set itself**, frozen at issuance rather than
computed. Every signatory verifies, all must agree, and a team-mode project needs
at least two; solo has exactly one. An artifact is judged against the parties who
committed to it rather than a membership that drifted during the work. Rules 2′
and 5′ evaluate against `governance.signatories`
(`noteworthy-signer-verification`, superseding the sizing rule in
`noteworthy-quorum-parameters`).

**L8 `log.checkpoint`** is the Rekor tree head each verifier *observed*, not one
the log asserted. Because the log is FINOS-operated, a single checkpoint would
have to be trusted; independently observed ones cannot be split without producing
a dissent, which is already disqualifying. Agreement over checkpoints is
therefore split-view detection built from machinery that already exists
(`noteworthy-transparency-log`).

```
verdict                                        policy-object
  id:          <sha256 of verdict>               id:        <digest of compiled artifact>
  packageRef:  <package-version id>              kind:      layout ① | rego ②
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
  identical for every bank that admits this package
  (`artifact-evidence-bundle` §1). It is the only field in the verdict two
  members can compare directly, which is what makes "we admitted the same thing"
  a checkable statement rather than an assertion.
- **`bundleDigest`** — the ingest envelope this bank actually verified: the core
  digest, the trust material current at its own gate, and its own L8. Bank-local
  by construction, and identical whether the envelope travelled as OCI or as its
  tar projection.
- **`trustRootVersion`** — the TUF snapshot verified against. Without it,
  "re-run offline and reach the same verdict" becomes false the moment the
  verifier registry changes. It is also what lets a past verdict *stand* when a
  verifier is later revoked (§5).
- **`trustPath`** — OSERA root or delegated bilateral namespace, and therefore
  which governance mode commissioned it. **Attribution, not leniency:** the
  admission policy is identical across paths, as is the bank's own rebuild.

`policy-object` gains **`compilerVersion`** for `kind: layout`, because the
layout compiler is dual-sited and byte-deterministic: the bank recompiles from
the signed contract and compares digests, so a version skew must surface as a
digest mismatch rather than silent divergence (`noteworthy-compiler-siting`).

The **supersedes link** is not a separate record; it is the `supersedes` field
on `package-version`, projected into the graph as a `supersedes` edge. A
renewal's contract carries the *same* `osera.line` as its predecessor; a line
change means a new lineage, not a supersede — so the `supersedes` edge and the
shared `osera.line` must agree (a checkable admission invariant).

## 5. Operational elements

```
# durable substrate — append-only, hash-chained (the operational-side log)
ledger-event   { id: <sha256>, prev: <prior event id for lineKey> | null,
                 lineKey, ref: <package-version id>,
                 kind: issued | renewed | expired | retired | verifier-revoked, at,
                 coveredCves[] (from L-1 scope) }

# projections — replayed from the event chain, NOT authoritative state
state-pointer  { lineKey              → current <package-version id> + <state> }
ledger-row     { (appId, lineKey)     → active window, expiresAt }

# external-mutable
application     { key: appId, name, owner, deployed:[<package-version id>…], source: CMDB }

# trust history — its own append-only signed log (TUF), not this event chain
verifier-entry  { key: verifierId, keys[], status: active|revoked, rotationRef, signed: root }
```

`lineKey` = the version-less upstream purl + `contract.osera.line` — the
handle for one **bridge lineage**, constant across the supersedes chain so the
pointer and ledger follow renewals. `app` is deliberately *not* in it: a bridge
is built and verified once regardless of how many apps adopt it, so the per-app
dimension lives only in the ledger's composite `(appId, lineKey)`. See
`noteworthy-candidate-key`.

**`verifier-revoked` — records an exposure, does not invalidate.** When a
verifier key is revoked, packages admitted on its VSAs **remain admitted**:
admission was valid at the time against a pinned `trustRootVersion`, and the
artifacts themselves are unchanged — they still rebuild to the same digest and
still prove the same CVEs fixed. Forcing re-verification would let one revoked
key invalidate hundreds of packages at once, a self-inflicted outage triggered
by a trust event rather than an artifact event. Instead the event is appended per
affected `lineKey`, the ledger answers "which admitted packages rest on
this signer," and the console (⑥) raises a **review trigger** for the risk
function to judge per package.

What makes that tolerable no longer depends on quorum size. The original argument
was that `k ≥ 3` with zero dissent meant no single verifier was ever the sole
basis for an admission, and that floor retired with
`noteworthy-signer-verification`. The bound that replaces it holds in every mode:
**the adopting bank rebuilt the package itself and signed its own L8**, so a
revoked signatory key was never the sole basis for that bank's admission. The
converse case — a revoked key belonging to the adopting bank — is the one where
the outside signatories carry the argument instead, and it is why a member's
verification and admission functions should be separately keyed
(`noteworthy-revocation-semantics`, `noteworthy-adoption-rebuild`).

Two rules fixed inside the model:

- **`Expiring` is a computed view, not a stored state** — `now ≥ expiresAt −
  window` over the ledger row. Deriving it avoids a mutable status needing its
  own writer and clock. (Resolves the lifecycle's sunset-signalling item.)
- **The ledger is an append-only, hash-chained event log** (Merkle-style, not a
  consensus blockchain) — each `ledger-event` carries the digest of its
  predecessor for that `lineKey`; `ledger-row`/`state-pointer` are replayed
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

- `artifact-product-lifecycle` — the package and product state sets and the
  renewal rule (§7) are this model's fixed inputs; each state names the
  element(s) it owns.
- `artifact-contract-lifecycle` — the project machine; owns the contract
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
- **`lineKey`** — version-less upstream purl + `contract.osera.line`.
  `noteworthy-candidate-key`.
- **Governance modes** — L-1 carries `governance`, including `signatories[]`;
  mode selects accountability, trust path and how many outside reproductions
  exist, never admission strictness. `noteworthy-governance-modes`.
- **Verdict replay fields** — `coreDigest`, `bundleDigest`, `trustRootVersion`,
  `trustPath`.
- **Bundle split** — issuer-sealed evidence core with one shared digest, per-bank
  ingest envelope carrying the trust material, its freshness clock and this
  bank's own L8. `noteworthy-bundle-split`.
- **Core form** — one canonical JSON file in the master repo, `sha256` over its
  bytes as identity, Rekor entry as the freeze, now including advisory snapshots
  and rebuild references among its elements. `noteworthy-core-manifest`.
- **Revocation semantics** — exposure with review trigger, verdict stands, and
  the bank's own rebuild is what makes that safe. `noteworthy-revocation-semantics`.
- **Who verifies** — `verification.k` is the signatory set, zero dissent, minimum
  two in team mode; `k = max(3, ceil(n/3))` retired.
  `noteworthy-signer-verification`.
- **Adoption rebuild** — L8 is written on both sides of the perimeter; the core
  carries digest-pinned rebuild references. `noteworthy-adoption-rebuild`.
- **Record names** — `package-version` (digest-grain), `lineKey` (lineage-grain);
  the noun *candidate* is retired. `noteworthy-lifecycle-nouns`.

Open: none at the data-model level.
