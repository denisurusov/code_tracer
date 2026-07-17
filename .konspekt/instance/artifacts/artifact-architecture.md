```yaml
id: artifact-architecture
type: artifact
title: code_tracer — Architecture & Design
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T18:15:00Z
provenance:
  conversationId: konspekt-architecture-draft
  inputs:
    - osera-attestation-chain.md   # artifact #1 (historical, now inlined here)
    - osera-bank-schematic.svg      # artifact #2
    - osera-standards-register.md   # artifact #3
createdAt: 2026-07-17T00:00:00Z
updatedAt: 2026-07-17T18:15:00Z
```

# code_tracer — Architecture & Design

**Status:** accepted (`review: accepted`). **Integrating overview.** The design is
factored into three axes; this document ties them together and is the home of the
evidence-chain axis:

- **Evidence chain** — the L-1…L9 attestation format the gate consumes. §3 below.
- **Product lifecycle** — the candidate state machine (Commissioned…Sunset).
  `artifact-product-lifecycle`.
- **Data model** — the records backing each state. `artifact-data-model`.

§4–§8 are the cross-cutting concerns that bind the three: the gate, the ledger,
the component register, the standards binding, and the regulatory narrative.

> Historical note: this document supersedes and inlines three earlier
> per-conversation artifacts (attestation chain, solution schematic, standards
> register) that did not persist. The attestation chain is reproduced in full in
> §3 and is the single source of truth for the chain.

---

## 1. Context & scope

code_tracer is the **bank-side admission gate and ledger at the end of the OSERA
supply chain** — not the supply chain itself. OSERA (Open Source Enterprise
Resiliency Alliance, a FINOS coalition) mutualizes the backpatching of old,
widely-shared open source across regulated banks: a patching vendor (Moderne)
hardens vulnerable upstream artifacts, and the alliance distributes the result
with machine-readable evidence. code_tracer is the on-prem machinery that
*admits* that hardened output into one bank under a verifiable, automated
contract, and *tracks* the bank's exposure to it afterward.

**What it is:** the gate (does this artifact conform to a scope the maker
committed to before starting, independently verified?) and the ledger (which of
our applications run a time-bound backpatch, and when does it lapse?).

**What it is not:** the patching pipeline, the attestation *producers*, the
transparency log, or the alliance's governance. Those are upstream and
integrated-against, not built.

### Two zones

The whole system splits cleanly at the bank boundary:

- **Outside** — build, test. The vendor's and verifiers' infrastructure; the
  evidence-**production** half. code_tracer does not run here.
- **Inside** — resolve, verify, accept, re-test, deploy, adopt, track. The
  bank's on-prem gate and ledger; the evidence-**consumption** half. This is
  code_tracer.

Everything code_tracer does inside the bank is **hermetic and offline** — no
callout to the vendor, no live trust query — so that a regulator can re-run the
entire admission decision from stored inputs and reach the same verdict.

---

## 2. The two ingest classes

One gate handles two things with different risk profiles:

- **(a) OSERA-backpatched existing OSS.** A known upstream baseline was
  modified. The risk is the **provenance and correctness of the change** — did
  they start where they claim, fix exactly what was commissioned, and break
  nothing? This is the class the attestation chain (§3) is built for.
- **(b) FINOS-native projects.** New code with no prior baseline. The risk is
  **project health and origin** — is this a real, maintained, licensed project,
  and is the artifact what the project shipped?

They share a gate but exercise different parts of it: class (a) leans on the
baseline/transformation/vuln-proof levels (L0–L7) that only make sense against a
prior artifact; class (b) collapses those to a provenance-and-health check but
keeps the same verification, quorum, and acceptance machinery (§3.6, §4). The
gate is parameterized by ingest class, not forked into two tools. The lifecycle
fixes this as an invariant — the a/b divergence is isolated to the Built/Verified
states and the machine is class-agnostic from Resolved inward
(`artifact-product-lifecycle` §4).

---

