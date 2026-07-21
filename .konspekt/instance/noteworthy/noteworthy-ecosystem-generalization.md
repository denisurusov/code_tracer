```yaml
id: noteworthy-ecosystem-generalization
type: noteworthy
title: Decision — ecosystem-agnostic by purl type; anchor strength and reproducibility gate support
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T20:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 4b0a3c7f7b2669994db2a97c790c2fe389507fe8
  contentHash: 4b0a3c7f7b2669994db2a97c790c2fe389507fe8
  timestamp: 2026-07-21T20:20:00Z
createdAt: 2026-07-21T20:20:00Z
updatedAt: 2026-07-21T20:20:00Z
```
# Decision: ecosystem-agnostic by purl type

**Decision.** The design is **not Java-specific**. Wherever the artifacts say
"Maven Central," the correct referent is **the canonical public registry for the
artifact's purl type** — Maven Central, npm, PyPI, crates.io, the Go module
proxy, NuGet, and so on. purl was already ecosystem-agnostic (it is the ★
identity standard); Java crept in through the **anchor** (§3.4) and through the
purl suffix scheme, both of which were over-fitted to one ecosystem.

**But ecosystems are not interchangeable**, and the two places they differ are
exactly the two properties the whole chain rests on.

## 1. Anchor strength varies — and the anchor is load-bearing

§3.4 requires `baseline_digest` to be re-pullable from the public registry. That
is a *different strength of claim* per ecosystem:

| Ecosystem | Anchor property | Strength |
|---|---|---|
| Maven Central | immutable; no unpublish | strong |
| Go modules | checksum database (`sum.golang.org`) | strongest — an independent transparency log already exists |
| crates.io | yank hides but does not delete | strong |
| npm | unpublish permitted within a window | **weak — a baseline can vanish** |
| PyPI | deletion possible | **weak** |

Consequence: rule 3 cannot be a single sentence. Ecosystems whose registries
allow deletion need a **supplementary anchor witness** — at minimum, the baseline
digest logged in the transparency log at commissioning, so that "this digest was
the published artifact at time T" survives the artifact being unpublished later.
The contract should record which anchor class applies, so the gate knows what
kind of claim rule 3 is making.

Note that Go is the interesting case in the other direction: it already has the
independent, append-only checksum log this design has to construct by hand
everywhere else.

## 2. Reproducibility feasibility is a gate on support, not a rollout order

Rule 5' requires independent rebuilds to converge on the same digest. That is
workable in Java/Maven, good in Go and Rust, and materially harder in npm and
Python, where builds routinely embed timestamps, paths, and platform detail.

**Without reproducibility there is no digest agreement, therefore no quorum,
therefore no admission.** So ecosystem support is a **feasibility question, not a
sequencing preference**: an ecosystem is supportable when its builds can be made
reproducible, and not before. Stating this plainly avoids a roadmap that promises
npm support the verification model cannot actually deliver.

## 3. Ecosystem onboarding checklist

Adding an ecosystem is a deliberate act with four prerequisites:

1. **Anchor class** — is the registry immutable, or does it need a supplementary
   witness (§1)?
2. **Reproducible builds** — can independent rebuilds converge bit-for-bit (§2)?
3. **Suffix scheme** — a hardened coordinate that satisfies the ordering
   invariant (§4, `noteworthy-purl-namespace`).
4. **Attestation carriage** — can the registry (or an OCI sidecar) carry
   referrers, or is a `.intoto.jsonl`-style sidecar needed?

## 4. The suffix scheme is per-ecosystem

`noteworthy-purl-namespace` fixed `-osera.N`, chosen against Maven's version
grammar. Under **semver** that string is a *pre-release*, so `3.2.1-osera.1`
sorts **below** `3.2.1` — npm, cargo and every semver resolver would treat the
hardened artifact as **older than the vulnerable one it replaces**. That is
precisely the footgun the decision existed to prevent, reintroduced by ecosystem.

The fix is an invariant plus per-ecosystem encodings — see the amendment in
`noteworthy-purl-namespace`. The principle (distinct, legible, digest-is-still-
identity) is unchanged; only the encoding was over-fitted.

**Binds:** `artifact-architecture` §3.4 and rule 3 (anchor class), §7 (purl,
registry rows), §1 (public upstream zone described by purl type rather than Maven
Central); `task-contract-authoring` (⑦) resolves the anchor against the registry
for the purl type, not Maven specifically.
**Amends:** `noteworthy-purl-namespace` (suffix encoding).
**Opens:** which ecosystems are in scope for v1, decided on the §3 checklist
rather than on demand.
