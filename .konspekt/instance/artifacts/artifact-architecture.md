```yaml
id: artifact-architecture
type: artifact
title: code_tracer — Architecture & Design
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T19:50:00Z
provenance:
  conversationId: konspekt-architecture-draft
  inputs:
    - osera-attestation-chain.md   # artifact #1 (historical, now inlined here)
    - osera-bank-schematic.svg      # artifact #2
    - osera-standards-register.md   # artifact #3
createdAt: 2026-07-17T00:00:00Z
updatedAt: 2026-07-21T19:50:00Z
```

# code_tracer — Architecture & Design

**Status:** accepted (`review: accepted`). **Integrating overview.** The design is
factored into four axes; this document ties them together and is the home of the
evidence-chain axis:

- **Evidence chain** — the L-1…L9 attestation format the gate consumes. §3 below.
- **Contract lifecycle** — the issuer-side commitment machine (Drafted…Fulfilled)
  that produces the root referent. `artifact-contract-lifecycle`.
- **Product lifecycle** — the candidate state machine (Commissioned…Sunset).
  `artifact-product-lifecycle`.
- **Data model** — the records backing each state. `artifact-data-model`.

§4–§8 are the cross-cutting concerns that bind them: the gate, the ledger, the
component register, the standards binding, and the regulatory narrative. The
interface between the two sides is `artifact-evidence-bundle`.

> Historical note: this document supersedes and inlines three earlier
> per-conversation artifacts (attestation chain, solution schematic, standards
> register) that did not persist. The attestation chain is reproduced in full in
> §3 and is the single source of truth for the chain.

> **Amendment 2026-07-21 (issuer side).** §1, §3, §4, §6, §7 and §9 amended per
> `noteworthy-two-sited-scope`, `noteworthy-compiler-siting`,
> `noteworthy-trust-root-ownership`, `noteworthy-threshold-everywhere`,
> `noteworthy-conformance-binary`, `noteworthy-governance-modes`,
> `noteworthy-transparency-log`, `noteworthy-bundle-format`,
> `noteworthy-authoritative-form`, `noteworthy-bundle-freshness`,
> `noteworthy-revocation-semantics` and `noteworthy-quorum-parameters`.

---

## 1. Context & scope

code_tracer is the machinery at the **two ends of the OSERA supply chain** — the
alliance-side tooling that *commissions* hardened open source, and the bank-side
gate and ledger that *admits and tracks* it. It is not the supply chain itself.
OSERA (Open Source Enterprise Resiliency Alliance, a FINOS coalition) mutualizes
the backpatching of old, widely-shared open source across regulated banks: a
patching vendor (Moderne) hardens vulnerable upstream artifacts, and the alliance
distributes the result with machine-readable evidence.

**What it is:**
- **Issuer side** — authoring and issuing the L-1 backpatch contract, and
  curating the verifier registry and trust root the gate verifies against
  (`goal-issuer-side`, components ⑦⑧⑨).
- **Consumer side** — the gate (does this artifact conform to a scope the maker
  committed to before starting, independently verified?) and the ledger (which
  of our applications run a time-bound backpatch, and when does it lapse?)
  (`goal-the-gate`, components ①–⑥).

**What it is not:** the patching pipeline, the attestation *producers* (L0–L7),
or the quorum's rebuild infrastructure. Those are upstream and
integrated-against, not built. Alliance *governance policy* — who sits in the
trust-root threshold, verifier on/offboarding, compromise procedure — is likewise
out of scope: we build the mechanism, the alliance settles the policy.

### Three zones

The system spans three zones, not two, and the third is the one that makes the
evidence trustworthy rather than circular:

- **Public upstream** — Maven Central, the upstream git repositories, OSV/NVD.
  **Nobody in the alliance controls it**, which is exactly why it is the anchor
  (§3.4). Integrated-against, never annexed.
- **Outside (alliance + maker)** — commission, build, test, verify. The issuer
  side runs here, alongside the vendor's and quorum's infrastructure; the
  evidence-**production** half.
