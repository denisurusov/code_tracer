```yaml
id: noteworthy-solo-distribution
type: noteworthy
title: Decision — solo output distributes freely; no blessing, no petition
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-31T00:00:00Z
createdAt: 2026-07-31T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: solo output distributes freely; no blessing, no petition

**Decision.** Solo-mode output is published to the shared distribution point on
the same terms as team output, under its own `delegated:<bank>` trust path.
There is **no blessing gate, no blessing petition, and no re-attribution**. A
package's `trustPath` is fixed at issuance and never changes.

**Why a bank goes solo.** To use the standards — the evidence format, the gate,
the trust root, the whole verifiable pipeline — on work only it wants done. It is
not seeking the alliance's endorsement, so there is nothing for a petition to
grant and no reason to want one.

**Retires "blessing" entirely.** The concept said that team output carried
blessing *by definition* and solo output could earn it. Read plainly, blessing
meant "commissioned in team mode" — which `governance.trustPath` already records
and every verdict already pins. One fact under two names, with a gate attached to
the redundant one.

**Rejected: withholding distribution pending a petition.** This was the previous
position and it does not survive contact with
`noteworthy-trust-root-ownership`, which fixes the trust path as **attribution,
not leniency**. The gate applies identical rules to both paths and every adopting
bank rebuilds regardless, so gating discoverability makes nothing safer — it just
makes conforming output harder to find. That is a weaker tier arriving through a
different door.

**Rejected: retroactive re-attribution.** Moving a package from
`delegated:<bank>` to `osera-root` would mean the alliance adopting a
commissioning judgement it did not make, after the fact. Nobody needs it: the
sponsor wanted the standards rather than the endorsement, and a consumer that
wants the package already has it.

**What this buys — `trustPath` is immutable.** Re-attribution would have let a
package's path change *after* verdicts had pinned it, so an old verdict would
name a path that no longer described the package it admitted. Every verdict is
self-contained for offline replay (`artifact-data-model` §4), and that property
quietly required the path never to move. It now holds by construction rather than
by nobody having exercised the petition.

**Cost, accepted.** Free-riding in solo mode is now entirely unmitigated: a
member consuming solo output pays its own rebuild and nothing toward the
commissioning. `noteworthy-governance-modes` already recorded that the licence
makes exclusivity unenforceable, so the petition was never much of a lever — but
it was the last one, and removing it should be a deliberate act rather than an
oversight. This is membership economics, not mechanism.

**Resolves:** the blessing-petition threshold — open in `artifact-architecture`
§9 and item 8 in `artifact-operating-model` §7 — by removing the thing that
needed a threshold. **Binds:** the Distribution section of `docs/lifecycle.md`;
activity A4 in `artifact-operating-model` §4, which loses its petition branch.
**Amends:** `noteworthy-governance-modes`.
