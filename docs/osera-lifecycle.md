# Lifecycle

How a backpatch moves from commissioning to sunset. Two state machines, joined
at one point.

## Zones

- **Public upstream** — package registry, upstream git, OSV/NVD. Controlled by
  nobody in the alliance. Read at commissioning and again at admission.
- **Outside** — issuer, maker, verifier quorum. Evidence is produced.
- **Inside** — the bank. Evidence is consumed, hermetically and offline.
- The perimeter is crossed by a copy of a self-contained evidence bundle.

## Contract lifecycle — states

- **Drafted** — issuer authors governance, scope, baseline, corpus, schedule and
  `osera.line`. Mutable, unsigned.
- **Proposed** — issuer signs and issues to the maker. Contract digest minted.
- **Accepted** — maker countersigns. Scope, baseline and acceptance criteria
  become immutable.
- **Delivered** — maker mints L0–L7 and hands off under a frozen delivery
  manifest.
- **Fulfilled** — quorum publishes k-of-n VSAs asserting `conformance == FULL`.
- **Withdrawn** — terminal. Issuer retracts before acceptance.
- **Breached** — terminal. Delivered, non-conforming, not remediable under this
  version.
- **Lapsed** — terminal. `deliverBy` passed with nothing delivered.

## Contract lifecycle — transitions

- **Drafted → Proposed** — issuer signs; contract digest minted.
- **Proposed → Drafted** — maker rejects or negotiates.
- **Proposed → Withdrawn** — issuer retracts.
- **Proposed → Accepted** — maker countersignature verifies. The freeze.
- **Accepted → Delivered** — L0–L7 resolvable; delivery manifest complete
  against `contract.requiredAttestations`, digest logged to the transparency log.
- **Delivered → Fulfilled** — k-of-n VSAs, zero dissent, conformance `FULL`.
- **Delivered → Breached** — conformance `BREACH`.
- **Accepted → Lapsed** — `now > schedule.deliverBy`, nothing delivered.
- **Accepted → Accepted′** — amendment. New version, fresh countersignature,
  supersession pointer. The only route by which a shortfall reaches admission:
  the unfixable CVE moves to `explicitlyOutOfScope`, the maker re-countersigns,
  and delivery is `FULL` against a contract that tells the truth.

## What Accepted freezes

- **Governance** — `mode`, `sponsor`, `mandateRef`, `trustPath`.
- **Baseline** — the exact upstream artifact digest to start from.
- **Scope** — `cvesInScope` and `explicitlyOutOfScope`.
- **Test corpus** — named by digest, so it cannot be substituted.
- **Quorum size** — `verification.k = max(3, ceil(n/3))` at issuance.
- **Line** — `contract.osera.line`, declared rather than derived.
- **Schedule** — delivery window, embargo, bridge expiry.

## The hinge

- `Accepted` emits `Commissioned` into the candidate lifecycle.
- Before it: issuer-internal and mutable. From it on: immutable and signed.

## Candidate lifecycle — states

- **Commissioned** — outside. L-1 issued and accepted.
- **Built** — outside. Hardened artifact produced; maker claims minted (L0–L7).
- **Verified** — outside. Independently rebuilt by the quorum, zero dissent (L8).
- **Resolved** — inside. Evidence bundle collected and sealed, keyed to the
  digest. Component ③.
- **Gate** — inside. Under evaluation. Components ①②④.
- **Adopted** — inside. Admitted and promoted to the golden repo (L9).
- **Active** — inside. Deployed, within the bridge window. Component ⑤.
- **Sunset** — inside. The bridge has lapsed. Component ⑤.
- **Rejected** — terminal. An admission rule failed; the failing rule is
  recorded. A corrected re-submission is a new candidate.
- **Retired** — terminal. The application moved to an upstream-fixed release.

## Candidate lifecycle — transitions

- **Commissioned → Built** — maker builds; L0–L7 minted.
- **Built → Verified** — k-of-n verifiers rebuild and publish L8 VSAs; zero
  dissent.
- **Verified → Resolved** — crosses the perimeter. ③ discovers the attestation
  set, assembles the ingest envelope over the evidence core, seals it.