- **Inside (bank)** — resolve, verify, accept, re-test, deploy, adopt, track. The
  bank's on-prem gate and ledger; the evidence-**consumption** half.

Everything code_tracer does **inside the bank is hermetic and offline** — no
callout to the vendor, no live trust query — so that a regulator can re-run the
entire admission decision from stored inputs and reach the same verdict. The
issuer side existing does not relax this: because the bank verifies offline, the
perimeter crossing is a **copy of a self-contained evidence bundle**, not a
protocol (`artifact-evidence-bundle`).

### Two commissioning modes

The alliance commissions work in either of two modes, which map onto the two
trust paths rather than onto two sets of rules:

- **Mutualized** — members vote a project in; spend, benefit and responsibility
  are shared. Trust path `osera-root`.
- **Solo** — a single bank commissions and funds alone and is solely accountable
  for that judgement. Trust path `delegated:<bank>`.

Mode changes **who is accountable for deciding what to commission**, never what
the gate requires: verification is k-of-n with zero dissent either way, because
verification is a **duty of membership** rather than a credit against funding
(`noteworthy-governance-modes`).

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
artifact must arrive with to be admissible. code_tracer does not produce L0–L8;
it commissions the work they attest to, then resolves, verifies, and reads their
meaning. Reproduced here in full.

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

**Chain integrity is load-bearing.** Principles 1–4 are one property seen from
four sides: every admission claim ultimately reduces to *these digests link,
unbroken, back to an independently observable anchor*. Hash-linking is not a
storage convenience here — break one link and everything above it is worthless,
no matter how well-signed. The same discipline recurs in the ledger and the
verifier registry (§5.1).

### 3.2 The L-1 backpatch contract — the root referent

Before any work starts, the alliance issues a **backpatch contract** and the
vendor **signs acceptance** of it. This makes the deliverable a *commissioned
spec*, not a post-hoc submission — it closes the loophole where a maker picks an
easy test corpus after the fact. The contract is **L-1**: the root the entire
chain above it is verified *against*. It freezes:

- **Governance** — `mode`, `sponsor`, `mandateRef` and `trustPath`, so "was this
  properly commissioned?" is checkable rather than assumed.
- **Baseline** — `contract.baseline.digest`, the exact upstream artifact to
  start from.
- **Scope** — `contract.scope.cvesInScope` (what must be fixed) and
  `contract.scope.explicitlyOutOfScope` (what must not be silently touched).
- **Test corpus** — `contract.acceptanceCriteria.testCorpus`, named by digest so
  it cannot be substituted.
- **Quorum size** — `verification.k`, computed as `max(3, ceil(n/3))` at
  issuance, so the artifact is judged against the quorum in force when it was
  commissioned.
- **Schedule** — delivery window.

The contract is machine-readable and content-addressed. It **compiles directly
to an in-toto layout** (§4), which is what makes admission mechanical rather than
a human reading a PDF. Its own issuance state machine — Drafted, Proposed,
Accepted, Delivered, Fulfilled, and three terminals — is
`artifact-contract-lifecycle`.

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
| L8 | **VSA** | **Verifier(s)** | Independently rebuilt → digest match; re-ran L4/L5 → result match; policy passed; conforms to contract; **the log checkpoint this verifier observed** | hardened_digest |
| L9 | **Acceptance** | **Bank** | Internal contract/integration tests passed; promoted to golden repo | hardened_digest |

L0–L7 are the **maker's claims**. **L8 is the only attestation that converts
claims into evidence** — an independent party re-derived the result. L9 is the
bank's own control and never leaves the bank.

The maker's hand-off of L0–L7 is itself frozen: a **delivery manifest**,
assembled by the maker at the Delivered transition, checked for completeness
against `contract.requiredAttestations`, and fixed in time by a transparency-log
entry rather than a signature — see `artifact-contract-lifecycle` §2 and
`artifact-evidence-bundle` §1.

**L8 carries the observed checkpoint** because the log is FINOS-operated (§7). A
single asserted tree head would have to be trusted; k independently observed ones
cannot be split without producing a dissent (`noteworthy-transparency-log`).