## 3. The attestation chain

This is the **input contract** the gate consumes — the evidence format an
artifact must arrive with to be admissible. code_tracer does not produce it; it
resolves it, verifies it, and reads its meaning. Reproduced here in full.

### 3.1 Core principles

1. **Everything is digest-bound.** No attestation refers to a version string.
   Subjects are `sha256` digests plus a `purl`. Version strings are metadata,
   never identity.
2. **Two artifacts, always named.** Every link carries both `baseline_digest`
   (the vulnerable upstream artifact) and `hardened_digest` (the OSERA output).
   A claim naming only one is unverifiable and MUST be rejected.
3. **The chain is a DAG, not a list.** Each attestation references its inputs by
   attestation digest. The graph is traversable from the deployed artifact back
   to the upstream commit.
4. **The anchor must be independently observable.** See §3.4 — the single most
   important property and the easiest to get wrong.
5. **Attestations are OCI referrers / sigstore bundles resolvable from the
   artifact digest.** Not links in release notes. Not rows in a portal.

### 3.2 The L-1 backpatch contract — the root referent

Before any work starts, the alliance issues a **backpatch contract** and the
vendor **signs acceptance** of it. This makes the deliverable a *commissioned
spec*, not a post-hoc submission — it closes the loophole where a maker picks an
easy test corpus after the fact. The contract is **L-1**: the root the entire
chain above it is verified *against*. It freezes four things:

- **Baseline** — `contract.baseline.digest`, the exact upstream artifact to
  start from.
- **Scope** — `contract.scope.cvesInScope` (what must be fixed) and
  `contract.scope.explicitlyOutOfScope` (what must not be silently touched).
- **Test corpus** — `contract.acceptanceCriteria.testCorpus`, named by digest so
  it cannot be substituted.
- **Schedule** — delivery window.

The contract is machine-readable and content-addressed. It **compiles directly
to an in-toto layout** (§4), which is what makes admission mechanical rather than
a human reading a PDF.

### 3.3 The chain, L0–L9

| #  | Attestation | Signer | Asserts | Subject |
|----|-------------|--------|---------|---------|
| L0 | **Baseline** | Moderne | This is the upstream artifact and source commit we started from | baseline_digest |
| L1 | **Vulnerability Assessment** | Moderne | These CVEs affect these components in the baseline SBOM | baseline_digest |
| L2 | **Transformation** | Moderne | This content-addressed recipe set / source patch was applied | baseline → hardened |
| L3 | **Build Provenance** (SLSA v1) | Moderne | Hardened artifact was built from L0 source + L2 patch on a pinned toolchain | hardened_digest |
| L4 | **Test Results** | Moderne | Upstream suite results vs baseline; API/ABI compat; patched-path coverage | hardened_digest |
| L5 | **Vulnerability Proof** | Moderne | Per CVE: PoC fails on baseline_digest, passes on hardened_digest | both |
| L6 | **SBOM (out)** + diff | Moderne | Composition of the hardened artifact, and delta vs the L0 SBOM | hardened_digest |
| L7 | **VEX** (OpenVEX/CSAF) | Moderne | Per CVE: `fixed`, justified by reference to L5 | hardened_digest |
| L8 | **VSA** | **Verifier(s)** | Independently rebuilt → digest match; re-ran L4/L5 → result match; policy passed; conforms to contract | hardened_digest |
| L9 | **Acceptance** | **Bank** | Internal contract/integration tests passed; promoted to golden repo | hardened_digest |

L0–L7 are the **maker's claims**. **L8 is the only attestation that converts
claims into evidence** — an independent party re-derived the result. L9 is the
bank's own control and never leaves the bank.

### 3.4 The anchor problem

L0 is a *self-claim*. If the vendor merely asserts "we started from
`commons-x:1.2.3`," the entire chain is a self-claim with eight extra steps. L0
is only load-bearing if it is **independently re-derivable from public data**:

- `baseline_digest` MUST match the artifact publicly retrievable from Maven
  Central at the stated coordinates. The verifier re-pulls and compares. No
  trust required.
- `source_ref` MUST be a git commit SHA in the public upstream repository.

If the anchor is not independently observable, nothing above it is worth
verifying. This is the property most likely to be quietly wrong.

### 3.5 How the contract binds the chain

The L-1 contract is not a document beside the chain — it is the **referent every
link points back to**:

- **L0 Baseline** must equal `contract.baseline.digest`. Mismatch ⇒ wrong
  starting point ⇒ reject.
- **L1 Vuln Assessment** must cover *exactly* `contract.scope.cvesInScope` — no
  more (silent scope creep), no fewer (under-delivery). Out-of-scope CVEs must
  match `explicitlyOutOfScope`.
- **L4 Test Results** must be results *of the corpus named in*
  `contract.acceptanceCriteria.testCorpus`, verified by digest, so the maker
  cannot substitute an easier suite.
- **L5 Vuln Proof** must exist for each `cvesInScope` entry, satisfying the
  fail-on-baseline / pass-on-hardened obligation the contract fixed in advance.
- **L8 VSA** carries a `contractConformance` assertion — not just "digest
  matched, tests passed" but "output conforms to contract OSERA-2026-0142 v1."

The VSA gains an `osera` block:

```jsonc
"osera": {
  "contract": {
    "id": "OSERA-2026-0142",
    "version": 1,
    "digest": { "sha256": "<contract_digest>" },
    "conformance": "FULL",          // FULL | PARTIAL | BREACH
    "corpusMatchedContract": true,  // the tests run == the tests promised
    "scopeMatchedContract": true,   // CVEs fixed == CVEs commissioned
    "deliveredWithinSchedule": true
  }
}
```

**Net effect:** the gate no longer asks "did the maker do good work?" It asks
"did the output conform to a scope the maker committed to *before starting*,
independently verified?" That is a categorically stronger control statement, and
it is the sentence that belongs in the DORA/CRA narrative (§8).

### 3.6 The quorum — k-of-n verifiers

**Why a single checker is not enough.** The problem is blockchain-adjacent —
minters are testers, evidence is produced by the party doing the work — but the
useful analogy is narrow. What transplants: *verify, don't trust; reproducible
builds let any party re-derive the answer.* What does **not** transplant:
consensus machinery, ledgers, tokens — there is no double-spend, no scarce
resource, and the alliance is a legitimately trusted neutral venue. A consensus
protocol solves a problem OSERA does not have and adds latency a bank release SLA
cannot absorb.

But the proof-of-work analogy breaks where it matters. In Bitcoin, work is
expensive to produce and **cheap to verify**. Here, reproducing a build and
re-running a suite costs roughly what producing it cost — **verification does not
compress.** Consequence: a single checker is both a throughput bottleneck and a
single point of trust. Compromise one verifier's keys or build infrastructure
and the whole model collapses in one move; the maker/checker split hardens
against *maker* compromise and does nothing about *checker* compromise.

**The fix is a quorum, not a chain.** Reproducible builds are deterministic, so
independent verifiers converge on the same digest **without coordinating** — a
natural Schelling point. Agreement without a consensus protocol.

- **Moderne mints** L0–L7 (maker, and tester).
- **N independent verifiers** each rebuild, re-run the suite, and replay the vuln
  proofs — FINOS plus participating institutions (the pilot firms already have
  the CI capacity; marginal cost is one job).
- **Each publishes its own VSA**, independently signed and logged.
- **Admission requires k-of-n, not 1-of-1.**
- **Threshold / aggregate signing** (FROST, BLS) so the bank's gate still
  verifies a single signature against a single quorum key.

**Disagreement is the signal, not the failure.** If five firms rebuild and four
agree while one dissents, that is either a reproducibility defect in the
toolchain spec or something worse — either way you want to know, loudly, before
promotion. A dissenting VSA is therefore **disqualifying, not outvoted**:
`k-of-n` with *zero dissent*, not simple majority. Dissent triggers
investigation, not arithmetic. No single-checker design can produce this signal
at all, and it is the strongest argument for the model.

