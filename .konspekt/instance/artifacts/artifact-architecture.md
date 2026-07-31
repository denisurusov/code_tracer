```yaml
id: artifact-architecture
type: artifact
title: code_tracer — Architecture & Design
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  inputs:
    - docs/historical/osera-attestation-chain.md   # artifact #1 (now inlined here)
    - docs/historical/osera-bank-schematic.svg     # artifact #2
    - docs/historical/osera-standards-register.md  # artifact #3
createdAt: 2026-07-17T00:00:00Z
updatedAt: 2026-07-30T00:00:00Z
```

# code_tracer — Architecture & Design

**Status:** accepted (`review: accepted`). **Integrating overview.** The design is
factored into four axes; this document ties them together and is the home of the
evidence-chain axis:

- **Evidence chain** — the L-1…L9 attestation format the gate consumes. §3 below.
- **Contract lifecycle** — the issuer-side commitment machine (Drafted…Fulfilled)
  that produces the root referent. `artifact-contract-lifecycle`.
- **Package and product lifecycles** — the digest-keyed package machine and
  the lineage-keyed product machine.
  `artifact-product-lifecycle`.
- **Data model** — the records backing each state. `artifact-data-model`.

§4–§8 are the cross-cutting concerns that bind them: the gate, the ledger, the
component register, the standards binding, and the regulatory narrative. The
interface between the two sides is `artifact-evidence-bundle`; the physical
stores are `artifact-deployment-topology`; who runs each activity, on what clock,
is `artifact-operating-model`.

> Historical note: this document supersedes and inlines three earlier
> per-conversation artifacts (attestation chain, solution schematic, standards
> register) that did not persist. The attestation chain is reproduced here in
> full in §3 and is the single source of truth for the chain. Those three now
> live under `docs/historical/`, each carrying a supersession note.

> **Amendment 2026-07-21 (issuer side).** §1, §3, §4, §6, §7 and §9 amended per
> `noteworthy-two-sited-scope`, `noteworthy-compiler-siting`,
> `noteworthy-trust-root-ownership`, `noteworthy-threshold-everywhere`,
> `noteworthy-conformance-binary`, `noteworthy-governance-modes`,
> `noteworthy-transparency-log`, `noteworthy-bundle-format`,
> `noteworthy-authoritative-form`, `noteworthy-bundle-freshness`,
> `noteworthy-revocation-semantics` and `noteworthy-quorum-parameters`.

> **Amendment 2026-07-21 (ecosystem & roles).** Actors are named by **role** —
> provider, verifier, issuer, bank — never by company; a provider is whoever signs
> L0–L7 against a contract they countersigned. The anchor is **the canonical
> public registry for the artifact's purl type**, not Maven specifically. Per
> `noteworthy-ecosystem-generalization` and `noteworthy-attestation-index`.

> **Amendment 2026-07-27 (referent binding).** §3.4 and §3.7 amended per
> `noteworthy-referent-binding`: the two binding modes named explicitly, and
> CVE-record integrity added as rule 16.

> **Amendment 2026-07-27 (framing).** §1 now opens on the inbound/outbound
> governance asymmetry per `noteworthy-inbound-asymmetry`, so the document states
> why the gap exists before describing what fills it.

> **Amendment 2026-07-27 (recordDigest).** Rule 16 digests the pinned snapshot
> **as carried in the bundle**, not a canonical form derived from it. Per
> `noteworthy-record-digest`, which also splits snapshot *faithfulness* out as a
> separate, issuer-side question (§9).

> **Amendment 2026-07-30 (who verifies).** §3.2, §3.3, §3.6, §3.7, §3.8, §4, §5
> and §8 amended per `noteworthy-signer-verification` and
> `noteworthy-adoption-rebuild`. The contract's signatories are its verifiers;
> `k` is the signer set rather than a computed threshold and
> `k = max(3, ceil(n/3))` retires; every adopting bank rebuilds inside its own
> zone in both governance modes, emitting an L8 it signs itself; and "never
> leaves the bank" is corrected to *unpublished, disclosable on demand* for both
> that record and L9.

> **Amendment 2026-07-30 (operating layer).** `artifact-operating-model` is
> accepted, and §9's index/log reconciliation item moves to *decided* — it now has
> a named owner, a daily cadence and a published lag figure. The operating model
> sits above the four axes rather than beside them: this document builds the
> mechanism and defers policy, and that boundary deliberately does not hold one
> layer up, where values have to be named to be runnable.

---

## 1. Context & scope

### Why the gap exists

A bank that contributes to open source already runs a **governed egress path**.
Contributions to FINOS leave through one inspected, policy-enforced route —
machinery that exists, that the risk function understands, and that nobody
disputes.

**Nothing equivalent governs the other direction.** Hardened releases and
FINOS-native projects arrive carrying claims about themselves, and no mechanism
checks those claims before the code is inside. The gap is not that inbound is
unmanaged in every sense — there are scanners, repository managers, approval
workflows — but that none of them verifies the *provenance of the assertion*. A
scanner reads the artifact; it does not ask whether the party who produced it did
what they committed to do.

That gap is what this design closes. **The answer is not symmetric with the
outbound control**, and reading it as "a GitProxy for inbound" misses the design:
egress inspects content leaving a boundary the bank controls end to end, whereas
on ingress the bank controls neither the production of the artifact nor the
production of the evidence about it. That is why the answer is a commissioned
specification (§3.2) and an independent quorum (§3.6) rather than an inspection
proxy — and why it needs an afterlife, since egress is a moment while ingress
creates a standing exposure (§5). See `noteworthy-inbound-asymmetry`.