### 3.4 The anchor problem

L0 is a *self-claim*. If the vendor merely asserts "we started from
`commons-x:1.2.3`," the entire chain is a self-claim with eight extra steps. L0
is only load-bearing if it is **independently re-derivable from public data**:

- `baseline_digest` MUST match the artifact publicly retrievable from Maven
  Central at the stated coordinates. The verifier re-pulls and compares. No
  trust required.
- `source_ref` MUST be a git commit SHA in the public upstream repository.

If the anchor is not independently observable, nothing above it is worth
verifying. This is the property most likely to be quietly wrong. The anchor is
checked twice: once at commissioning, when the contract is authored against a
baseline that must publicly resolve (component ⑦), and again at admission
(rule 3).

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

**Conformance is binary at the gate.** `FULL` promotes; `PARTIAL` and `BREACH`
never do (rule 13, unamended). They remain valid *findings* about what was
delivered, but have no admission path — the contract is on a course toward
smart-contract execution, and executable terms have no room for a discretionary
middle state. An honest shortfall routes through **contract amendment**, not a
softened verdict: the unfixable CVE moves to `explicitlyOutOfScope` with a stated
reason, the maker re-countersigns, and delivery is `FULL` against a contract that
tells the truth (`noteworthy-conformance-binary`,
`artifact-contract-lifecycle` §4–§5).

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
  proofs. Because verification is a **duty of membership**, `n` is the active
  verifier registry rather than a separately negotiated set; the marginal cost is
  one CI job.
- **Each publishes its own VSA**, independently signed and logged.
- **Admission requires k-of-n**, with `k = max(3, ceil(n/3))` — a floor expressed
  both absolutely and proportionally, so it cannot silently weaken as membership
  grows (`noteworthy-quorum-parameters`).
- **Threshold / aggregate signing** (FROST, BLS) so the bank's gate still
  verifies a single signature against a single quorum key.

**Disagreement is the signal, not the failure.** If five firms rebuild and four
agree while one dissents, that is either a reproducibility defect in the
toolchain spec or something worse — either way you want to know, loudly, before
promotion. A dissenting VSA is therefore **disqualifying, not outvoted**:
`k-of-n` with *zero dissent*, not simple majority. Dissent triggers
investigation, not arithmetic. No single-checker design can produce this signal
at all, and it is the strongest argument for the model.

This is one of four places the same shape recurs — quorum, layout compilation,
the TUF root, and log witnessing — generalized as
`noteworthy-threshold-everywhere`: **no single key is load-bearing; threshold not
majority; dissent disqualifying.**

*Note for formation:* until three verifiers are active, no artifact can reach
FULL admission. That is the floor working as intended, but it makes verifier
recruitment a launch prerequisite rather than a growth activity.

### 3.7 Admission policy

The gate resolves the evidence bundle for a candidate artifact digest `D`, then
evaluates the policy below. Rules run in two passes: **structural**
(`in-toto-verify` against the compiled layout — right steps, right signers, DAG
intact) and **semantic** (Rego/Witness over the resolved predicate contents).
Promote only if every rule holds.

```
  1. All attestations in the set are DSSE-wrapped; signatures valid; signer
     certs chain to a trusted root (Fulcio); each entry present in the
     transparency log, verified against the witnessed checkpoint set — and no
     two verifiers observed divergent tree heads.  [signature validity, §3.3]
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
     C.scope.cvesInScope ⊆ (CVEs marked fixed in L7 VEX);
     C.governance.trustPath matches the signing namespace.   [contract binding]
 14. Recompile layout L' locally from the signed contract C; digest(L') equals
     the digest of the layout as distributed.       [layout-compile agreement]
 15. Trust-root snapshot age ≤ 7 days; checkpoint set age ≤ 24 hours (limits
     tightenable per bank, never loosenable).            [bundle freshness]

     → any rule fails: DO NOT PROMOTE.
```