### 3.7 Admission policy

The gate resolves the attestation set for a candidate artifact digest `D`, then
evaluates the policy below. Rules run in two passes: **structural**
(`in-toto-verify` against the compiled layout — right steps, right signers, DAG
intact) and **semantic** (Rego/Witness over the resolved predicate contents).
Promote only if every rule holds.

```
  1. All attestations in the set are DSSE-wrapped; signatures valid; signer
     certs chain to a trusted root (Fulcio); each entry present in the
     transparency log (Rekor).                              [signature validity]
  2. A VSA (L8) exists over D, signed by the FINOS verifier key, current,
     not revoked.                                     [checker present — see 2']
  3. L0 anchor is independently re-derivable: baseline_digest matches the
     artifact at the stated Maven coordinates, and source_ref is a real commit
     SHA in the public upstream repo.                            [anchor, §3.4]
  4. The set forms a connected DAG from D back to L0; every attestation names
     its inputs by digest; no dangling nodes; no version-string identity.
                                                          [DAG integrity, §3.1]
  5. L8 asserts an independent rebuild whose digest equals D
     (digestMatch == true).                          [reproducibility — see 5']
  6. L3 (SLSA) provenance: D was built from L0 source + L2 transformation on
     the toolchain pinned in the layout.                      [build integrity]
  7. L2 transformation recipe/patch is content-addressed and its digest matches
     the one the layout expects.                      [transformation integrity]
  8. L4 results are over the corpus named by digest in the contract and meet the
     declared thresholds (compat pass; patched-path coverage ≥ threshold).
                                                             [test conformance]
  9. L5 vuln proof exists for every in-scope CVE: PoC fails on baseline_digest,
     passes on hardened_digest.                        [vuln-proof completeness]
 10. L7 VEX marks each in-scope CVE fixed, and every "fixed" status references
     its L5 proof — no unjustified suppression.            [VEX ↔ proof linkage]
 11. L6 SBOM composition matches D and the declared diff vs the L0 SBOM; no
     undeclared components introduced.                         [SBOM integrity]
 12. Every subject is (purl + sha256 digest), never a version string;
     baseline_digest and hardened_digest both present on every link that
     requires them.                                     [digest-binding, §3.1]
 13. Resolve contract C = VSA.osera.contract.digest; C.status == ACCEPTED,
     signed by maker trust-anchor; VSA.osera.contract.conformance == "FULL";
     C.scope.cvesInScope ⊆ (CVEs marked fixed in L7 VEX).    [contract binding]

     → any rule fails: DO NOT PROMOTE.
```

**Quorum amendments (§3.6).** When the verifier quorum replaces the single
checker, rules 2 and 5 are superseded by:

```
  2'. ∃ VSA set {V₁..Vₙ} over D, each signed by a distinct verifier in the
      OSERA verifier registry, each current, none revoked.
  5'. |{Vᵢ : Vᵢ.osera.rebuild.digestMatch == true}| ≥ k
      AND ∄ Vᵢ with digestMatch == false.            [zero-dissent quorum, §3.6]
```

> **Provenance.** Rules 2', 5', and 13 are recovered verbatim from the source
> design conversations. Rules 1–12 are a **reconstruction** — derived from the
> chain (§3.1–§3.6) and its principles, not recovered from the original
> enumerated ruleset (which did not persist). They are faithful to the design's
> logic; review against the original if it resurfaces.

### 3.8 The legal stub

The machine-readable contract is the load-bearing artifact; the legal layer
exists only to make it *mean* something and to answer what the schema
deliberately does not:

- **Warranty:** almost certainly `none` — a neutral non-profit venue
  distributing hardened OSS will not warrant fitness. This is not a gap to fix;
  it is a **finding the bank's risk function must formally accept in writing.**
  The machine-readable contract *bounds* that acceptance: "as-is, but provably
  conforming to a committed scope and corpus" is a far more acceptable as-is than
  "as-is, trust us."