### What this is

code_tracer is the machinery at the **two ends of the OSERA supply chain** — the
alliance-side tooling that *commissions* hardened open source, and the bank-side
gate and ledger that *admits and tracks* it. It is not the supply chain itself.
OSERA (Open Source Enterprise Resiliency Alliance, a FINOS coalition) mutualizes
the backpatching of old, widely-shared open source across regulated banks: a
patching vendor — the **provider** — hardens vulnerable upstream artifacts, and the
alliance distributes the result with machine-readable evidence.

**What it is:**
- **Issuer side** — authoring and issuing the L-1 backpatch contract, and
  curating the verifier registry and trust root the gate verifies against
  (`goal-issuer-side`, components ⑦⑧⑨).
- **Consumer side** — the gate (does this artifact conform to a scope the provider
  committed to before starting, independently verified?) and the ledger (which
  of our applications run a time-bound backpatch, and when does it lapse?)
  (`goal-the-gate`, components ①–⑥).

**What it is not:** the patching pipeline, the attestation *producers* (L0–L7),
or the signatory verifiers' rebuild infrastructure. Those are upstream and
integrated-against, not built. Alliance *governance policy* — who sits in the
trust-root threshold, verifier on/offboarding, compromise procedure — is likewise
out of scope: we build the mechanism, the alliance settles the policy. That
boundary is deliberate and it is specific to this layer;
`artifact-operating-model` §2 records why it does not survive one layer up.

### Three zones

The system spans three zones, not two, and the third is the one that makes the
evidence trustworthy rather than circular:

- **Public upstream** — the canonical package registry for each purl type, the
  upstream git repositories, OSV/NVD. **Nobody in the alliance controls it**,
  which is exactly why it is the anchor (§3.4). Integrated-against, never
  annexed.
- **Outside (alliance + provider)** — commission, build, test, verify. The issuer
  side runs here, alongside the provider's and the signatories' infrastructure;
  the evidence-**production** half.
- **Inside (bank)** — resolve, rebuild, verify, accept, re-test, deploy, adopt,
  track. The bank's on-prem gate and ledger; the evidence-**consumption** half.

Everything code_tracer does **inside the bank at the gate is hermetic and
offline** — no callout to the provider, no live trust query — so that a regulator
can re-run the entire admission decision from stored inputs and reach the same
verdict. The issuer side existing does not relax this: because the bank verifies
offline, the perimeter crossing is a **copy of a self-contained evidence bundle**,
not a protocol (`artifact-evidence-bundle`). Resolution is online, and the bank's
own rebuild (§3.6) runs there with it; verification is offline, and the perimeter
is that line.

### Two commissioning modes

The alliance commissions work in either of two modes, which map onto the two
trust paths rather than onto two sets of rules:

- **Team** — members vote a project in; spend, benefit and responsibility
  are shared, and every signatory verifies. At least two signatories are required
  for a project to be commissioned at all. Trust path `osera-root`.
- **Solo** — a single bank commissions and funds alone, is solely accountable
  for that judgement, and is the only outside verifier. Trust path
  `delegated:<bank>`.

Mode changes **who is accountable for deciding what to commission** and how many
independent reproductions exist before the perimeter, never what the gate
requires or what the adopting bank does. Inside-zone activity is identical in
both modes, because every adopting bank rebuilds for itself (§3.6,
`noteworthy-adoption-rebuild`).

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
artifact must arrive with to be admissible. code_tracer does not produce L0–L8
outside the bank; it commissions the work they attest to, then resolves,
rebuilds, verifies, and reads their meaning. Reproduced here in full.

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
5. **Attestations are resolvable from the artifact digest** — via OCI referrers,
   sigstore bundles, or the central attestation index (§4 ③). Not links in
   release notes. Not rows in a portal.

**Chain integrity is load-bearing.** Principles 1–4 are one property seen from
four sides: every admission claim ultimately reduces to *these digests link,
unbroken, back to an independently observable anchor*. Hash-linking is not a
storage convenience here — break one link and everything above it is worthless,
no matter how well-signed. The same discipline recurs in the ledger and the
verifier registry (§5.1).

### 3.2 The L-1 backpatch contract — the root referent

Before any work starts, the alliance issues a **backpatch contract** and the
provider **signs acceptance** of it. This makes the deliverable a *commissioned
spec*, not a post-hoc submission — it closes the loophole where a provider picks an
easy test corpus after the fact. The contract is **L-1**: the root the entire
chain above it is verified *against*. It freezes:

- **Governance** — `mode`, `sponsor`, `mandateRef`, `trustPath` and the
  **signatory set**, so "was this properly commissioned?" and "who owes
  verification?" are both checkable rather than assumed.
- **Baseline** — `contract.baseline.digest`, the exact upstream artifact to
  start from.
- **Scope** — `contract.scope.cvesInScope` (what must be fixed) and
  `contract.scope.explicitlyOutOfScope` (what must not be silently touched).
- **Test corpus** — `contract.acceptanceCriteria.testCorpus`, named by digest so
  it cannot be substituted.
- **Quorum** — `verification.k` is **the signatory set itself**, frozen at
  acceptance. Every signatory verifies and all must agree; a team-mode project
  requires at least two signatories, and a solo project has exactly one
  (`noteworthy-signer-verification`).