**Quorum amendments (§3.6).** When the verifier quorum replaces the single
checker, rules 2 and 5 are superseded by:

```
  2'. ∃ VSA set {V₁..Vₙ} over D, each signed by a distinct verifier in the
      OSERA verifier registry, each current, none revoked, |set| ≥ C.verification.k.
  5'. |{Vᵢ : Vᵢ.osera.rebuild.digestMatch == true}| ≥ k
      AND ∄ Vᵢ with digestMatch == false.            [zero-dissent quorum, §3.6]
```

**Rule 14.** The layout compiler ① is **dual-sited and deterministic**: the
alliance compiles, and the bank recompiles from the same signed contract and
compares digests. Accepting an issuer-signed layout without recompiling would
insert a *trusted compiler* into a design whose premise is verify-don't-trust — a
signed layout is authenticated, not verified. Determinism is therefore a build
requirement, and the compiler version rides in the `policy-object`
(`noteworthy-compiler-siting`).

**Rule 15.** Offline verification forfeits TUF's own freshness guarantee, so
maximum age is stated on two clocks with different change rates. Stale is a
**named-rule reject, not a warning** — a warning defers the decision to whoever
is reading the console, which is not a control. Re-resolution is cheap: the
artifact and its attestations are unchanged, only the trust material refreshes
(`noteworthy-bundle-freshness`).

**Offline decidability.** Every rule above must be decidable from the evidence
bundle alone. A rule that requires a live lookup is either wrong or evidence of a
missing bundle element — the test that keeps hermeticity falsifiable
(`artifact-evidence-bundle` §3).

> **Provenance.** Rules 2', 5', and 13 are recovered verbatim from the source
> design conversations. Rules 1–12 are a **reconstruction** — derived from the
> chain (§3.1–§3.6) and its principles, not recovered from the original
> enumerated ruleset (which did not persist). Rules 14 and 15 are new
> (2026-07-21), as are the checkpoint clause in rule 1 and the trustPath clause
> in rule 13. Review against the original if it resurfaces.

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
- **Solo-mode consumption:** where a mode-2 artifact is consumed by a member
  other than its sponsor, the commissioning judgement was not collective, and
  that member consumes at its own risk. The evidence is identical; the mandate is
  not (`noteworthy-governance-modes`).

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

Both passes consume the same evidence bundle and produce a single promote /
reject verdict — the `Gate` state in the lifecycle, recorded as an immutable
`verdict` over the compiled `policy-object`s (`artifact-data-model` §4). The
verdict pins the bundle digest, trust-root version and trust path it was reached
from, so the decision is self-contained for offline replay.

The build components that make this work:

- **① Contract → in-toto layout compiler.** Compiles the accepted L-1 contract
  into the in-toto layout the verifier enforces. OSERA-specific; exists nowhere
  today. **Dual-sited and deterministic** — run on both sides, with digest
  agreement enforced as rule 14. *(task-layout-compiler)*
- **② Rego semantic policy.** The meaning layer in-toto cannot read — CVEs-fixed
  ⊇ scope, k-of-n digest agreement, coverage ≥ threshold, conformance == FULL,
  freshness limits. Runs at the same gate, immediately after structural
  verification. *(task-rego-policy)*
- **③ Attestation resolver / collector.** Discovers and collects the
  attestations attached to an artifact (OCI referrers / sigstore bundles keyed
  to the digest), **assembles the evidence bundle** bank-side as an OCI image
  index — with a deterministic tar export for air-gapped transfer — and feeds it
  into the gate. Assembly confers no authority: the bundle is a container, never
  a credential, so ③ stays a resolver rather than a trusted packager. Archivista
  is optional convenience, not transport. *(task-attestation-resolver)*
- **④ Bank-acceptance inspection harness.** The **L9** step *inside* the gate:
  runs the bank's own app-team contract/integration tests as an in-toto
  inspection at verification time, folding pass/fail into the promote-or-reject
  decision. The part OSERA cannot do for you. *(task-acceptance-harness)*

---

## 5. The ledger

