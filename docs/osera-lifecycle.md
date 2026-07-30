# Lifecycle

How a backpatch moves from commissioning to sunset. Three state machines —
project, package, product — and the points where they hand over.

## Terminology

- **Product** — the software library or application being patched or created.
- **Package** — the distribution unit a product ships as, named by `purl`
  (Maven, npm, PyPI). The technical identity the attestation chain binds to; the
  product is the software it names.
- **Project** — work on a product within a particular scope, against one release
  line. One project, one contract. A product carries many projects over time —
  across lines, and across successive renewals within a line.
- **Contract** — the L-1 instrument that scopes a project: baseline, CVE set,
  test corpus, schedule, governance, line. One per project, and the root every
  attestation is verified against.
- **Line** — the release line a project works against, declared in the contract
  as `contract.osera.line`. A product's 3.x bridge and its 4.x bridge are
  separate lines. `lineKey` (version-less purl + line) is the handle that stays
  constant as a line renews.
- **Project backlog** — the ranked set of seconded interest declarations
  awaiting a commissioning ballot.
- **Alliance** — a group of OSERA members. Acts as issuer: commissions the work
  and curates the trust root. Commissions in one of two modes, below.
- **Provider** — whoever works on the product. Signs L0–L7 against a contract it
  countersigned.
- **Signatory** — a member that signs and funds a contract, and therefore
  verifies its delivery.
- **Bank** — a member of the alliance and a consumer of the product. Runs the
  gate and the ledger, and rebuilds every package it adopts.

## Zones

- **Public upstream** — package registry, upstream git, OSV/NVD. Controlled by
  nobody in the alliance. Read at commissioning and again at admission.
- **Outside** — issuer, provider, signatories. Evidence is produced.
- **Inside** — the bank. Evidence is consumed; resolution is online, and the gate
  runs hermetically and offline.
- The perimeter is crossed by a copy of a self-contained evidence bundle.

## Modes

- **Team** — members vote collectively on what, when, who and budget. Every
  signatory verifies; at least two are required. Trust path `osera-root`.
- **Solo** — one member commissions, funds, works and verifies independently, and
  is the only outside verifier. Trust path `delegated:<bank>`.
- In both modes every actor signs its identity cryptographically.
- Mode is frozen into L-1 at Accepted as `governance.mode`, alongside `sponsor`,
  `signatories`, `mandateRef` and `trustPath`.
- Mode sets who is accountable for deciding what to commission, and how many
  independent reproductions exist before the perimeter. It changes nothing the
  gate requires and nothing the adopting bank does.

## Team-mode commissioning — steps

- Members file signed, expiring **interest declarations**: subject, driver,
  priority band, desired timeline, committed contribution.
- Declarations reaching the seconding threshold enter the **project backlog**.
- A **prioritization ballot** — one member, one vote — ranks the project backlog.
- A **commissioning ballot**, weighted by contribution, produces the
  `mandateRef` digest that anchors the L-1 contract.
- A project needs **at least two signatories** to be commissioned, since the
  signatories are its verifiers. Co-funding is a precondition, not a preference.
- Solo efforts are excluded from interest declarations and prioritization
  ballots.

## Project lifecycle — states

- **Drafted** — issuer authors governance, scope, baseline, corpus, schedule and
  `osera.line`. Mutable, unsigned.
- **Proposed** — issuer signs and issues to the provider. Contract digest minted.
- **Accepted** — provider countersigns. Scope, baseline and acceptance criteria
  become immutable.
- **Delivered** — provider mints L0–L7 and hands off under a frozen delivery
  manifest.
- **Fulfilled** — every signatory has published a VSA asserting
  `conformance == FULL`, with zero dissent.
- **Withdrawn** — terminal. Issuer retracts before acceptance.
- **Breached** — terminal. Delivered, non-conforming, not remediable under this
  version.
- **Lapsed** — terminal. `deliverBy` passed with nothing delivered — or with a
  signatory that never verified, which reaches the same terminal state by a
  different failure.

## Project lifecycle — transitions

- **Drafted → Proposed** — issuer signs; contract digest minted.
- **Proposed → Drafted** — provider rejects or negotiates.
- **Proposed → Withdrawn** — issuer retracts.
- **Proposed → Accepted** — provider countersignature verifies. The freeze.
- **Accepted → Delivered** — L0–L7 resolvable; delivery manifest complete
  against `contract.requiredAttestations`, digest logged to the transparency log.