- **Liability / indemnity:** likely no one is contractually answerable when a
  conforming backpatch nonetheless breaks production — which is exactly why the
  bank's own **L9 acceptance testing is non-optional**, not a nicety.

---

## 4. The verification gate

The gate is the product surface that does not exist off-the-shelf. It runs
inside the bank, hermetic and offline, in two passes over a candidate artifact:

1. **Structural** — `in-toto-verify` against the layout compiled from the L-1
   contract. Confirms the right steps ran, signed by the right parties, with the
   DAG intact and thresholds met.
2. **Semantic** — a Rego policy evaluated via Witness over the resolved
   predicate contents (§3.7). Confirms the evidence *means* what the contract
   requires.

Both passes consume the same resolved attestation set and produce a single
promote / reject verdict — the `Gate` state in the lifecycle, recorded as an
immutable `verdict` over the compiled `policy-object`s in the data model
(`artifact-product-lifecycle`, `artifact-data-model` §4). The four build
components that make this work:

- **① Contract → in-toto layout compiler.** Compiles the accepted L-1 contract
  into the in-toto layout the verifier enforces. OSERA-specific; exists nowhere
  today. *(task-layout-compiler)*
- **② Rego semantic policy.** The meaning layer in-toto cannot read — CVEs-fixed
  ⊇ scope, k-of-n digest agreement, coverage ≥ threshold, conformance == FULL.
  Runs at the same gate, immediately after structural verification.
  *(task-rego-policy)*
- **③ Attestation resolver / collector.** Discovers and collects the
  attestations attached to an artifact (OCI referrers / sigstore bundles keyed
  to the digest) and feeds them into the gate. May shrink to configuration if
  Archivista is adopted. *(task-attestation-resolver)*
- **④ Bank-acceptance inspection harness.** The **L9** step *inside* the gate:
  runs the bank's own app-team contract/integration tests as an in-toto
  inspection at verification time, folding pass/fail into the promote-or-reject
  decision. The part OSERA cannot do for you. *(task-acceptance-harness)*

---

## 5. The ledger

- **⑤ Exposure + sunset tracker.** Tracks bridge-expiry per application — which
  apps run a time-bound backpatch and when it lapses. The "ledger" half: least
  "supply chain," most "your existing CMDB plus a date field," cheap to
  prototype, and the piece the risk function feels day-to-day.
  *(task-exposure-tracker)*

This is deliberately downstream of the gate: the gate decides *whether* an
artifact is admissible; the ledger tracks *what the bank is now exposed to* once
it is admitted, and drives the sunset/re-verification cycle.

The ledger backs the `Active`/`Sunset` states of the lifecycle; its record shape
is the event-sourced `ledger-row` (`artifact-data-model` §5), with `Expiring`
derived, not stored.

---

## 6. Component register — build / integrate / not-ours / the-gap

| Bucket | Items |
|---|---|
| **Build** (ours; nowhere off-the-shelf) | ① layout compiler · ② Rego semantic policy · ③ attestation resolver · ④ acceptance inspection harness · ⑤ exposure/sunset tracker |
| **Integrate** (proven OSS, wired in) | `in-toto-verify` (structural) · Witness/OPA (Rego eval) · cosign / Sigstore (resolution + signature) · Archivista (attestation store, optional) · the bank's existing CMDB (ledger substrate) |
| **Not ours** (upstream, integrated-against) | Moderne's patching pipeline (L0–L7 production) · the verifier quorum's rebuild infra (L8) · Maven Central / public upstream repos (the anchor) |
| **The gap** (unresolved) | Trust-root governance & key rotation for the verifier registry (TUF-shaped) · CycloneDX-vs-SPDX decision (§7) |

---

## 7. Standards & formats binding

The load-bearing standards, mapped to the level or component that consumes each.
★ = load-bearing for the chain; the rest are integrate-or-map-against.

