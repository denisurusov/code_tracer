```yaml
id: artifact-deployment-topology
type: artifact
title: code_tracer — Physical topology (stores, reads, writes)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T21:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: a587d0575d65f1fb3c3ef862c269af41ea2e94df
  contentHash: a587d0575d65f1fb3c3ef862c269af41ea2e94df
  timestamp: 2026-07-21T21:00:00Z
createdAt: 2026-07-21T21:00:00Z
updatedAt: 2026-07-21T21:20:00Z
```
# code_tracer — Physical topology

**Status:** accepted. The **fifth axis: deployment.** The other four describe what
the system *means*; this one describes where the bytes actually live, who writes
them, who reads them, and when. Diagram: `docs/code-tracer-topology.svg`.

Organizing question: **what is written to where, and read by whom.** Everything
here is a *store*, not a service — services are components ①–⑨ in
`artifact-architecture` §6.

## 0. Conventions

**Actors are named by role, never by company.** The party that hardens artifacts
is the **maker**; the parties that independently re-derive the result are
**verifiers**; the party that commissions is the **issuer** (the alliance); the
party that admits is the **bank**. Specific vendors may fill these roles, but the
design binds to the role — a maker is whoever signs L0–L7 against a contract they
countersigned, and nothing in the chain depends on which organisation that is.

**Reading the tables and the diagram:**

| Notation | Meaning |
|---|---|
| **W:** | what is **written into** this store — or, for an actor, what that actor writes out |
| **R:** | what is **read from** this store — or, for an actor, what that actor reads in |
| solid arrow | a write path |
| dashed arrow | a read path |
| green | the admitted artifact's path |
| red border | a component we build (①–⑨) |

The distinction matters because it is the *asymmetry* that carries the design:
several stores are read-only to us (the public registries, the CMDB), one is
write-only in practice (quarantine, read by nothing but the gate), and one writes
nothing durable at all (the console).

## 1. The headline correction

The framing this design started from was "two GitHubs, Maven, and all." That is
not the shape.

- **Git appears twice and is load-bearing in neither.** The alliance **master
  repo** publishes contract schemas, Rego policy bundles and the layout compiler;
  the **maker's repo** holds recipe sets. Both are *publishing* surfaces. Neither
  is on the verification path.
- **The spine is OCI registries** — the neutral registry the bank pulls from, and
  the bank's own bundle store. Digest-addressed, referrer-carrying, and the
  actual transport for everything that matters.
- **The anchor is the public package registry for the artifact's purl type** —
  not Maven specifically (`noteworthy-ecosystem-generalization`).

**Artifact hosting carries this system; source hosting is peripheral.**

## 2. Public upstream — read-only, uncontrolled

| Store | Written by | Read by | When |
|---|---|---|---|
| Package registry (per purl type) | upstream maintainers — **nobody in the alliance** | ⑦ at commissioning; maker at build; every verifier at rebuild; gate at rule 3 | anchor check, twice minimum |
| Upstream git | upstream maintainers | maker; verifiers | `source_ref` resolution |
| OSV / NVD | upstream | ⑦ at scoping | `cvesInScope` derivation |
| `sum.golang.org` (Go only) | Go team | verifiers | already an independent checksum log |

Anchor strength is **not uniform**: Maven Central and Go are strong, crates.io
strong, npm and PyPI permit deletion — so for those a **supplementary log witness
at commissioning** is required, or the baseline can simply vanish
(`noteworthy-ecosystem-generalization` §1).

## 3. Outside — issuer, maker, verifiers