- **Delivered → Fulfilled** — a conforming VSA from every signatory, zero dissent.
- **Delivered → Breached** — conformance `BREACH`.
- **Accepted → Lapsed** — `now > schedule.deliverBy`, nothing delivered.
- **Accepted → Accepted′** — amendment. New version, fresh countersignature,
  supersession pointer. The only route by which a shortfall reaches admission:
  the unfixable CVE moves to `explicitlyOutOfScope`, the provider re-countersigns,
  and delivery is `FULL` against a contract that tells the truth.

## What Accepted freezes

- **Governance** — `mode`, `sponsor`, `signatories`, `mandateRef`, `trustPath`.
- **Baseline** — the exact upstream artifact digest to start from.
- **Scope** — `cvesInScope` and `explicitlyOutOfScope`.
- **Test corpus** — named by digest, so it cannot be substituted.
- **Verifiers** — `verification.k` is the signatory set itself. Every signatory
  verifies, all must agree, and the set is judged as it stood at acceptance.
- **Rebuild inputs** — source, transformation and toolchain, each by digest and
  never by tag, so any signatory and any later adopter can reproduce the build.
- **Line** — `contract.osera.line`, declared rather than derived.
- **Schedule** — delivery window, embargo, bridge expiry.

## The hinge

- `Accepted` freezes the project and starts the package work.
- Before it: issuer-internal and mutable. From it on: immutable and signed.

## Package lifecycle — states

Digest-keyed. Every state is a statement about one `hardened_digest`.

- **Built** — outside. Hardened artifact produced; provider claims minted
  (L0–L7).
- **Verified** — outside. Independently rebuilt by every signatory, zero dissent
  (L8).
- **Resolved** — inside. Evidence bundle collected and sealed, and the bank's own
  rebuild done. Component ③.
- **Gate** — inside. Under evaluation. Components ①②④.
- **Adopted** — inside. Admitted and promoted to the golden repo (L9). The last
  package state.
- **Rejected** — terminal. An admission rule failed; the failing rule is
  recorded. A corrected re-submission is a new package under a new project.

## Package lifecycle — transitions

- **Accepted → Built** — provider builds; L0–L7 minted.
- **Built → Verified** — every signatory rebuilds and publishes an L8 VSA; zero
  dissent.
- **Verified → Resolved** — crosses the perimeter. ③ discovers the attestation
  set, **rebuilds the package from the core's pinned references and signs the
  bank's own L8**, assembles the ingest envelope over the evidence core, and
  seals it.
- **Resolved → Gate** — layout compiled ①, Rego loaded ②, harness staged ④.
- **Gate → Adopted** — structural, semantic and L9 acceptance all pass.
- **Gate → Rejected** — any admission rule fails.
- **Adopted → Active** — the handover. L9 is minted over the digest; the
  exposure opens against the lineage.

The bank's rebuild sits in the crossing rather than in the gate, because it needs
the network and the gate must not. Its output is one signed record, which is what
the gate reads. A rebuild that fails to reproduce the digest is dissent, and the
package never reaches Gate.

## Product lifecycle — states

Lineage-keyed. Lapse and exposure attach to the bridge rather than to a digest.

- **Active** — deployed, within the bridge window. Component ⑤.
- **Sunset** — the bridge has lapsed. Component ⑤.
- **Retired** — terminal. The application moved to an upstream-fixed release.

## Product lifecycle — transitions

- **Adopted → Active** — deployed; ⑤ writes an `issued` event and begins
  tracking.
- **Active → Sunset** — the bridge window lapses.
- **Sunset → Retired** — the application adopted an upstream-fixed release.
- **Sunset → Drafted′** — renewal; a new project is drafted against the same
  line, with a signatory set of its own.

## Class (a) / (b) divergence

- The classes differ only in what Built and Verified mean.
- **(a) backpatched OSS** — a baseline and its transformation; vuln-proof against
  the prior artifact.
- **(b) FINOS-native** — no baseline; project health, origin, provenance.
- From Resolved inward the machine is class-agnostic — and mode-agnostic.

## Distribution

- On reaching Fulfilled, team output is distributed via the central nexus under
  `osera-root`. **Blessing** is carried by definition.
- Solo output reaches the nexus only through a **blessing petition** that meets
  its own threshold.
- Unblessed solo output stays on its sponsor's `delegated:<bank>` path. A member
  other than the sponsor that consumes it does so on its own judgement: the
  commissioning judgement was one member's, and one reproduction preceded the
  crossing rather than several. What the gate requires, and the rebuild the
  consuming bank performs, are unchanged.

## The perimeter crossing

- **Delivery manifest** — provider-assembled at Delivered. L-1 + L0–L7. Frozen
  by a transparency-log entry. Does not cross.
