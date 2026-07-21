```yaml
id: noteworthy-threshold-everywhere
type: noteworthy
title: Principle — no single key is load-bearing
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T17:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T17:20:00Z
```
# Principle: no single key is load-bearing

**Principle.** Wherever this design depends on a signature to carry trust,
authority is **threshold, never singular**; agreement is **threshold, never
simple majority**; and **dissent is disqualifying, never outvoted**.

Stated once because it has now recurred three times independently, each time
arrived at on its own merits:

| Instance | Shape | Fixed in |
|---|---|---|
| Verifier quorum (L8) | k-of-n VSAs, zero dissent | `artifact-architecture` §3.6 |
| Layout compilation | two independent compiles, digest agreement | `noteworthy-compiler-siting` |
| TUF trust root | k-of-m co-signature across organizations | `noteworthy-trust-root-ownership` |

**The common form.** Each is a *deterministic* process, so independent parties
converge without coordinating — agreement by Schelling point rather than by
consensus protocol. This is why the principle costs so little: it buys
independence without buying distributed-consensus machinery, which
`noteworthy-ledger-substrate` already rejected for the same reasons.

**Why dissent must disqualify.** A mismatch in a deterministic process is not a
vote to be lost; it is evidence that either the determinism spec or one
participant is defective. Arithmetic over dissent discards exactly the signal the
design exists to produce.

**Standing test for future decisions.** Any new mechanism whose compromise turns
on a *single* key or a *single* checker is, by this principle, incorrectly
designed — raise it rather than accept it.

**Notes:** `artifact-architecture` §3.6, `noteworthy-compiler-siting`,
`noteworthy-trust-root-ownership`, `noteworthy-ledger-substrate`.
