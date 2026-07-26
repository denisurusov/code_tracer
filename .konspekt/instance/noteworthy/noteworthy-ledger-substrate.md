```yaml
id: noteworthy-ledger-substrate
type: noteworthy
title: Decision — append-only hash-chained logs (ledger substrate; registry TUF)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-26T18:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 424df10e62cab63963dfe1759ddb248cc9236020
  contentHash: 424df10e62cab63963dfe1759ddb248cc9236020
  timestamp: 2026-07-17T19:40:00Z
createdAt: 2026-07-17T19:40:00Z
updatedAt: 2026-07-26T18:00:00Z
```
# Decision: append-only hash-chained logs (ledger substrate; registry TUF)

**Decision.** The event-sourced ledger runs on an **append-only, hash-chained
event log** — not an event-store product (Kafka/EventStoreDB/Axon) and not a
consensus blockchain. Its durable facts are `ledger-event`s: each carries its own
`sha256`, references a package record, and hash-chains to the prior event
for its `lineKey` (`issued → renewed → expired → retired`). `ledger-row`
and `state-pointer` are **projections** replayed from that chain, not
authoritative state.

The **verifier registry does not join this log** — it keeps the same *pattern*
(replayable, append-only, signed history) via its own purpose-built *mechanism*,
**TUF**, which additionally handles the one thing a generic event log cannot:
trust recovery after key compromise. This also keeps trust-root governance
(architecture §9's biggest gap) scoped to TUF rather than smeared across the
ledger.

**Hash-linking, not consensus.** "Blockchain with hashes" resolves to the
Merkle/hash-chain sense — tamper-evidence (break one hash, the whole tail is
invalid) and replay-to-past-state — which is adopted unreservedly. The full-sense
blockchain (distributed consensus, p2p canonical-chain agreement, BFT,
tokens/mining) is deliberately **out**, on the same reasoning the quorum decision
already used (architecture §3.6): single writer per log, no double-spend, no
scarce resource, a trusted neutral venue, and latency a bank SLA can't absorb.
Even the one multi-party moment — the k-of-n VSA set — reaches agreement by
Schelling point (reproducible builds converge without coordinating), not by a
consensus protocol.

**Capstone — three replay-logs, one pattern.**

| Log | Side | Mechanism |
|---|---|---|
| Attestation chain | production | Merkle / Rekor-style transparency |
| Ledger | operational | hash-chained `ledger-event`s |
| Verifier registry | trust | TUF metadata |

Each is append-only and replayable to a past state; each specializes for its
job; everything else is a projection.

**Collapses a distinction.** There are not two storage philosophies (immutable
content-addressed vs mutable operational) but **one append-only discipline with
mutable *views* on top** — nothing durable is ever overwritten; the only mutable
things are recomputable projections (plus genuinely external inputs like the
CMDB `application` record).

**Binds:** splits the ledger into `ledger-event` (durable) + `ledger-row`/
`state-pointer` (projections) in `artifact-data-model` §2–§5. **Resolves:** the
event-log-substrate open item (§6) — the last of the shortlist.