- **Evidence core** — issuer-assembled once at Fulfilled. Delivery manifest, L-1,
  L0–L8, compiled layout, Rego bundle, pinned advisory snapshots, and
  digest-pinned rebuild references. One digest shared by every bank. No clock.
  This is what crosses.
- **Ingest envelope** — bank-assembled by ③ at Verified → Resolved. Core digest,
  the bank's own L8, TUF trust-root snapshot, checkpoint set, Fulcio root, local
  artifact locator. Trust root ≤ 7 days, checkpoints ≤ 24 hours.
- Anything the gate needs that is not in the bundle is a live dependency.
- Advisory snapshots are carried **verbatim**: rule 16 digests them as carried,
  so any reformatting during assembly invalidates them.

## Gate — steps

- **Resolve** — ③ discovers attestations for digest `D` via the attestation
  index, rebuilds the package from the pinned references, signs the bank's own
  L8, and seals the envelope. The last online step.
- **Compile and compare** — ① recompiles the layout locally from the signed
  contract; digests must match the layout as distributed (rule 14).
- **Structural** — `in-toto-verify` against the layout: right steps, right
  signers, thresholds met, DAG intact, not expired.
- **Semantic** — Rego via Witness: CVEs-fixed ⊇ scope, digest agreement across
  every L8, coverage ≥ threshold, `conformance == FULL`, freshness limits, and
  advisory-record integrity (rule 16).
- **Acceptance** — ④ runs the bank's own tests as an in-toto inspection at
  verification time, folded into the same verdict.
- **Verdict** — immutable record: admit or reject, pinning core digest, envelope
  digest, trust-root version and trust path.
- Every admission rule must hold. They are enumerated in `artifact-architecture`
  §3.7, which is the only place they are numbered — a count restated here drifts,
  and this line carried a stale one until 2026-07-30.
- Conformance is binary: `FULL` promotes, `PARTIAL` and `BREACH` never do.
  Staleness is a named-rule reject.

## Tracking

- ⑤ opens the exposure on `(appId, lineKey)` at Adopted → Active.
- Durable facts are append-only hash-chained `ledger-event`s: `issued`,
  `renewed`, `expired`, `retired`, `verifier-revoked`.
- `ledger-row` and `state-pointer` are projections replayed from that chain.
- `Expiring` is computed at read time from the row.
- ⑥ presents the projections; state changes exit through the gate or the ledger
  as signed evidence.
- A revoked verifier key raises a review trigger; past verdicts stand, pinned to
  the `trustRootVersion` current at admission. What makes that tolerable is the
  bank's own rebuild, which holds regardless of how many signatories there were.
- Advisory drift since commissioning surfaces here as an exposure finding, since
  the gate reads only the frozen snapshot.

## Sunset

- A bridge ships with an expiry because a privately-maintained fork is itself a
  standing liability.
- At lapse, exactly one of two things happens.
- **Retire** — the application moved upstream. ⑤ writes `retired` and closes the
  exposure.
- **Renew** — a replacement bridge is commissioned and runs the whole lifecycle
  again from Drafted.

## Renewal

- A renewal is a new project against the same line; its package carries a
  `supersedes` edge to its predecessor.
- Each renewal has its own L-1 contract, its own `baseline.digest`, its own CVE
  set, and its own signatory set.
- `commons-x:3.2.1-osera.1` and `…-osera.2` are two immutable package records,
  each with its own frozen evidence chain.
- `lineKey` — version-less upstream purl plus `contract.osera.line` — stays
  constant across the chain, so the pointer and ledger follow the lineage
  through renewals.
- A continuing renewal carries the same `osera.line`; the `supersedes` edge and
  the line must agree.
- A renewal that jumps lines (3.x → 4.x) is a new lineage: the old line Retires,
  a new one starts with a fresh project.
- An amendment is a new version of the same commitment; a renewal is a new
  member of the same lineage. Different edges.

## Not yet in the machines

Three steps the operating model proposes that the machines above do not carry.
Listed so the machines are not read as complete, and marked as proposals rather
than states:

- **Closure inside the bank** — a project ends at Fulfilled, outside. Nothing
  records whether the commissioned bridge actually closed the flaws and moved the
  applications. Proposed as an activity whose record weights the next
  prioritization ballot.
- **Provider selection** — the mechanism records which provider was selected, in
  the mandate and the contract. Who selects, and against what criteria, is
  alliance policy and unsettled.
- **Emergency commissioning** — a flaw under active exploitation cannot wait for
  a scheduled ballot. A standing authority with later ratification is proposed;
  the cadence and the authority are alliance policy.

Each lands here once it is in an artifact, per the rule that a publication never
carries a decision the record lacks.
