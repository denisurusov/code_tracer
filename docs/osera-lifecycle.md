# Lifecycle & Operating Model

**Purpose:** one place that describes, step by step, how a backpatch moves from
an idea to a commissioned commitment, through production and independent
verification, across the bank perimeter, through the admission gate, into
production use, and out again at sunset.

**Scope:** the two state machines and the operating steps that connect them.
Evidence formats, record schemas, and physical stores are covered elsewhere and
referenced rather than repeated.

> **Derived from the accepted artifacts.** This note synthesizes them as of
> 2026-07-26. The artifacts are canonical; where this note disagrees with them,
> they are current:
> [contract lifecycle](../.konspekt/instance/artifacts/artifact-contract-lifecycle.md),
> [product lifecycle](../.konspekt/instance/artifacts/artifact-product-lifecycle.md),
> [evidence bundle](../.konspekt/instance/artifacts/artifact-evidence-bundle.md),
> [architecture](../.konspekt/instance/artifacts/artifact-architecture.md) §3–§5,
> [data model](../.konspekt/instance/artifacts/artifact-data-model.md).
> Diagram: [`resource/p1-lifecycle.svg`](resource/p1-lifecycle.svg).

---

## 1. Two machines, one boundary

- **The contract lifecycle** tracks a **commitment** — Drafted through Fulfilled.
  Actors are the issuer, the maker, and the verifier quorum. It runs entirely
  outside the bank.
- **The candidate lifecycle** tracks an **artifact** — Commissioned through
  Sunset. It starts outside and crosses into the bank.
- They are separate machines because a contract can be withdrawn, breached, or
  lapse without any candidate artifact ever existing.
- They meet at exactly one point: **Accepted emits Commissioned** (§4).

## 2. Three zones

- **Public upstream** — canonical package registry for the artifact's purl type,
  upstream git, OSV/NVD. Nobody in the alliance controls it, which is what makes
  it usable as the anchor. Read twice: at commissioning and again at admission.
- **Outside (alliance + maker)** — commission, build, test, verify. The issuer
  side runs here alongside the maker's and quorum's infrastructure. Evidence is
  produced.
- **Inside (bank)** — resolve, gate, adopt, track, sunset. Evidence is consumed,
  hermetically and offline.
- The perimeter is crossed by a **copy of a self-contained evidence bundle**.
  There is no live call to the alliance at verification time.

## 3. Contract lifecycle — steps

**States**

- **Drafted** — issuer. Governance, scope, baseline, test corpus, schedule and
  `osera.line` are authored. Mutable, unsigned.
- **Proposed** — issuer. Issued to the maker for acceptance; terms held pending
  signature. Contract digest minted.
- **Accepted** — maker. Countersignature verifies. Scope, baseline and
  acceptance criteria become immutable. This is the freeze.
- **Delivered** — maker. L0–L7 minted and handed off under a frozen delivery
  manifest.
- **Fulfilled** — quorum. k-of-n VSAs assert `conformance == FULL`.

**Terminals**

- **Withdrawn** — issuer retracts before acceptance. Reason recorded.
- **Breached** — delivered, non-conforming, not remediable under this version.
  Recorded as VSA conformance `BREACH`.
- **Lapsed** — `schedule.deliverBy` passed with nothing delivered. Derived from
  the schedule rather than written by anyone.

**Transitions and guards**

- **Drafted → Proposed** — issuer signs; contract digest minted.
- **Proposed → Drafted** — maker rejects or negotiates; returns to mutable draft.
- **Proposed → Withdrawn** — issuer retracts. Terminal.
- **Proposed → Accepted** — maker countersignature verifies. Freeze.
- **Accepted → Delivered** — L0–L7 present and resolvable; delivery manifest
  assembled by the maker, complete against `contract.requiredAttestations`, and
  its digest logged.
- **Delivered → Fulfilled** — k-of-n VSAs, zero dissent, conformance `FULL`.
- **Delivered → Breached** — conformance `BREACH`. Terminal.
- **Accepted → Lapsed** — `now > schedule.deliverBy`, nothing delivered.
  Terminal.
- **Accepted → Accepted′** — amendment: new version, fresh countersignature,
  supersession pointer.

**What Accepted freezes**

- **Governance** — `mode` (mutualized or solo), `sponsor`, `mandateRef` digest,
  `trustPath`. Makes "was this properly commissioned?" checkable.
