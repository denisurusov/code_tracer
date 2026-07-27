```yaml
id: noteworthy-inbound-asymmetry
type: noteworthy
title: Framing — outbound code is governed, inbound is not
status: active
review: proposed
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-rename-pass
  inputs:
    - Code_tracer_presentation.pdf   # slide 01, the framing this record captures
  timestamp: 2026-07-27T00:00:00Z
createdAt: 2026-07-27T00:00:00Z
updatedAt: 2026-07-27T00:00:00Z
```
# Framing: outbound code is governed, inbound is not

**The observation.** A bank that contributes to open source already runs a
governed egress path. Contributions to FINOS go out through **GitProxy** — one
inspected route, policy enforced, nothing leaving unexamined. That machinery
exists, is understood by the risk function, and is not controversial.

Nothing equivalent exists in the other direction. Hardened releases and
FINOS-native projects **arrive carrying claims about themselves**, and no
mechanism checks those claims before the code is inside. The asymmetry is not
that inbound is unmanaged in every sense — there are scanners, repository
managers, approval workflows — but that none of them verifies the *provenance of
the assertion*. A scanner reads the artifact; it does not ask whether the party
who produced it did what they committed to do.

**Why this is worth recording as its own entity.** It is the shortest complete
answer to *why does this project exist*, and until now it lived only in a
presentation. Every other framing in the graph starts one level in — the
attestation chain, the anchor problem, the commissioned specification — and each
assumes the reader already accepts that inbound needs a gate at all. This record
supplies the premise those arguments rest on.

It is also the framing most likely to land with an audience that has not read
the design. A bank already understands the outbound control, so *"we do this
going out and nothing coming in"* needs no supply-chain vocabulary, no levels,
and no threat model to be immediately legible.

**What it licenses, and what it does not.**

- It motivates **the gate** (`goal-the-gate`): a mechanical admit-or-refuse
  decision on the inbound path, which is what GitProxy is on the outbound one.
- It motivates **the ledger** (⑤): egress is a moment, ingress creates a standing
  exposure, so the inbound control needs an afterlife the outbound one does not.
- It does **not** imply symmetry of mechanism. GitProxy inspects content leaving
  a boundary the bank controls end to end. The inbound problem is the opposite:
  the bank controls neither the production of the artifact nor the production of
  the evidence, which is why the answer is a commissioned specification and an
  independent quorum rather than an inspection proxy. Reading the asymmetry as
  "build a GitProxy for inbound" would miss the whole design.

**Cost of leaving it unrecorded.** The framing is load-bearing for anything
outward-facing — the working paper's opening, the presentation, a working-group
pitch — and a claim that lives only in slides drifts without anyone noticing,
since nothing validates it and nothing points at it. Recording it makes it
citable and puts it under the same review discipline as the decisions it
motivates.

**Status.** This is a **framing** rather than a decision: it fixes no schema,
resolves no open item, and forecloses no alternative. It is recorded because it
is the premise the rest of the graph argues from, and because its only prior home
was a deck.

**Relates:** `goal-admission-gate` (the root goal this is the rationale for),
`artifact-architecture` §1 (context and scope, where the framing belongs in
prose), `artifact-paper-outline` (Part I §1 opens on the same bind, from the
dependency-coupling angle rather than the governance-asymmetry one).

**Applied 2026-07-27.** `artifact-architecture` §1 now opens on this framing,
under the heading *Why the gap exists*, so a reader arriving cold gets the
motivation before the mechanism. The not-symmetric caveat travels with it, since
that is the misreading the pairing invites. No open items remain on this record.
