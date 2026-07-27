```yaml
id: noteworthy-interop-stance
type: noteworthy
title: Decision — the claim is interoperability, not absence of alternatives
status: active
review: proposed
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-rename-pass
  timestamp: 2026-07-27T00:00:00Z
createdAt: 2026-07-27T00:00:00Z
updatedAt: 2026-07-27T00:00:00Z
```
# Decision: the claim is interoperability, not absence of alternatives

**Decision.** code_tracer claims **conformance to open standards and
interoperability with the tools a bank already runs**. It does not claim that no
alternative exists.

The working paper never made a novelty claim — Parts I–IV argue the model and
Part IV states its limits. But three places assert a *market* claim, and those
change: `artifact-architecture` §4 ("the product surface that does not exist
off-the-shelf"), §6's component register bucket, and the presentation's "six
components do not exist off the shelf."

## Why the market claim is the wrong one to make

It is contestable, and it is contestable by the people in the room. A landscape
scan (2026-07-27) found the gate's function partly covered from two directions:
**Sonatype Repository Firewall** and **JFrog Curation** already quarantine
arriving components before they enter a repository, and **JFrog AppTrust**
already collects signed in-toto evidence and evaluates policy at promotion gates.
Neither does what this design does — they gate on reputation and vulnerability
intelligence, or on evidence about the consumer's *own* SDLC — but "nothing
exists" invites the reply "we already own something that does this," and the
conversation is then about products rather than about the control.

The stronger single counter-example is not a supply-chain product at all. **A
Linux distribution vendor that backports fixes to old versions, signs the
artifacts, publishes SBOM and VEX, and gives customers exposure tracking has run
an end-to-end backpatch-consumption pipeline for two decades.** The difference is
real and worth stating precisely: that model is **single-vendor and
trust-the-vendor**; this one is **multi-party and verify-don't-trust**, with the
specification commissioned before the work and the result independently
re-derived. Claiming *the only end-to-end solution* loses that argument. Claiming
*the only design where the consumer verifies rather than trusts* wins it.

## What interoperability commits us to

Eleven of the standards the design touches become **conformance targets** rather
than competitors, and the design already integrates every one: in-toto and
`in-toto-verify`, Witness/Archivista, SLSA and VSA, DSSE, Sigstore
(cosign/Fulcio/Rekor), TUF, Rego/OPA, CycloneDX, OpenVEX/CSAF, OSV, and OCI
referrers. All are open source or open specifications; Witness/Archivista
additionally carry commercial support.

The commitment is that **inputs and outputs are published, not internal**: which
predicate types the gate consumes, which it emits, the evidence bundle's wire
format, and what a third party must implement to produce evidence we accept or to
re-verify a decision we made. That promotes `artifact-evidence-bundle` and the
L-1 schema from internal design to published interface, and it is what §9's
contract-schema compatibility item is really about.

## Prior art worth reading rather than rediscovering

**`repro-threshold` and `rebuilderd`** implement consumer-side m-of-n
verification against independent rebuilders, gating package installation on a
threshold of signed reproduction attestations. That is the shape of §3.6, working
today, at package-manager level — without a contract, scope, vuln-proof or
ledger. It does not diminish the design; it does mean the quorum should be
presented as an application of an established pattern rather than an invention.

The correlated-failure limit already in Part IV is independently stated by SLSA:
reproducers must be genuinely independent, or a single defect in shared rebuild
tooling compromises all of them at once.

## Three live dependencies on the alliance

The producer side this design consumes is **largely unbuilt**. As of 2026-07-27
the alliance ships built backpatch artifacts through existing proxies, and
*signing, full SBOM and VEX are on the roadmap*. There is no L8, no verifier
quorum, and no registry. Three formation workstreams — all marked indicative and
subject to participant agreement — bear directly on this design:

| Workstream | Deliverable | What it decides for us |
|---|---|---|
| WS1 | Artifact-naming & release spec; signing, SBOM, VEX | the coordinate scheme, and whether L0–L7 exist at all |
| WS2 | Consumption evidence pack, mapped to DORA/NIS2/CRA | whether `artifact-evidence-bundle` is *the* pack, a proposal for it, or a competitor |
| WS3 | Open production standard (SLSA/SBOM/VEX), portable-patch conformance | the shape of the evidence the gate reads |

This inverts how the artifacts currently read. `noteworthy-two-sited-scope`
assumed the issuer side was ours to build; naming and the evidence pack are
alliance deliverables. The useful posture is therefore **specify the consumer
requirement precisely enough that WS1 and WS3 can produce against it** — which is
a stronger contribution to a forming alliance than a compatibility claim.

## A conflict to resolve before it hardens

The alliance's shipping lines use **`+backpatch.NNN`** in Maven coordinates.
`noteworthy-purl-namespace` fixed **`-osera.N`**, and
`noteworthy-ecosystem-generalization` reserved the `+` form for PEP 440 precisely
because build metadata is ignored for precedence in some grammars. Two open
questions follow, and naming is a WS1 deliverable rather than ours to set.

**Binds:** replaces the off-the-shelf language in `artifact-architecture` §4 and
§6; makes `artifact-evidence-bundle` and the L-1 schema published interfaces.
**Open:**
1. Does `+backpatch.NNN` satisfy the sort-above-baseline invariant under Maven's
   version ordering? If not, that is a finding for WS1 rather than a change here.
2. Is `artifact-evidence-bundle` offered to WS2 as the consumption evidence pack,
   or kept as one bank's implementation of whatever WS2 settles?
3. The scan covered five categories and was not exhaustive — container-hardening
   vendors, Kubernetes admission controllers, notary services and the LTS-support
   category were not examined.