- **Baseline** — the exact upstream artifact digest to start from.
- **Scope** — `cvesInScope` and `explicitlyOutOfScope`.
- **Test corpus** — named by digest, so it cannot be substituted after the fact.
- **Quorum size** — `verification.k`, computed as `max(3, ceil(n/3))` at
  issuance, so the artifact is judged against the quorum in force when it was
  commissioned.
- **Line** — `contract.osera.line`, declared rather than derived, fixing which
  bridge lineage this candidate continues.
- **Schedule** — delivery window, embargo, bridge expiry.

**Amendment**

- An in-flight scope change is a **version bump with a supersession pointer**.
  The chain records which contract version it fulfilled.
- Amendment is the only route by which a shortfall reaches admission. The
  unfixable CVE moves to `explicitlyOutOfScope` with a stated reason, the maker
  re-countersigns, and delivery is `FULL` against a contract that tells the
  truth.
- Amendment differs from renewal: an amendment is a new version of the same
  commitment; a renewal is a new lineage member under the same `osera.line`.
  The two use different edges and must stay distinct.

**The delivery manifest**

- Assembled by the maker at the Delivered transition.
- Holds L-1 plus L0–L7.
- Checked mechanically for completeness against `contract.requiredAttestations`.
- Frozen by a **transparency-log entry** rather than a signature. That
  establishes "this exact set existed at time T" and asserts nothing about
  correctness, so an inclusion proof cannot be misread as an endorsement.
- Its job is to stop the maker adjusting its submission after seeing how
  verification went — the loophole L-1 closes for the test corpus, one layer out.

## 4. The hinge

- `Accepted` emits `Commissioned` into the candidate lifecycle.
- Everything before Accepted is issuer-internal and mutable.
- Everything from Accepted onward is immutable and signed.
- The candidate lifecycle's entry condition is therefore a *state of the
  contract machine*, which is why the two artifacts are separate but coupled.

## 5. Candidate lifecycle — steps

**Outside the bank**

- **Commissioned** — L-1 issued and accepted; scope, baseline, corpus and
  schedule frozen. Backed by the L-1 contract.
- **Built** — hardened artifact produced; maker claims minted. Backed by L0–L7.
- **Verified** — independently rebuilt by the quorum with zero dissent. Backed
  by the k-of-n L8 VSA set.

**Inside the bank**

- **Resolved** — evidence bundle discovered, collected and sealed inside the
  bank, keyed to the artifact digest. Component ③.
- **Gate** — under evaluation: structural, then semantic, then bank acceptance.
  Components ①②④.
- **Adopted** — admitted and promoted to the golden repo. Backed by L9.
- **Active** — deployed and in production, inside the bridge window. Component ⑤.
- **Sunset** — the time-bound backpatch has lapsed. Component ⑤.

**Terminals**

- **Rejected** — an admission rule failed, dissent was present, or L9 failed.
  The failing rule is recorded. A corrected re-submission is a new candidate.
- **Retired** — the application has moved to an upstream-fixed release. The
  ledger closes the exposure.

**Transitions and guards**

- **Commissioned → Built** — maker builds the hardened artifact; L0–L7 minted.
- **Built → Verified** — k-of-n verifiers rebuild and publish L8 VSAs; zero
  dissent.
- **Verified → Resolved** — crosses the bank perimeter; resolver ③ discovers the
  attestation set, assembles the ingest envelope over the evidence core, and
  seals it.
- **Resolved → Gate** — gate invoked: layout compiled and recompiled locally ①,
  Rego policy loaded ②, acceptance harness staged ④.
- **Gate → Adopted** — structural, semantic and L9 acceptance all pass. Admit.
- **Gate → Rejected** — any admission rule fails. Terminal.
- **Adopted → Active** — promoted to the golden repo and deployed; ledger ⑤
  begins tracking.
- **Active → Sunset** — the bridge window lapses.
- **Sunset → Retired** — the application adopted an upstream-fixed release.
  Terminal.
- **Sunset → Commissioned′** — renewal; a new superseding candidate enters the
  loop.

**Class (a) / (b) divergence**

- The two ingest classes differ **only** in what Built and Verified mean.
- **(a) backpatched OSS** — Built and Verified concern a baseline and its
  transformation: L0–L7 as written, vuln-proof against the prior artifact.
- **(b) FINOS-native** — no baseline; Built and Verified collapse to project
  health, origin, and provenance of new code.
- From Resolved inward the machine is class-agnostic. This invariant is what
  lets the gate be one parameterized tool, and the data model depends on it:
  one record shape inside the boundary, with class tagging only the
  production-side evidence.