| Standard | Consumed at | Role |
|---|---|---|
| ★ **purl** | all subjects | Attestation subject identity (`pkg:maven/…`) + digest; drives the `1.2.3` vs `1.2.3-osera.1` namespace decision |
| ★ **OCI Image/Artifact + Referrers API** | ③ resolver, L6/L7 | Digest-binding; "attached = referrer, not a link" — subject digest → attestation set, no out-of-band lookup |
| ★ **in-toto** + Attestation Framework | ① compiler, gate | The framework the whole chain compiles to: layout + links + `in-toto-verify`; thresholds = the k-of-n quorum; inspections = ④ acceptance |
| ★ **SLSA** | L3 | Build-provenance predicate + levels; the vocabulary the risk function already knows |
| ★ **VSA** | L8 | Exactly the verifier's attestation — records the result of checking someone else's artifact |
| ★ **DSSE** | all | The signing envelope in-toto / Sigstore attestations ride in |
| ★ **Sigstore** (Cosign/Fulcio/Rekor) | ③ resolver | Keyless signing, cert authority, transparency log; `cosign download attestation <digest>` is the resolution path |
| ★ **Reproducible Builds** | L8, §3.6 | Bit-for-bit rebuild → digest equality; the Schelling point behind the quorum |
| ★ **CycloneDX** / **SPDX** | L6 | SBOM (+ inline VEX for CycloneDX); SPDX for license IDs. **Choosing between them is a consequential early decision (§9).** |
| ★ **OpenVEX** / **CSAF 2.0** | L7 | "fixed, not exploitable, here's the evidence" — must reference L5 to be evidence, not a claim; CSAF is the regulator-facing variant |
| ★ **Rego / OPA** (via Witness) | ② policy | The semantic gate the meaning-checks run in |
| **OSV schema** | L1, ⑤ ledger | Vuln records keyed by `purl` — cleaner than CPE for the exposure graph |
| **TUF** | the-gap | Trust-root, key rotation, compromise recovery for the verifier registry — the unresolved governance question |
| **CPE** | *trap* | Why scanners still fire on a backpatched artifact — CPE match ignores the patch. A problem to suppress (via VEX), not a tool to use |

---

## 8. Regulatory narrative

The frameworks below are **adjacent drivers**, not formats to implement — they
are why the control statement matters:

EU CRA, DORA, NIS2, NIST SSDF, SR 23-4.

The sentence code_tracer lets the bank make to a regulator is the §3.5 net
effect: *not* "we trust the vendor's testing," but "every admitted artifact
provably conforms to a scope the vendor committed to before starting,
independently re-verified by a k-of-n quorum with zero dissent, and separately
acceptance-tested inside our own environment — and we can re-run that decision
offline on demand." That is a DORA/CRA-grade control statement, and it is the
reason the maker/checker split, the L-1 contract, and the quorum all exist.

---

## 9. Open questions / decisions

Cross-cutting; several are now load-bearing elsewhere — the data model
(`artifact-data-model` §6) and the lifecycle (`artifact-product-lifecycle` §8).

- **CycloneDX vs SPDX** for L6 — one SBOM format, chosen early; CycloneDX carries
  VEX inline, SPDX has the stronger license-ID story. Consequential; unresolved.
- **Trust-root governance (TUF-shaped)** — who curates the verifier registry,
  how keys rotate, what happens on compromise. The biggest open gap.
- **Admission ruleset review** — §3.7 rules 1–12 are reconstructed (rules 2', 5',
  13 recovered verbatim); confirm against the original enumeration if it
  resurfaces.
- **Ingest class (b) depth** — how far the gate collapses L0–L7 for FINOS-native
  projects (§2) is sketched, not specified.
- **Archivista adoption** — decides whether ③ is a real build or mostly
  configuration.
- **Quorum parameters** — concrete `k` and `n`, and the verifier onboarding /
  offboarding process.