| Store | Written by | Read by | Notes |
|---|---|---|---|
| **Master repo (git)** | ⑦⑧ maintainers | issuer at compile; **bank only at publication time, never at verify** | schemas (all versions, never deprecated), Rego bundles, compiler ① |
| **Contract store** | ⑧ issuance | maker, verifiers, gate | signed L-1 + countersignature; content-addressed |
| **TUF root + verifier registry** | ⑨ (k-of-m co-signed) | bank, via pinned snapshot | root keys held **across organisations** — survives any one party |
| **Rekor (FINOS-operated)** | ⑧ (contract), maker (delivery manifest), verifiers (VSAs) | verifiers; gate via checkpoint set | **quorum-witnessed** — each VSA carries the checkpoint it observed |
| **Fulcio / CA** | Sigstore | gate, via roots shipped in the bundle | |
| **Neutral OCI registry** | maker (artifact + L0–L7 referrers), verifiers (L8) | bank resolver ③ | **the spine** — this is what the bank pulls |
| Maker build infra, recipe git | maker | maker | not ours |
| Verifier rebuild infra × n | each verifier | each verifier | not ours; siting hybrid (§6) |

## 4. The perimeter

Exactly **one thing crosses**: the evidence bundle — an OCI image index, or a
deterministic tar with the same manifest digest when air-gapped. It is a **copy,
not a protocol**, and a **container, never a credential**
(`artifact-evidence-bundle`).

The rule that keeps this honest: **if the gate needs it, it ships in the bundle.**
Anything the gate would have to fetch is a live dependency and breaks
hermeticity. This is why the master repo — authoritative for schemas and policy —
is *never read at verify time*: the schema version and its matching policy bundle
ship **pinned by digest inside the bundle**, with the repo as the place they are
published from and re-derivable against. Same shape as the trust-root snapshot,
and the same discipline as `noteworthy-authoritative-form`.

Freshness at the boundary: TUF snapshot ≤ 7 days, checkpoint set ≤ 24 hours
(`noteworthy-bundle-freshness`).

## 5. Inside the bank

| Store | Written by | Read by | Grain |
|---|---|---|---|
| **Quarantine registry** | resolver ③ on arrival | gate only | holding area; nothing else may read it |
| **OCI bundle store** | ③ (assembly) | gate | immutable; blobs shared, so trust material is stored once rather than per bundle |
| **Trust material store** | scheduled refresh | ③ at assembly | TUF snapshot, Fulcio roots, checkpoint set, schema + policy bundles |
| **Gate runner** | — | reads the bundle, nothing else | writes the `verdict` (immutable) |
| **CI executor** | ④ harness | gate folds result into the verdict | writes **L9**, which never leaves the bank |
| **Golden repo** | gate, on admit | app teams **only** | the one path to consumption |
| **Ledger store** | ⑤ | console ⑥, risk function | append-only hash-chained events; rows and pointers are projections |
| **CMDB** | the bank, externally | ⑤ | read-only to us |
| **Console** ⑥ | **nothing durable** | operators | read tier over projections and verdicts |

**Every durable write inside the bank is append-only.** Verdicts and bundles are
immutable; ledger events are hash-chained; everything else is a projection
replayed from them. The console writes nothing — every state change routes
through the gate (a `verdict`) or the ledger (a `ledger-event`).

**Quarantine has exactly one reader**, and that is a control rather than a
convenience: if any other system could read it, an app team could consume an
unadmitted artifact by pointing at the wrong repository.

## 6. Two things still physically undetermined

- **Verifier rebuild siting.** The `Origins` schematic drew this as deliberately
  hybrid — neutral-zone or peer on-prem, same signed VSA either way. Now that
  verification is a **duty** and `n` ≈ active membership
  (`noteworthy-governance-modes`), the default is peer on-prem. That makes the
  rebuild harness a **distributable package rather than a hosted service**, which
  is a build implication nobody has costed.
- **The air-gapped variant.** The tar projection plus a 24-hour checkpoint clock
  implies a courier process and a **staging host on each side of the perimeter**,
  operating on a daily tempo. Real infrastructure, currently one sentence in
  `noteworthy-bundle-freshness`.

## 7. Relation to the other axes

- `artifact-architecture` — §1's three zones and §6's component register are the
  logical counterpart of this physical map; components ①–⑨ are the services that
  act on these stores.
- `artifact-evidence-bundle` — defines what crosses §4.
- `artifact-data-model` — defines the records these stores hold.
- `artifact-contract-lifecycle` / `artifact-product-lifecycle` — define *when*
  each write happens.