## 6. The perimeter crossing — steps

Three containers carry different authority on different clocks.

- **Delivery manifest** — assembled by the maker at Delivered. Holds L-1 + L0–L7.
  Identity is its logged digest. No clock. Does not cross the perimeter.
- **Evidence core** — assembled by the issuer once, at Fulfilled. Holds the
  delivery manifest, L-1, L0–L8, the compiled layout and the Rego policy bundle.
  One digest, shared by every bank. No clock — evidence does not expire. This is
  what crosses.
- **Ingest envelope** — assembled by resolver ③ once per consuming bank, at the
  Verified → Resolved transition. Holds the core digest, the TUF trust-root
  snapshot, the checkpoint set with consistency proofs, the Fulcio root, and the
  local artifact locator. Bank-local digest. Sealed at the crossing.

Operating consequences:

- The core is issuer-assembled so that every bank cites the **same** evidence
  identifier to each other and to a supervisor.
- The envelope is bank-assembled because freshness is measured at the gate; a
  snapshot sealed once for the alliance would be stale for whoever ingests later.
- Sealing carries no signature and confers no authority. Every element inside is
  independently signed and independently verified.
- Anything the gate needs that is not in the bundle is a live dependency and a
  hermeticity violation. That is the design test.
- Two banks admitting the same candidate produce different envelope digests and
  the same core digest.
- A core sealed a year ago re-admits under a fresh envelope. Re-admission is
  therefore cheap.

## 7. The gate — steps

- **Resolve** — ③ discovers attestations for digest `D` through the central
  attestation index, collects them, and seals the envelope. Resolution is the
  last online step.
- **Compile and compare** — ① recompiles the layout locally from the signed
  contract and compares digests against the layout as distributed (rule 14). A
  signed layout is authenticated; recompiling is what makes it verified.
- **Structural pass** — `in-toto-verify` against the compiled layout: right
  steps, right signers, thresholds met, DAG intact, not expired.
- **Semantic pass** — Rego via Witness over the resolved predicate contents:
  CVEs-fixed ⊇ scope, digest agreement across the quorum, coverage ≥ threshold,
  `conformance == FULL`, freshness limits.
- **Acceptance inspection** — ④ runs the bank's own app-team contract and
  integration tests as an in-toto inspection *at verification time*, folding
  pass/fail into the same verdict. The layout may require that an inspection
  named `bank-acceptance` exists; it never supplies the command.
- **Verdict** — a single immutable record: admit or reject, pinning the core
  digest, the envelope digest, the trust-root version and the trust path, so the
  decision is self-contained for offline replay.

Rules that govern the decision:

- Fifteen rules, all of which must hold; any failure means do not promote.
- Rules 2 and 5 are superseded by their quorum forms 2′ and 5′: a VSA set of at
  least `C.verification.k` distinct registered verifiers, with zero
  `digestMatch == false`.
- Conformance is binary. `FULL` promotes; `PARTIAL` and `BREACH` never do.
- Staleness is a named-rule reject rather than a warning. A warning would defer
  the decision to whoever reads the console, which is not a control.
- Every rule must be decidable from bundle contents alone. A rule needing a live
  lookup is either wrong or evidence of a missing bundle element.
- Full enumeration: [architecture §3.7](../.konspekt/instance/artifacts/artifact-architecture.md).

## 8. Adoption and tracking — steps

- **Promote** — the admitted artifact enters the golden internal repo. App teams
  consume from there only; the public registry never shadows the hardened
  artifact.
- **Deploy** — the app team takes the coordinate; the candidate becomes Active.
- **Open the exposure** — ⑤ writes an `issued` ledger event and begins tracking
  `(appId, candidateKey)`.
- **Track** — the ledger answers which applications run a time-bound backpatch
  and when each lapses.
- **Surface** — ⑥, the lifecycle console, presents the mutable projections.
  State changes exit through the gate or the ledger as signed evidence; the
  console does not mutate state directly.

Ledger mechanics:

- Durable facts are append-only, hash-chained `ledger-event`s, each carrying its
  own `sha256` and chaining to the prior event for its `candidateKey`.
- Event kinds: `issued`, `renewed`, `expired`, `retired`, `verifier-revoked`.
- `ledger-row` and `state-pointer` are projections replayed from that chain.
- `Expiring` is computed at read time from the row rather than stored, so no
  status needs its own writer and clock.
- Event sourcing is what answers "which bridge was in force in March, and what
  did it cover?" — and equally "which admitted candidates rest on a verifier
  whose key was later revoked?"

