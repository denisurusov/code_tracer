```yaml
id: noteworthy-transparency-log
type: noteworthy
title: Decision — shared FINOS Rekor, witnessed by the quorum
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T18:45:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 62f7c4b932187a51625b047401a2925cb3b0715e
  contentHash: 62f7c4b932187a51625b047401a2925cb3b0715e
  timestamp: 2026-07-21T18:45:00Z
createdAt: 2026-07-21T18:45:00Z
updatedAt: 2026-07-21T18:45:00Z
```
# Decision: shared FINOS Rekor, witnessed by the quorum

**Decision.** The transparency log is a **shared FINOS-operated Rekor instance**,
not the public Sigstore log — and because FINOS operates it, the log is
**witnessed by the verifier quorum**: every VSA (L8) carries the **log checkpoint
that verifier observed**.

**Why the witnessing is not optional.** A transparency log's security property
comes from being *observed by independent parties*, not from the operator being
honest. A log operator can mount a **split view** — presenting one checkpoint to
one consumer and a different one to another — and nothing inside the log detects
it. With FINOS operating the log *and* anchoring the trust root, that is a single
party whose compromise silently breaks inclusion proofs everywhere: exactly the
single-point-of-trust shape `noteworthy-threshold-everywhere` forbids.

**Why it costs nothing.** The witnesses already exist. Verification is a duty of
membership (`noteworthy-governance-modes`), so quorum members already run the
infrastructure and already touch every artifact. Carrying the observed checkpoint
in the VSA turns **k-of-n agreement over checkpoints into split-view detection**
— no new protocol, no new party, no new trust relationship. A verifier that
observes a divergent tree head produces a dissenting VSA, and dissent is already
disqualifying (§3.6). This is the fourth instance of the threshold principle.

**Consequences.**
- **L8 gains `log.checkpoint`** — the signed tree head the verifier observed,
  with its inclusion proofs.
- **The evidence bundle carries the checkpoint *set*** — one per verifier, not a
  single checkpoint. Slightly more content for a materially stronger claim
  (`artifact-evidence-bundle` §2).
- **Admission rule 1 sharpens:** transparency-log presence is checked against the
  witnessed checkpoint set rather than against a single asserted tree head, and
  checkpoint divergence across the quorum is disqualifying.
- **Issuer-side dependency.** The delivery manifest is fixed in time by an entry
  in this log (`artifact-contract-lifecycle` §2), so the log is on the issuer
  critical path, not merely a consumer-side convenience.

**Why FINOS-operated rather than public.** Pre-disclosure embargo handling (the
contract carries `embargoUntil`) and sector-specific retention make a controlled
instance preferable; the witnessing requirement is what removes the trust cost
that would otherwise come with it.

**Open:** whether the checkpoint set must also be cross-checked against a public
log or an external witness network for consumers outside the membership. Not
needed for admission inside a member bank; possibly wanted for the regulator
story.

**Binds:** `artifact-data-model` §4 L8 row gains `log.checkpoint`;
`artifact-evidence-bundle` §2 carries the checkpoint set;
`artifact-architecture` §3.7 rule 1 and §9.