- **Rebuild inputs** — source locator and digest, transformation digest, and
  toolchain locator and digest, so that any party bound to verify — or any bank
  adopting later — can reproduce the build from pinned references
  (`noteworthy-adoption-rebuild`).
- **Line** — `contract.osera.line`, declared not derived, fixing which bridge
  lineage this package continues (`noteworthy-candidate-key`).
- **Schedule** — delivery window and bridge expiry.

The contract is machine-readable and content-addressed. It **compiles directly
to an in-toto layout** (§4), which is what makes admission mechanical rather than
a human reading a PDF. Its own issuance state machine — Drafted, Proposed,
Accepted, Delivered, Fulfilled, and three terminals — is
`artifact-contract-lifecycle`.

### 3.3 The chain, L0–L9

Signers are named by **role**. In the OSERA instance the provider is a patching
vendor and the verifiers are the institutions that signed the contract, but
nothing in the chain depends on which organisations fill those roles.

| #  | Attestation | Signer | Asserts | Subject |
|----|-------------|--------|---------|---------|
| L0 | **Baseline** | Provider | This is the upstream artifact and source commit we started from | baseline_digest |
| L1 | **Vulnerability Assessment** | Provider | These CVEs affect these components in the baseline SBOM | baseline_digest |
| L2 | **Transformation** | Provider | This content-addressed recipe set / source patch was applied | baseline → hardened |
| L3 | **Build Provenance** (SLSA v1) | Provider | Hardened artifact was built from L0 source + L2 patch on a pinned toolchain | hardened_digest |
| L4 | **Test Results** | Provider | Upstream suite results vs baseline; API/ABI compat; patched-path coverage | hardened_digest |
| L5 | **Vulnerability Proof** | Provider | Per CVE: PoC fails on baseline_digest, passes on hardened_digest | both |
| L6 | **SBOM (out)** + diff | Provider | Composition of the hardened artifact, and delta vs the L0 SBOM | hardened_digest |
| L7 | **VEX** (OpenVEX/CSAF) | Provider | Per CVE: `fixed`, justified by reference to L5 | hardened_digest |
| L8 | **VSA** | **Each contract signatory**, and **the adopting bank** | Independently rebuilt → digest match; re-ran L4/L5 → result match; policy passed; conforms to contract; **the log checkpoint this verifier observed** | hardened_digest |
| L9 | **Acceptance** | **Bank** | Internal contract/integration tests passed; promoted to golden repo | hardened_digest |

L0–L7 are the **provider's claims**. **L8 is the only attestation that converts
claims into evidence** — an independent party re-derived the result. L9 is the
bank's own control.

**L8 is signed twice over, by different parties at different times.** Outside the
perimeter, every contract signatory publishes one; inside, the adopting bank
publishes its own after rebuilding for itself (§3.6). Same predicate, same
assertion, different signer — which is why this is L8 rather than a new level.

**Disclosure.** The bank's own L8 and its L9 are **unpublished by default and
disclosable on demand**. "Never leaves the bank" overstates it: a supervisor may
require confirmation that the institution rebuilt and validated, and being able
to produce both records on request demonstrates the control rather than merely
asserting it (`noteworthy-adoption-rebuild`).

The provider's hand-off of L0–L7 is itself frozen: a **delivery manifest**,
assembled by the provider at the Delivered transition, checked for completeness
against `contract.requiredAttestations`, and fixed in time by a transparency-log
entry rather than a signature — see `artifact-contract-lifecycle` §2 and
`artifact-evidence-bundle` §1.

**L8 carries the observed checkpoint** because the log is FINOS-operated (§7). A
single asserted tree head would have to be trusted; independently observed ones
cannot be split without producing a dissent (`noteworthy-transparency-log`).

### 3.4 The anchor problem

L0 is a *self-claim*. If the provider merely asserts "we started from
`commons-x:1.2.3`," the entire chain is a self-claim with eight extra steps. L0
is only load-bearing if it is **independently re-derivable from public data**:

- `baseline_digest` MUST match the artifact publicly retrievable at the stated
  coordinates from **the canonical registry for the artifact's purl type** —
  Maven Central, npm, PyPI, crates.io, the Go module proxy. The verifier re-pulls
  and compares. No trust required.
- `source_ref` MUST be a git commit SHA in the public upstream repository.

If the anchor is not independently observable, nothing above it is worth
verifying. This is the property most likely to be quietly wrong. The anchor is
checked twice: once at commissioning, when the contract is authored against a
baseline that must publicly resolve (component ⑦), and again at admission
(rule 3).

**Anchor strength is not uniform across ecosystems**, and the difference is
load-bearing rather than cosmetic. Maven Central and crates.io do not permit
deletion; Go additionally publishes an independent checksum log
(`sum.golang.org`) that is stronger than anything this design constructs by hand.
npm and PyPI permit unpublishing, so a baseline can vanish after the fact — those
ecosystems require a **supplementary log witness recorded at commissioning**, so
that "this digest was the published artifact at time T" survives the artifact's
removal. The contract records which anchor class applies
(`noteworthy-ecosystem-generalization` §1).

**Two referent modes.** The anchor property above is the *immutable* mode:
artifacts, source commits, test corpora and lock manifests are
immutable-by-nature and bind by digest with **must-match-live** verification,
where drift means tampering. Advisory records — CVE/OSV now, licence texts and
policy objects later — are mutable-by-nature, and bind by stable id + live
locator + a **frozen snapshot digest** taken at commissioning, verified against
the snapshot with the live pointer advisory. Anchor the immutable, snapshot the
mutable; the referent's nature picks the mode, and neither is ever left bound by
bare id alone (`noteworthy-referent-binding`).

