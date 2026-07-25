```yaml
id: artifact-deployment-topology
type: artifact
title: code_tracer — Physical topology (stores, reads, writes)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-25T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: a587d0575d65f1fb3c3ef862c269af41ea2e94df
  contentHash: a587d0575d65f1fb3c3ef862c269af41ea2e94df
  timestamp: 2026-07-21T21:00:00Z
createdAt: 2026-07-21T21:00:00Z
updatedAt: 2026-07-25T00:00:00Z
```
# code_tracer — Physical topology

**Status:** accepted. The **fifth axis: deployment.** The other four describe what
the system *means*; this one describes where the bytes actually live, who writes
them, who reads them, and when. Diagram: `docs/resource/code-tracer-topology.svg`
(page 4 of the set indexed in `docs/resource/README.md`).

> **Amendment 2026-07-25.** §4 and the §5 bundle-store and gate-runner rows
> reflect the core/envelope split — excerpt `7aa6325730d0516102bfe4d0adffadbc846626f1`
> (`noteworthy-bundle-split`).

**Every store named here must be physically real** — a file at a path in a named
repository, an object in a bucket, a table in a database, or a running third-party
service. Where the realization is not yet chosen, it is marked **UNDECIDED**
rather than described abstractly.

## 0. Conventions

**Actors are named by role, never by company.** The party that hardens artifacts
is the **maker**; the parties that independently re-derive the result are
**verifiers**; the party that commissions is the **issuer** (the alliance); the
party that admits is the **bank**. Specific vendors fill these roles, but the
design binds to the role — a maker is whoever signs L0–L7 against a contract they
countersigned.

| Notation | Meaning |
|---|---|
| **W:** | what is **written into** this store — or, for an actor, what that actor writes out |
| **R:** | what is **read from** this store — or, for an actor, what that actor reads in |
| solid arrow | a write path |
| dashed arrow | a read path |
| green | the admitted artifact's path |
| red border | a component we build (①–⑨) |

## 1. The headline correction

The framing this design started from was "two GitHubs, Maven, and all." That is
not the shape. **Git appears twice and is load-bearing in neither** — both are
publishing surfaces, neither is on the verification path. **The spine is OCI
registries**, with the public package registry for the artifact's purl type as
the uncontrolled anchor. Artifact hosting carries this system; source hosting is
peripheral.

## 2. Public upstream — read-only, uncontrolled

| Store | Physically | Written by | Read by |
|---|---|---|---|
| Package registry | the ecosystem's own service — `repo1.maven.org`, `registry.npmjs.org`, `pypi.org`, `crates.io`, `proxy.golang.org` | upstream maintainers — **nobody in the alliance** | ⑦ at commissioning; maker at build; verifiers at rebuild; gate at rule 3 |
| Upstream git | the project's own forge (GitHub/GitLab/self-hosted) | upstream maintainers | maker; verifiers |
| OSV / NVD | `api.osv.dev` REST; NVD JSON feeds | upstream | ⑦ at scoping |
| Go checksum log | `sum.golang.org` (Trillian-backed) | Go team | verifiers |

Anchor strength is not uniform — npm and PyPI permit deletion, so those need a
**supplementary log witness at commissioning**
(`noteworthy-ecosystem-generalization` §1).

## 3. Issuer side (alliance)

| Store | Physically | Path / shape |
|---|---|---|
| **Master repo** | one git repository, e.g. `github.com/finos/osera-spec` | `schemas/contract/v{N}.json` · `policy/admission-v{N}.rego` · `compiler/` (source of ①) · tagged + released per version, **never deleted** |
| **Contract store** | **not a separate service.** The signed L-1 is a DSSE-wrapped in-toto statement. Published as a file in the master repo (`contracts/{contractId}/v{N}.json`) for human retrieval; **authoritative copy is the digest**, logged in Rekor and carried in the bundle | file + log entry |
| **TUF metadata** | **static files over HTTPS** — object storage + CDN (S3/GCS/R2). TUF is inherently a file tree, not a service | `root.json`, `timestamp.json`, `snapshot.json`, `targets.json`, `delegations/{bank}.json` |
| **Rekor** | a **FINOS-operated Rekor server** — which means Trillian plus a backing SQL database, an availability commitment, and a key custody obligation. Not a small operational undertaking | append-only Merkle log |
| **Fulcio / CA** | either the public Sigstore Fulcio, or a FINOS-operated instance. **UNDECIDED** — public is simpler; a private CA fits embargo handling | X.509 chain |
| **Artifact store** | the ecosystem-native repository for the purl type. Artifact bytes are **never duplicated** into OCI | native repo |
| **Attestation store + index** | attestations as OCI blobs / Archivista, plus the **digest → attestation index**. The index is **untrusted** — a lookup, never evidence — and rebuildable by replaying Rekor (`noteworthy-attestation-index`) | OCI blobs + index |
| Maker build infra, recipe repo | maker's own CI and git | not ours |
| Verifier rebuild infra × n | each verifier's own CI — mostly peer on-prem | not ours; harness must be distributable (§7) |

## 4. The perimeter

What crosses is the **evidence core** — an OCI image index, or a deterministic
tar with the same manifest digest when air-gapped. The crossing is a copy rather
than a protocol, and sealing a container confers no authority on its contents.