Revocation:

- A revoked verifier key does not retract past verdicts. Admission was valid at
  the time against a pinned `trustRootVersion`, and the artifacts are unchanged.
- ⑥ raises a review trigger; the risk function judges per candidate.
- Tolerable because k ≥ 3 with zero dissent means no single verifier was ever
  the sole basis for an admission.

## 9. Sunset — steps

- A backpatch is a **bridge**: a deliberately temporary hardening that closes the
  gap between "vulnerable now" and "upstream fix adoptable later."
- It ships with an expiry because a privately-maintained fork is itself a
  standing liability.
- The ledger surfaces the approaching lapse as a computed view over the row.
- At lapse, exactly one of two things happens.

**Retire**

- The application has moved to an upstream-fixed release.
- ⑤ writes a `retired` event and closes the exposure.
- Terminal; clean exit.

**Renew**

- A replacement bridge is commissioned, and it runs the whole lifecycle again
  from Drafted.
- The renewal is a **new candidate carrying a `supersedes` edge** to its
  predecessor. Each renewal is issued under its own L-1 contract, with its own
  `baseline.digest` and very likely its own CVE set, so a mutated status field
  on one record could not represent it without overwriting the contract the
  prior bridge was verified against.
- `commons-x:3.2.1-osera.1` and `…-osera.2` are two immutable records, each with
  its own frozen evidence chain.
- `candidateKey` — the version-less upstream purl plus `contract.osera.line` —
  stays constant across the supersedes chain, so the pointer and the ledger
  follow the lineage through renewals.
- A continuing renewal's contract carries the **same** `osera.line`. The
  `supersedes` edge and the shared line must agree; this is a checkable
  admission invariant.
- A renewal that jumps lines (3.x → 4.x) is a new lineage: the old line Retires
  and a new one is Commissioned.

## 10. Clocks

- **`schedule.deliverBy`** — contract-side. Expiry with nothing delivered gives
  Lapsed.
- **`schedule.bridgeExpiry`** — candidate-side. Drives Active → Sunset, and is
  compiled into the in-toto layout's `expires` field, so verification fails once
  the layout expires.
- **Trust-root snapshot ≤ 7 days** — envelope-side, checked at the gate as rule
  15. Tightenable per bank, never loosenable.
- **Checkpoint set ≤ 24 hours** — envelope-side, same rule. An air-gapped estate
  must move the envelope across the gap within a day of checkpoint issuance; the
  core can cross ahead on any schedule.
- **The evidence core has no clock.** Evidence does not go stale; the material
  used to judge signatures and log inclusion does. That asymmetry is why the
  core and the envelope are separate containers.

## 11. Who acts at each step

- **Issuer (alliance)** — authors and issues the contract (⑦⑧), curates the
  verifier registry and TUF trust root (⑨), compiles the layout (①, issuer
  siting), assembles the evidence core.
- **Maker** — countersigns the contract, produces the hardened artifact, mints
  L0–L7, assembles and logs the delivery manifest.
- **Verifier quorum** — rebuilds independently, re-runs L4/L5, publishes one L8
  VSA each carrying the log checkpoint it observed.
- **Bank** — resolves and seals the envelope (③), recompiles the layout (①),
  evaluates structural and semantic passes (①②), runs its own acceptance
  inspection (④), records the verdict, promotes, tracks exposure (⑤), and
  operates the console (⑥).
- **Public upstream** — controlled by nobody in the alliance, which is what
  makes the anchor an anchor.

---

## Open items

1. **Sunset signaling window.** How far ahead of lapse the ledger surfaces an
   Active candidate as approaching Sunset. The computed-view decision is
   settled; the window value is not.
2. **Ingest class (b) depth.** How far Built and Verified collapse for
   FINOS-native projects is sketched rather than specified. Affects §5.
3. **Schedule breach.** Whether late delivery is a conformance failure or a
   flag. Current recommendation is flag-not-fail, unratified. Affects the
   Delivered → Fulfilled guard.
4. **Contract-schema compatibility policy.** Signed contracts are frozen
   forever, so the gate must evaluate every schema version ever issued. Bears on
   whether this note's state set is stable across schema generations.
5. **Envelope retention.** Whether a bank keeps every envelope it ever sealed or
   only those named by a standing verdict. Bears on §6 and §10.
6. **Whether this note should carry the diagram inline.** It currently links
   `p1-lifecycle.svg`; the alternative is embedding it under a figure caption
   like the working paper does.

Happy to work through these one at a time.