### 3.5 How the contract binds the chain

The L-1 contract is not a document beside the chain — it is the **referent every
link points back to**:

- **L0 Baseline** must equal `contract.baseline.digest`. Mismatch ⇒ wrong
  starting point ⇒ reject.
- **L1 Vuln Assessment** must cover *exactly* `contract.scope.cvesInScope` — no
  more (silent scope creep), no fewer (under-delivery). Out-of-scope CVEs must
  match `explicitlyOutOfScope`.
- **L4 Test Results** must be results *of the corpus named in*
  `contract.acceptanceCriteria.testCorpus`, verified by digest, so the provider
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
reason, the provider re-countersigns, and delivery is `FULL` against a contract that
tells the truth (`noteworthy-conformance-binary`,
`artifact-contract-lifecycle` §4–§5).

**Net effect:** the gate no longer asks "did the provider do good work?" It asks
"did the output conform to a scope the provider committed to *before starting*,
independently verified?" That is a categorically stronger control statement, and
it is the sentence that belongs in the DORA/CRA narrative (§8).

### 3.6 Who verifies — signatories outside, the adopting bank inside

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
and the whole model collapses in one move; the provider/checker split hardens
against *provider* compromise and does nothing about *checker* compromise.

**Reproducible builds are what make agreement cheap.** They are deterministic, so
independent verifiers converge on the same digest **without coordinating** — a
natural Schelling point. Agreement without a consensus protocol.

**Verification follows the money.** The parties that sign a contract are the
parties that verify it. Every signatory rebuilds, re-runs the suite, replays the
vuln proofs and publishes its own L8; all of them must agree. A signatory has
already accepted the cost and carries the consequence of a bad patch running in
its own estate, which is a firmer binding than a membership duty and removes the
assignment problem entirely — there is no sortition to specify, no registrar
discretion to constrain, and no project stalling at Delivered because nobody
picked it up (`noteworthy-signer-verification`).

- **The provider mints** L0–L7 (producer, and tester).
- **Every contract signatory verifies** and publishes an independently signed,
  logged L8. `verification.k` is that signatory set, frozen at acceptance.
- **Team mode requires at least two signatories.** A project no second member
  will co-fund cannot be commissioned as a team project — a filter on the demand
  pipeline as much as on verification.
- **Solo mode has exactly one**, and therefore one outside reproduction.
- **Zero dissent, always.** One disagreement disqualifies regardless of how many
  agree.
- **Threshold / aggregate signing** (FROST, BLS) so the bank's gate still
  verifies a single signature against a single quorum key.

**Why the floor of three retired.** `noteworthy-quorum-parameters` set
`k = max(3, ceil(n/3))`, justifying the absolute floor on the grounds that two
verifiers disagreeing give no way to tell which is wrong without a third. That
rationale was void on arrival: dissent is disqualifying and **nothing
arbitrates**. Two agree and it admits; two disagree and it stops, exactly as five
would. Two arguments for three do survive and were weighed rather than missed —
compromise resistance is weaker at two, and §5's revocation argument leans on no
single verifier having been the sole basis for an admission — and both are
accepted against parties bound by a contract they signed and funded.

**Every adopting bank rebuilds, in both modes.** Inside the perimeter the work is
identical whatever the governance mode: the bank reproduces the build from the
pinned references the core carries and signs its own L8. This is what keeps solo
output consumable without a weaker tier — independence absent outside the
perimeter is restored at adoption, by the party taking the risk. The rebuild runs
during **resolution**, while the bank is still online; what the gate consumes is
the resulting signed record, so the verdict stays hermetic and replayable
(`noteworthy-adoption-rebuild`).

The cost is real and worth stating: verification does not compress for consumers
either, so each adopting institution pays roughly production cost per package.
Sampling would reduce it and would make inside-zone work differ by mode, which is
the distinction this design refuses to draw.

**Disagreement is the signal, not the failure.** If five parties rebuild and four
agree while one dissents, that is either a reproducibility defect in the
toolchain spec or something worse — either way you want to know, loudly, before
promotion. A dissenting VSA is therefore **disqualifying, not outvoted**: zero
dissent, never a majority. Dissent triggers investigation, not arithmetic. No
single-checker design can produce this signal at all, and it is the strongest
argument for the model.

This is one of four places the same shape recurs — verification, layout
compilation, the TUF root, and log witnessing — generalized as
`noteworthy-threshold-everywhere`: **no single key is load-bearing; threshold not
majority; dissent disqualifying.**

**Reproducibility is also a feasibility gate on ecosystem support.** Rule 5′
requires independent rebuilds to converge bit-for-bit. That is workable in
Java/Maven, good in Go and Rust, and materially harder in npm and Python, where
builds routinely embed timestamps, paths and platform detail. Without
reproducibility there is no digest agreement, therefore no verification,
therefore no admission — so an ecosystem is supportable when its builds can be
made reproducible, and not before (`noteworthy-ecosystem-generalization` §2).

*Note for formation:* a team project cannot be commissioned until a second member
will co-fund it. That is the floor working as intended, and it makes co-funding
rather than verifier recruitment the launch prerequisite.

### 3.7 Admission policy

The gate resolves the evidence bundle for a package digest `D`, then
evaluates the policy below. Rules run in two passes: **structural**
(`in-toto-verify` against the compiled layout — right steps, right signers, DAG
intact) and **semantic** (Rego/Witness over the resolved predicate contents).
Promote only if every rule holds.