- **⑤ Exposure + sunset tracker.** Tracks bridge-expiry per application — which
  apps run a time-bound backpatch and when it lapses. The "ledger" half: least
  "supply chain," most day-to-day risk-function tooling. The app inventory it
  reads from is the bank's existing CMDB (an external-mutable `application`
  record); the ledger proper adds only a thin append-only substrate on top — so
  it is cheap to prototype and the piece the risk function feels every day.
  *(task-exposure-tracker)*

This is deliberately downstream of the gate: the gate decides *whether* an
artifact is admissible; the ledger tracks *what the bank is now exposed to* once
it is admitted, and drives the sunset/re-verification cycle.

The ledger backs the `Active`/`Sunset` states of the lifecycle. Its durable
substrate is an **append-only, hash-chained event log** — `ledger-event`s, each
carrying its own `sha256` and chaining to the prior event for its `candidateKey`
(`issued → renewed → expired → retired`, plus `verifier-revoked`);
`ledger-row` and `state-pointer` are **projections replayed** from that chain,
not authoritative state, and `Expiring` is a computed view, never a stored status
(`artifact-data-model` §2–§5). Event sourcing, not last-write, is what lets the
bank answer "which bridge was in force in March, and what did it cover?" — the
audit question a mutable row cannot — and equally "which admitted candidates rest
on a verifier whose key was later revoked?"

**Revocation records an exposure, it does not invalidate.** A revoked verifier
key does not retract past verdicts: admission was valid at the time against a
pinned `trustRootVersion`, and the artifacts are unchanged. Forcing
re-verification would let one key invalidate hundreds of candidates at once — a
self-inflicted outage from a trust event rather than an artifact event. Instead
the console (⑥) raises a review trigger and the risk function judges per
candidate. Tolerable precisely because k ≥ 3 with zero dissent means no single
verifier was ever the sole basis for an admission
(`noteworthy-revocation-semantics`).

### 5.1 Three replay-logs, one pattern

The hash-chained ledger is one instance of a discipline the whole architecture
shares: every durable log is **append-only and replayable to a past state**, and
everything else is a projection over it. There is not one mechanism but three,
each specialized for its side, unified by the pattern:

| Log | Side | Mechanism |
|---|---|---|
| Attestation chain | production | Merkle / Rekor-style transparency (FINOS-operated, quorum-witnessed) |
| Ledger | operational | hash-chained `ledger-event`s |
| Verifier registry | trust | TUF metadata |

**Hash-linking everywhere, consensus nowhere.** Each log is tamper-evident
(break one hash and the whole tail is invalid) without any distributed-consensus
machinery — no p2p canonical-chain agreement, no tokens, no mining. That is
deliberate, on the same reasoning as the quorum (§3.6): a single writer per log,
no double-spend, a trusted neutral venue, and latency a bank SLA cannot absorb.
Even the one multi-party moment — the k-of-n VSA set — reaches agreement by
Schelling point (reproducible builds converge without coordinating), not by a
consensus protocol. The verifier registry keeps the pattern via TUF specifically
because TUF additionally handles the one thing a bare event log cannot: trust
recovery after key compromise (`noteworthy-ledger-substrate`).

**And one authority per fact.** Alongside append-only-plus-projection sits its
companion discipline: every fact has exactly one authoritative representation,
and everything else is derived on demand — CycloneDX over SPDX, the event log
over its rows, accepted contracts over the lineage registry, the OCI bundle over
its tar export (`noteworthy-authoritative-form`).

---

## 6. Component register — build / integrate / not-ours / the-gap