**Two containers, two sites (`noteworthy-bundle-split`).** The issuer seals the
core once at Fulfilled — L-1, L0–L8, the compiled layout and the policy bundle —
and its digest is the same for every consuming bank, which is what lets two
members cite one evidence set to each other and to a supervisor. Each bank's ③
then seals its own **ingest envelope** around that core digest: trust-root
snapshot, checkpoint set, Fulcio chain, and the local artifact locator. Evidence
is shared because it is frozen; trust material is per-bank because its clock runs
at that bank's gate.

**If the gate needs it, it ships in one of the two.** This is why the master repo,
authoritative for schemas and policy, is *never read at verify time*: the schema
and its matching policy bundle ship **pinned by digest inside the core**, with
the repo as the publication source and re-derivation target.

**Resolution is online; verification is offline.** The attestation index is read
by ③ *before* the envelope is sealed, which is why a central index does not
breach hermeticity.

Freshness applies to the envelope: TUF snapshot ≤ 7 days, checkpoint set ≤ 24
hours. The core has no clock, so it may cross ahead of the envelope on any
schedule — including, for an air-gapped estate, well ahead of it.

## 5. Bank side

| Store | Physically | Notes |
|---|---|---|
| **Quarantine registry** | a separate repository in the bank's existing Artifactory/Harbor, or a distinct namespace | **exactly one reader — the gate.** A control, not a convenience: any other reader means an app team can consume an unadmitted artifact |
| **OCI bundle store** | the bank's OCI registry (Harbor/Artifactory/zot) | immutable; holds the mirrored **cores** and this bank's **envelopes**. Blob sharing is why one core and one trust-root snapshot are stored once and referenced by every envelope over them |
| **Trust material store** | a **directory on disk under configuration management**, refreshed on a schedule — not a service | `tuf/` snapshot, `fulcio/` roots, `checkpoints/`, `schema/`, `policy/` |
| **Gate runner** | a CI job or container invoking `in-toto-verify` then Witness/OPA; stateless | reads one envelope and the core it names, and nothing else |
| **Verdict store** | content-addressed files (`verdicts/{sha256}.json`) in object storage or an OCI artifact. **UNDECIDED** — file tree is simpler; OCI keeps one storage technology | immutable |
| **CI executor** | the bank's existing CI (Jenkins/GitLab/GHA runner) running ④ | writes L9; never leaves the bank |
| **Golden repo** | the bank's existing repository manager — Nexus/Artifactory, ecosystem-native (Maven repo for jars, npm registry for packages) | the one path to consumption |
| **Ledger store** | **UNDECIDED between** (a) append-only JSON lines in git or object storage, hash-chained by content; (b) a Postgres table with a `prev_hash` column plus projection tables. (a) is more faithful to the append-only discipline; (b) is what an operations team will actually want | events are durable; rows and pointers are projections |
| **CMDB** | the bank's existing system (ServiceNow or equivalent) | read-only to us |
| **Console** | a web app plus API over the projections | writes nothing durable |

## 6. Artifact and attestation live apart — resolved

Making the stores concrete surfaced a real conflict. Chain principle #5 assumes
attestations are resolvable from the artifact digest via **OCI referrers**. But a
hardened `.jar` lives in a **Maven repository** and an npm package in an **npm
registry** — none of which are OCI registries or support the Referrers API. The
artifact and its attestations therefore live in different systems.

**Resolved by `noteworthy-attestation-index`:** artifact bytes stay in the
ecosystem-native repository and are never duplicated; attestations live in OCI /
Archivista blobs; and a **central digest → attestation index** supplies
discovery. This is safe because the index is a *lookup, not evidence* — no
admission rule depends on it being honest, a wrong index fails immediately
against signed and digest-bound attestations, and it is a projection over Rekor,
so omission is detectable rather than silent. Dual-publishing the bytes was
considered and rejected as duplication in service of a discovery problem.

Consequence for the **golden repo**: app teams consume via their native package
manager, so the bank-side copy stays ecosystem-native and the OCI bundle store
sits beside it rather than replacing it.

## 7. Still physically undetermined

- **Verifier rebuild siting** — hybrid by design; peer on-prem by default now
  that verification is a duty, which makes the rebuild harness a **distributable
  package rather than a hosted service**. Uncosted.
- **Air-gapped variant** — the tar projection plus a 24-hour checkpoint clock
  implies a courier process and a **staging host on each side of the perimeter**.
  Only the envelope is on the daily tempo; cores move on their own schedule and
  can be batched.
- **Core mirroring and retention** — where a bank keeps the cores it has
  admitted against, and what it does when a core named by a standing verdict is
  no longer served by the issuer (`artifact-evidence-bundle` §7).
- **Fulcio siting**, **verdict store**, **ledger store** — marked UNDECIDED above.
- **Index/log reconciliation** — something must periodically replay Rekor and
  confirm the index is complete. Whose job, and how often.

## 8. Relation to the other axes

- `artifact-architecture` — §1's zones and §6's component register are the
  logical counterpart; ①–⑨ are the services acting on these stores.
- `artifact-evidence-bundle` — defines the core and the envelope that cross §4.
- `artifact-data-model` — defines the records these stores hold.
- `artifact-contract-lifecycle` / `artifact-product-lifecycle` — define *when*
  each write happens.