```
  1. All attestations in the set are DSSE-wrapped; signatures valid; signer
     certs chain to a trusted root (Fulcio); each entry present in the
     transparency log, verified against the witnessed checkpoint set — and no
     two verifiers observed divergent tree heads.  [signature validity, §3.3]
  2. A VSA (L8) exists over D, signed by a registered verifier key, current,
     not revoked.                                     [checker present — see 2']
  3. L0 anchor is independently re-derivable: baseline_digest matches the
     artifact at the stated coordinates in the canonical registry for its purl
     type, and source_ref is a real commit SHA in the public upstream repo. For
     deletion-permitting ecosystems the contract's anchor class additionally
     requires a supplementary log witness.                       [anchor, §3.4]
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
     signed by provider trust-anchor; VSA.osera.contract.conformance == "FULL";
     C.scope.cvesInScope ⊆ (CVEs marked fixed in L7 VEX);
     C.governance.trustPath matches the signing namespace.   [contract binding]
 14. Recompile layout L' locally from the signed contract C; digest(L') equals
     the digest of the layout as distributed.       [layout-compile agreement]
 15. Trust-root snapshot age ≤ 7 days; checkpoint set age ≤ 24 hours (limits
     tightenable per bank, never loosenable).            [bundle freshness]
 16. Every `cvesInScope` entry names a pinned advisory snapshot carried in the
     bundle: sha256 over that snapshot **as carried** equals the entry's
     recordDigest, and the entry's affectedComponent and affectedRange agree
     with that snapshot. The live source URI is never read at the gate.
                                                    [CVE-record integrity, §3.4]

     → any rule fails: DO NOT PROMOTE.
```

**Signatory and self amendments (§3.6).** Rules 2 and 5 are superseded by:

```
  2'. ∃ an L8 from every signatory in C.governance.signatories, each signed by a
      distinct registered key, each current, none revoked — plus an L8 signed by
      this bank over its own rebuild.
  5'. Every L8 in that set asserts digestMatch == true against D,
      AND ∄ any L8 with digestMatch == false.       [zero dissent, §3.6]
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

**Rule 16.** Scope was the last part of the contract still resting on an
author's claim: `affectedRange` is written by whoever drafts the contract, and
nothing checked it against the advisory it cites. Pinning the OSV record at
commissioning makes it checkable — the range asserted in the contract must agree
with the range in the record as it read when the work was commissioned.
Verification runs against the snapshot rather than the live feed, because
advisory records legitimately move: a range widened six months later is
enrichment working correctly, and gating on it would reject a conforming
artifact over something the provider never controlled. The live URI stays advisory
and belongs to the ledger (⑤), where drift since commissioning surfaces as an
exposure finding. Evaluated in the semantic pass, component ②
(`noteworthy-referent-binding`).

**The digest is over bytes, not a canonical form.** The snapshot ships inside the
bundle, so the gate holds the identical bytes the issuer froze and `sha256` over
a file is already unambiguous; reading `affectedRange` out of it needs parsing
rather than canonicalization. Requiring a canonical form would import a
canonicalization dependency into the offline path — one more place two conforming
implementations can diverge — to serve a comparison the gate is forbidden from
performing. This follows DSSE, already the envelope every attestation here rides
in, which signs payload bytes as transmitted for the same reason. **Consequence
for ③:** bundle assembly must preserve the snapshot verbatim, in both the OCI and
tar forms — no reformatting, re-indenting or re-encoding
(`noteworthy-record-digest`).

**Offline decidability.** Every rule above must be decidable from the evidence
bundle alone. A rule that requires a live lookup is either wrong or evidence of a
missing bundle element — the test that keeps hermeticity falsifiable
(`artifact-evidence-bundle` §3). Two things are deliberately outside that test
because they happen *before* the bundle is sealed: the **attestation index**, read
at resolution time, on which no admission rule depends
(`noteworthy-attestation-index`); and the **bank's own rebuild**, whose inputs are
fetched at resolution from pinned references and whose *result* — a signed L8 — is
what the gate reads (`noteworthy-adoption-rebuild`).

> **Provenance.** Rules 2', 5', and 13 are recovered verbatim from the source
> design conversations, with 2' and 5' amended 2026-07-30 for signatory
> verification. Rules 1–12 are a **reconstruction** — derived from the
> chain (§3.1–§3.6) and its principles, not recovered from the original
> enumerated ruleset (which did not persist). Rules 14 and 15 are new
> (2026-07-21) and rule 16 is new (2026-07-27), as are the checkpoint clause in
> rule 1, the trustPath clause in rule 13, and the anchor-class clause in rule 3.
> Review against the original if it resurfaces.

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
  other than its sponsor, the commissioning judgement was not collective and the
  outside evidence carries a single reproduction rather than several. What the
  gate requires is unchanged, and the consuming bank rebuilds for itself as it
  would for any package — so the difference is in how much independent
  corroboration accompanied the artifact across the perimeter, which the trust
  path on the verdict records (`noteworthy-governance-modes`,
  `noteworthy-adoption-rebuild`).

---

## 4. The verification gate

The gate is the product surface that does not exist off-the-shelf. It runs
inside the bank, hermetic and offline, in two passes over a package:

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
  ⊇ scope, digest agreement across every L8, coverage ≥ threshold, conformance ==
  FULL, freshness limits, advisory-record integrity. Runs at the same gate,
  immediately after structural verification. *(task-rego-policy)*
- **③ Attestation resolver / collector, and rebuild orchestration.** Discovers
  the attestations for an artifact digest — via the **central attestation index**,
  which is a lookup and never evidence — collects them, **runs the bank's own
  rebuild** from the pinned references the core carries, and **assembles the
  evidence bundle** bank-side as an OCI image index, with a deterministic tar
  export for air-gapped transfer. Assembly confers no authority: sealing a
  container establishes nothing about its contents, so ③ stays a resolver rather
  than a trusted packager. It must carry pinned advisory snapshots through
  **verbatim**, since rule 16 digests them as bytes. This is the only component
  that touches a network. *(task-attestation-resolver)*
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
it is admitted, and drives the sunset/re-verification cycle. It is also the half
that has no outbound counterpart — egress is a moment, ingress creates a standing
exposure (§1).

The ledger backs the `Active`/`Sunset` states of the lifecycle. Its durable
substrate is an **append-only, hash-chained event log** — `ledger-event`s, each
carrying its own `sha256` and chaining to the prior event for its `lineKey`
(`issued → renewed → expired → retired`, plus `verifier-revoked`);
`ledger-row` and `state-pointer` are **projections replayed** from that chain,
not authoritative state, and `Expiring` is a computed view, never a stored status
(`artifact-data-model` §2–§5). Event sourcing, not last-write, is what lets the
bank answer "which bridge was in force in March, and what did it cover?" — the
audit question a mutable row cannot — and equally "which admitted packages rest
on a verifier whose key was later revoked?"

**Revocation records an exposure, it does not invalidate.** A revoked verifier
key does not retract past verdicts: admission was valid at the time against a
pinned `trustRootVersion`, and the artifacts are unchanged. Forcing
re-verification would let one key invalidate hundreds of packages at once — a
self-inflicted outage from a trust event rather than an artifact event. Instead
the console (⑥) raises a review trigger and the risk function judges per
package.

What makes that tolerable changed on 2026-07-30. The original argument was that
k ≥ 3 with zero dissent meant no single verifier was ever the sole basis for an
admission. With verification bound to signatories that no longer holds uniformly:
a two-signatory project rests on two, and a solo project on one outside. The
argument that survives is stronger and applies in every mode — **the adopting
bank rebuilt the package itself and signed its own L8** (§3.6), so a revoked
signatory key never was the sole basis for *that bank's* admission. Where the
revoked key belongs to a solo sponsor, the bank's own rebuild is the whole of the
remaining independent evidence, and the review trigger should be read
accordingly (`noteworthy-revocation-semantics`, `noteworthy-adoption-rebuild`).

### 5.1 Three replay-logs, one pattern

The hash-chained ledger is one instance of a discipline the whole architecture
shares: every durable log is **append-only and replayable to a past state**, and
everything else is a projection over it. There is not one mechanism but three,
each specialized for its side, unified by the pattern:

| Log | Side | Mechanism |
|---|---|---|
| Attestation chain | production | Merkle / Rekor-style transparency (FINOS-operated, witnessed) |
| Ledger | operational | hash-chained `ledger-event`s |
| Verifier registry | trust | TUF metadata |

**Hash-linking everywhere, consensus nowhere.** Each log is tamper-evident
(break one hash and the whole tail is invalid) without any distributed-consensus
machinery — no p2p canonical-chain agreement, no tokens, no mining. That is
deliberate, on the same reasoning as the verification model (§3.6): a single
writer per log, no double-spend, a trusted neutral venue, and latency a bank SLA
cannot absorb. Even the one multi-party moment — the set of independently signed
L8s — reaches agreement by Schelling point (reproducible builds converge without
coordinating), not by a consensus protocol. The verifier registry keeps the
pattern via TUF specifically because TUF additionally handles the one thing a
bare event log cannot: trust recovery after key compromise
(`noteworthy-ledger-substrate`).

**And one authority per fact.** Alongside append-only-plus-projection sits its
companion discipline: every fact has exactly one authoritative representation,
and everything else is derived on demand — CycloneDX over SPDX, the event log
over its rows, accepted contracts over the lineage registry, Rekor over the
attestation index, the OCI bundle over its tar export
(`noteworthy-authoritative-form`).

---

## 6. Component register — build / integrate / not-ours / the-gap

| Bucket | Items |
|---|---|
| **Build — consumer side** (bank) | ① layout compiler (shared, dual-sited) · ② Rego semantic policy · ③ attestation resolver + rebuild orchestration + bundle assembly · ④ acceptance inspection harness · ⑤ exposure/sunset tracker · ⑥ lifecycle console (UI over the mutable projections; `task-lifecycle-ui`) |
| **Build — issuer side** (alliance) | ⑦ contract authoring UI (`task-contract-authoring`) · ⑧ contract issuance & countersignature (`task-contract-issuance`) · ⑨ verifier registry & TUF trust root (`task-verifier-registry`) · ① layout compiler (same deterministic compiler, issuer siting) |
| **Integrate** (proven OSS, wired in) | `in-toto-verify` (structural) · Witness/OPA (Rego eval) · cosign / Sigstore (resolution + signature) · Rekor (FINOS-operated) · TUF (trust root) · Archivista (attestation index — load-bearing for resolution, optional for transport) · the distributable rebuild harness · the bank's existing CMDB (app inventory) |
| **Not ours** (upstream, integrated-against) | the provider's patching pipeline (L0–L7 production) · the signatories' rebuild infra (outside L8) · public package registries and upstream repos (the anchor) |
| **The gap** (unresolved) | Alliance **governance policy** — who sits in the trust-root threshold, verifier on/offboarding criteria, and the procedure on suspected compromise. Mechanism is built (⑨); these are formation-stage alliance business |

Trust-root governance has moved from *the gap* to *build* in mechanism:
`noteworthy-trust-root-ownership` fixes the root as **k-of-m co-signed** across
the alliance and member institutions (so root re-signing survives any one party
disappearing), with **TUF delegation** for bilateral bank↔provider namespaces.
What remains is who those parties are and how they are admitted or removed.

Who *operates* each of these — which function inside which party, on what clock,
leaving what record — is `artifact-operating-model` §3–§4. This register names
the components; that one names the staffing.

---

## 7. Standards & formats binding

The load-bearing standards, mapped to the level or component that consumes each.
★ = load-bearing for the chain; the rest are integrate-or-map-against.

| Standard | Consumed at | Role |
|---|---|---|
| ★ **purl** | all subjects | Attestation subject identity + digest, and the ecosystem selector: the purl type determines the anchor registry, the anchor class, and the hardened-coordinate encoding. Backpatched artifacts carry a distinct suffixed coordinate that MUST sort **above** its baseline in that ecosystem's own ordering — `-osera.N` for Maven, `+osera.N` for PEP 440, unresolved for semver (`noteworthy-purl-namespace`) |
| ★ **OCI Image/Artifact + Referrers API** | ③ resolver, L6/L7, the bundle | Digest-binding and the **canonical evidence-bundle format** — blob sharing is what removes per-bundle duplication of trust material. Note that ecosystem-native repositories are *not* OCI registries, which is why discovery runs through the attestation index rather than referrers alone (`noteworthy-attestation-index`) |
| ★ **in-toto** + Attestation Framework | ① compiler, gate | The framework the whole chain compiles to: layout + links + `in-toto-verify`; thresholds = the signatory set; inspections = ④ acceptance |
| ★ **SLSA** | L3 | Build-provenance predicate + levels; the vocabulary the risk function already knows |
| ★ **VSA** | L8 | The verifier's attestation — result of checking someone else's artifact, now also carrying the observed log checkpoint. Signed outside by every contract signatory, and inside by the adopting bank over its own rebuild |
| ★ **DSSE** | all | The signing envelope in-toto / Sigstore attestations ride in. Signs **payload bytes as transmitted** rather than a canonical form — the precedent rule 16's digest follows (`noteworthy-record-digest`) |
| ★ **Sigstore** (Cosign/Fulcio/Rekor) | ③ resolver, ⑧ issuance | Keyless signing, cert authority, transparency log. Rekor is a **shared FINOS-operated instance, witnessed by the signatories** — each L8 carries the checkpoint it observed, so split views surface as dissent. The log also fixes the delivery manifest in time |
| ★ **Reproducible Builds** | L8, §3.6 | Bit-for-bit rebuild → digest equality; the Schelling point behind independent agreement, and the feasibility gate on which ecosystems can be supported at all |
| ★ **TUF** | ⑨ registry, gate | Trust root, key rotation, compromise recovery — **built, not a gap**: k-of-m co-signed root, delegated targets for bilateral namespaces, snapshot pinned into the evidence bundle with a 7-day freshness limit. Also the registry's replay-log mechanism (§5.1) |
| ★ **CycloneDX** (authoritative) / **SPDX** (projection) | L6 | CycloneDX is the source of truth — security/backpatch-native, purl-first, its `pedigree` models the is-hardening-of link directly; SPDX license IDs are embedded inside it, and an SPDX view is emitted on demand. VEX is **not** carried inline — it stays OpenVEX at L7 |
| ★ **OpenVEX** / **CSAF 2.0** | L7 | "fixed, not exploitable, here's the evidence" — must reference L5 to be evidence, not a claim; CSAF is the regulator-facing variant |
| ★ **Rego / OPA** (via Witness) | ② policy | The semantic gate the meaning-checks run in |
| **OSV schema** | L1, ⑤ ledger, ⑦ authoring | Vuln records keyed by `purl` — cleaner than CPE for the exposure graph; the publicly re-derivable source for `cvesInScope` at commissioning. Specifies record *structure*, and says nothing about digesting one — hence `noteworthy-record-digest` |
| **Ecosystem checksum logs** | §3.4 anchor | Where an ecosystem already publishes an independent append-only checksum log (`sum.golang.org`), the anchor is stronger than anything this design builds by hand. Where deletion is permitted (npm, PyPI), a supplementary log witness is required instead |
| **CPE** | *trap* | Why scanners still fire on a backpatched artifact — CPE match ignores the patch. The suffixed purl turns that mismatch into an explicit, machine-readable is-hardening-of relationship (declared in L2/L6/L7) rather than a hidden coordinate collision. A problem to suppress (via VEX), not a tool to use |

---

## 8. Regulatory narrative

The frameworks below are **adjacent drivers**, not formats to implement — they
are why the control statement matters:

EU CRA, DORA, NIS2, NIST SSDF, SR 23-4.

The sentence code_tracer lets the bank make to a regulator is the §3.5 net
effect: *not* "we trust the vendor's testing," but "every admitted artifact
provably conforms to a scope the provider committed to before starting,
independently re-verified with zero dissent by every institution that
commissioned it, rebuilt again by us inside our own perimeter, and separately
acceptance-tested here — and we can re-run that decision offline on demand."
That is a DORA/CRA-grade control statement, and it is the reason the
provider/checker split, the L-1 contract, and signatory verification all exist.

**The admission rules are identical across trust paths and governance modes.** An
artifact arriving over a delegated bilateral namespace, or commissioned by a
single bank in solo mode, faces the same policy and the same bank-side rebuild;
the path and mode are recorded on the verdict for attribution and never treated
as a weaker tier (`noteworthy-trust-root-ownership`,
`noteworthy-governance-modes`). What does vary with mode is **how much
independent corroboration accompanied the artifact across the perimeter** —
several outside reproductions in team mode, one in solo — and a bank citing the
sentence above for a solo-path artifact should say so plainly rather than let
"independently re-verified" carry a plurality it did not have
(`noteworthy-adoption-rebuild`).

---

## 9. Open questions / decisions

Cross-cutting; several are now load-bearing elsewhere — the data model
(`artifact-data-model` §6), the package and product lifecycles
(`artifact-product-lifecycle` §8), the contract lifecycle
(`artifact-contract-lifecycle` §8), the physical topology
(`artifact-deployment-topology` §7) and the operating model
(`artifact-operating-model` §7, where unsettled values carry the party that
ratifies each).

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
- **Governance modes** — team and solo; mode sets who is accountable for
  commissioning and how many outside reproductions exist.
  `noteworthy-governance-modes`.
- **Who verifies** — the contract's signatories, all of them, zero dissent,
  minimum two in team mode; `k = max(3, ceil(n/3))` retired.
  `noteworthy-signer-verification`.
- **Adoption rebuild** — every adopting bank rebuilds inside its own zone in both
  modes and signs its own L8; the core carries digest-pinned rebuild references.
  `noteworthy-adoption-rebuild`.
- **Transparency log** — shared FINOS Rekor, witnessed by the signatories.
  `noteworthy-transparency-log`.
- **Evidence-bundle format** — OCI canonical, deterministic tar projection.
  `noteworthy-bundle-format`.
- **Bundle freshness** — trust root ≤ 7 days, checkpoints ≤ 24 hours; rule 15.
  `noteworthy-bundle-freshness`.
- **Revocation semantics** — exposure with review trigger; verdicts stand, now
  resting on the adopting bank's own rebuild rather than on quorum size.
  `noteworthy-revocation-semantics`.
- **Ecosystem generalization** — agnostic by purl type; anchor strength and
  reproducibility gate which ecosystems are supportable.
  `noteworthy-ecosystem-generalization`.
- **Attestation discovery** — a central index (Archivista), deliberately
  untrusted and rebuildable from Rekor; artifact bytes are never duplicated.
  `noteworthy-attestation-index`.
- **`recordDigest`** — `sha256` over the pinned snapshot as carried in the
  bundle; no canonicalization at the gate, following DSSE. Bundle assembly must
  preserve the snapshot verbatim. `noteworthy-record-digest`.
- **Index/log reconciliation** — the index operator replays Rekor **daily** and
  publishes the resulting lag as a figure, so the distance between log and index
  is visible rather than assumed. Activity S4 in `artifact-operating-model` §4;
  the cadence is a service level there rather than an admission rule here,
  because a stale index delays discovery and cannot admit anything wrong.

**Open:**

- **Alliance governance policy** — trust-root threshold membership, verifier
  on/offboarding criteria, procedure on suspected compromise. Not an engineering
  question; the largest remaining item.
- **Blessing-petition threshold.** The petition that moves solo output onto the
  shared distribution path borrowed "the quorum threshold", which no longer names
  a number now that `k` is the signatory set. It needs a threshold of its own.
- **Rebuild-input durability.** The core pins source and toolchain by digest, but
  a pinned locator can stop resolving years later while every digest still
  checks out. Same shape as the anchor-durability problem, and it wants the same
  remedy — local mirroring of anything an institution intends to re-run — which
  is unspecified.
- **Contract-schema compatibility policy** — signed contracts are frozen forever,
  so the gate must evaluate every schema version ever issued. Schemas live in the
  alliance master repo and ship pinned inside the bundle; the versioning and
  compatibility rules are unspecified.
- **Snapshot faithfulness** — whether ⑦ records anything at commissioning that
  lets a third party confirm the pinned advisory matches what OSV actually
  served, and whether the signatories check it. Comparing two independently
  fetched byte sequences *does* need a canonical form, so JCS may return here —
  scoped to the issuer side, where a live fetch is legitimate, never to the gate.
- **Conformance test vectors** — the failure mode for both of the above is two
  conforming implementations disagreeing, which prose cannot catch. The alliance
  master repo carries `schemas/`; it should carry a frozen vector corpus beside
  them.
- **semver hardened-coordinate encoding** — pre-release sorts *below* the
  baseline and build metadata is ignored for precedence, so npm and cargo have no
  valid encoding yet. May constrain which ecosystems are viable.
- **Ingest class (b) depth** — how far the gate collapses L0–L7 for FINOS-native
  projects (§2) is sketched, not specified. A sub-design rather than a decision.
- **External witnessing** — whether the checkpoint set should also be
  cross-checked against a public log or witness network, for consumers outside
  the membership.
- **Corpus provenance** — should the supplemental test suite carry its own
  attestation? Recommend yes; same argument as attesting the recipe set.
- **Schedule breach** — flag or failure? Recommend flag-not-fail.
- **Admission ruleset review** — rules 1–12 are reconstructed; confirm against
  the original enumeration if it resurfaces.
- **Verifier rebuild siting and air-gap cadence** — see
  `artifact-deployment-topology` §7.