| Bucket | Items |
|---|---|
| **Build — consumer side** (bank) | ① layout compiler (shared, dual-sited) · ② Rego semantic policy · ③ attestation resolver + bundle assembly · ④ acceptance inspection harness · ⑤ exposure/sunset tracker · ⑥ lifecycle console (UI over the mutable projections; `task-lifecycle-ui`) |
| **Build — issuer side** (alliance) | ⑦ contract authoring UI (`task-contract-authoring`) · ⑧ contract issuance & countersignature (`task-contract-issuance`) · ⑨ verifier registry & TUF trust root (`task-verifier-registry`) · ① layout compiler (same deterministic compiler, issuer siting) |
| **Integrate** (proven OSS, wired in) | `in-toto-verify` (structural) · Witness/OPA (Rego eval) · cosign / Sigstore (resolution + signature) · Rekor (FINOS-operated instance) · TUF (trust root) · Archivista (optional convenience) · the bank's existing CMDB (app inventory) |
| **Not ours** (upstream, integrated-against) | Moderne's patching pipeline (L0–L7 production) · the verifier quorum's rebuild infra (L8) · Maven Central / public upstream repos (the anchor) |
| **The gap** (unresolved) | Alliance **governance policy** — who sits in the trust-root threshold, verifier on/offboarding criteria, and the procedure on suspected compromise. Mechanism is built (⑨); these are formation-stage alliance business |

Trust-root governance has moved from *the gap* to *build* in mechanism:
`noteworthy-trust-root-ownership` fixes the root as **k-of-m co-signed** across
the alliance and member institutions (so root re-signing survives any one party
disappearing), with **TUF delegation** for bilateral bank↔vendor namespaces.
Quorum sizing is likewise settled (`noteworthy-quorum-parameters`). What remains
is who those parties are and how they are admitted or removed.

---

## 7. Standards & formats binding

The load-bearing standards, mapped to the level or component that consumes each.
★ = load-bearing for the chain; the rest are integrate-or-map-against.

| Standard | Consumed at | Role |
|---|---|---|
| ★ **purl** | all subjects | Attestation subject identity (`pkg:maven/…`) + digest. Backpatched artifacts carry a distinct suffixed coordinate `@<upstream>-osera.N` (digest stays identity; the purl is the legible label) — `noteworthy-purl-namespace` |
| ★ **OCI Image/Artifact + Referrers API** | ③ resolver, L6/L7, the bundle | Digest-binding; "attached = referrer, not a link". Also the **canonical evidence-bundle format** — blob sharing is what removes the per-bundle duplication of trust material (`noteworthy-bundle-format`) |
| ★ **in-toto** + Attestation Framework | ① compiler, gate | The framework the whole chain compiles to: layout + links + `in-toto-verify`; thresholds = the k-of-n quorum; inspections = ④ acceptance |
| ★ **SLSA** | L3 | Build-provenance predicate + levels; the vocabulary the risk function already knows |
| ★ **VSA** | L8 | The verifier's attestation — result of checking someone else's artifact, now also carrying the observed log checkpoint |
| ★ **DSSE** | all | The signing envelope in-toto / Sigstore attestations ride in |
| ★ **Sigstore** (Cosign/Fulcio/Rekor) | ③ resolver, ⑧ issuance | Keyless signing, cert authority, transparency log. Rekor is a **shared FINOS-operated instance, witnessed by the quorum** — each VSA carries the checkpoint it observed, so split views surface as dissent (`noteworthy-transparency-log`). The log also fixes the delivery manifest in time |
| ★ **Reproducible Builds** | L8, §3.6 | Bit-for-bit rebuild → digest equality; the Schelling point behind the quorum |
| ★ **TUF** | ⑨ registry, gate | Trust root, key rotation, compromise recovery — **built, not a gap**: k-of-m co-signed root, delegated targets for bilateral namespaces, snapshot pinned into the evidence bundle with a 7-day freshness limit. Also the registry's replay-log mechanism (§5.1) |
| ★ **CycloneDX** (authoritative) / **SPDX** (projection) | L6 | CycloneDX is the source of truth — security/backpatch-native, purl-first, its `pedigree` models the is-hardening-of link directly; SPDX license IDs are embedded inside it, and an SPDX view is emitted on demand. VEX is **not** carried inline — it stays OpenVEX at L7. `noteworthy-sbom-format` |
| ★ **OpenVEX** / **CSAF 2.0** | L7 | "fixed, not exploitable, here's the evidence" — must reference L5 to be evidence, not a claim; CSAF is the regulator-facing variant. Authoritative VEX layer (not CycloneDX-VEX) |
| ★ **Rego / OPA** (via Witness) | ② policy | The semantic gate the meaning-checks run in |
| **OSV schema** | L1, ⑤ ledger, ⑦ authoring | Vuln records keyed by `purl` — cleaner than CPE for the exposure graph; the publicly re-derivable source for `cvesInScope` at commissioning |
| **CPE** | *trap* | Why scanners still fire on a backpatched artifact — CPE match ignores the patch. The `-osera.N` purl turns that mismatch into an explicit, machine-readable is-hardening-of relationship (declared in L2/L6/L7) rather than a hidden coordinate collision. A problem to suppress (via VEX), not a tool to use |

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