- **Resolved → Gate** — layout compiled ①, Rego loaded ②, harness staged ④.
- **Gate → Adopted** — structural, semantic and L9 acceptance all pass.
- **Gate → Rejected** — any admission rule fails.
- **Adopted → Active** — deployed; ⑤ writes an `issued` event and begins
  tracking.
- **Active → Sunset** — the bridge window lapses.
- **Sunset → Retired** — the application adopted an upstream-fixed release.
- **Sunset → Commissioned′** — renewal.

## Class (a) / (b) divergence

- The classes differ only in what Built and Verified mean.
- **(a) backpatched OSS** — a baseline and its transformation; vuln-proof against
  the prior artifact.
- **(b) FINOS-native** — no baseline; project health, origin, provenance.
- From Resolved inward the machine is class-agnostic.

## The perimeter crossing

- **Delivery manifest** — maker-assembled at Delivered. L-1 + L0–L7. Frozen by a
  transparency-log entry. Does not cross.
- **Evidence core** — issuer-assembled once at Fulfilled. Delivery manifest, L-1,
  L0–L8, compiled layout, Rego bundle. One digest shared by every bank. No clock.
  This is what crosses.
- **Ingest envelope** — bank-assembled by ③ at Verified → Resolved. Core digest,
  TUF trust-root snapshot, checkpoint set, Fulcio root, local artifact locator.
  Trust root ≤ 7 days, checkpoints ≤ 24 hours.
- Anything the gate needs that is not in the bundle is a live dependency.

## Gate — steps

- **Resolve** — ③ discovers attestations for digest `D` via the attestation
  index, collects them, seals the envelope. The last online step.
- **Compile and compare** — ① recompiles the layout locally from the signed
  contract; digests must match the layout as distributed (rule 14).
- **Structural** — `in-toto-verify` against the layout: right steps, right
  signers, thresholds met, DAG intact, not expired.
- **Semantic** — Rego via Witness: CVEs-fixed ⊇ scope, digest agreement across
  the quorum, coverage ≥ threshold, `conformance == FULL`, freshness limits.
- **Acceptance** — ④ runs the bank's own tests as an in-toto inspection at
  verification time, folded into the same verdict.
- **Verdict** — immutable record: admit or reject, pinning core digest, envelope
  digest, trust-root version and trust path.
- Fifteen rules, all must hold. Conformance is binary: `FULL` promotes,
  `PARTIAL` and `BREACH` never do. Staleness is a named-rule reject.

## Tracking

- ⑤ opens the exposure on `(appId, candidateKey)` at Adopted → Active.
- Durable facts are append-only hash-chained `ledger-event`s: `issued`,
  `renewed`, `expired`, `retired`, `verifier-revoked`.
- `ledger-row` and `state-pointer` are projections replayed from that chain.
- `Expiring` is computed at read time from the row.
- ⑥ presents the projections; state changes exit through the gate or the ledger
  as signed evidence.
- A revoked verifier key raises a review trigger; past verdicts stand, pinned to
  the `trustRootVersion` current at admission.

## Sunset

- A bridge ships with an expiry because a privately-maintained fork is itself a
  standing liability.
- At lapse, exactly one of two things happens.
- **Retire** — the application moved upstream. ⑤ writes `retired` and closes the
  exposure.
- **Renew** — a replacement bridge is commissioned and runs the whole lifecycle
  again from Drafted.

## Renewal

- A renewal is a new candidate carrying a `supersedes` edge to its predecessor.
- Each renewal has its own L-1 contract, its own `baseline.digest`, and very
  likely its own CVE set.
- `commons-x:3.2.1-osera.1` and `…-osera.2` are two immutable records, each with
  its own frozen evidence chain.
- `candidateKey` — version-less upstream purl plus `contract.osera.line` — stays
  constant across the chain, so the pointer and ledger follow the lineage.
- A continuing renewal carries the same `osera.line`; the `supersedes` edge and
  the line must agree.
- A renewal that jumps lines (3.x → 4.x) is a new lineage: the old line Retires,
  a new one is Commissioned.
- An amendment is a new version of the same commitment; a renewal is a new
  member of the same lineage. Different edges.