It holds **without qualification across trust paths and governance modes**: an
artifact arriving over a delegated bilateral namespace, or commissioned by a
single bank in solo mode, faces the identical admission policy. The path and mode
are recorded on the verdict for attribution, never treated as a weaker tier
(`noteworthy-trust-root-ownership`, `noteworthy-governance-modes`).

---

## 9. Open questions / decisions

Cross-cutting; several are now load-bearing elsewhere — the data model
(`artifact-data-model` §6), the candidate lifecycle
(`artifact-product-lifecycle` §8) and the contract lifecycle
(`artifact-contract-lifecycle` §8).

**Decided:**

- **SBOM format** — CycloneDX authoritative, SPDX projection on demand; VEX
  stays OpenVEX at L7. `noteworthy-sbom-format`.
- **Two-sited scope** — issuer-side tooling in scope alongside the bank-side
  gate. `noteworthy-two-sited-scope`.
- **Layout compiler siting** — dual-sited, deterministic, rule 14.
  `noteworthy-compiler-siting`.
- **Trust-root ownership** — k-of-m co-signed root; delegation for bilateral
  paths; no weaker tier. `noteworthy-trust-root-ownership`.
- **Conformance** — binary at the gate; amendment is the route for shortfall.
  `noteworthy-conformance-binary`.
- **Governance modes** — mutualized and solo; verification is a duty, not a
  credit. `noteworthy-governance-modes`.
- **Transparency log** — shared FINOS Rekor, witnessed by the quorum.
  `noteworthy-transparency-log`.
- **Evidence-bundle format** — OCI canonical, deterministic tar projection;
  Archivista optional. `noteworthy-bundle-format`.
- **Bundle freshness** — trust root ≤ 7 days, checkpoints ≤ 24 hours; rule 15.
  `noteworthy-bundle-freshness`.
- **Revocation semantics** — exposure with review trigger; verdicts stand.
  `noteworthy-revocation-semantics`.
- **Quorum parameters** — `k = max(3, ceil(n/3))`, zero dissent, frozen at
  issuance. `noteworthy-quorum-parameters`.

**Open:**

- **Alliance governance policy** — trust-root threshold membership, verifier
  on/offboarding criteria, procedure on suspected compromise. Not an engineering
  question; the largest remaining item.
- **Contract-schema compatibility policy** — the L-1 schema is the interface
  between the two sides; versioning and compatibility rules are unspecified.
- **Ingest class (b) depth** — how far the gate collapses L0–L7 for FINOS-native
  projects (§2) is sketched, not specified. A sub-design rather than a decision.
- **External witnessing** — whether the checkpoint set should also be
  cross-checked against a public log or witness network, for consumers outside
  the membership. Not needed for admission; possibly wanted for the regulator
  story.
- **Corpus provenance** — should the supplemental test suite carry its own
  attestation? Recommend yes; same argument as attesting the recipe set.
- **Schedule breach** — flag or failure? Recommend flag-not-fail.
- **Admission ruleset review** — rules 1–12 are reconstructed; confirm against
  the original enumeration if it resurfaces.
- **Air-gap cadence** — the 24-hour checkpoint clock sets a real operational
  tempo for air-gapped estates; the rollout plan must absorb it.
