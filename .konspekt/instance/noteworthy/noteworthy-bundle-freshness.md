```yaml
id: noteworthy-bundle-freshness
type: noteworthy
title: Decision — bundle freshness, two clocks, stale is a reject
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T19:10:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 19c83a6696b0385da970572660b26d3871318fad
  contentHash: 19c83a6696b0385da970572660b26d3871318fad
  timestamp: 2026-07-21T19:10:00Z
createdAt: 2026-07-21T19:10:00Z
updatedAt: 2026-07-21T19:10:00Z
```
# Decision: bundle freshness — two clocks, stale is a reject

**Decision.** Offline verification forfeits TUF's own freshness guarantee, so
maximum age is stated explicitly, on **two separate clocks**:

| Element | Max age | Why this clock |
|---|---|---|
| Trust-root snapshot (TUF) | **7 days** | Changes rarely; the staleness risk is a **revoked key still looking valid** |
| Checkpoint set (Rekor) | **24 hours** | Changes constantly; a stale tree head weakens split-view detection |

**Two clocks, not one**, because the two elements have different change rates and
different failure modes. A single conservative number would either force
pointless trust-root refreshes or tolerate dangerously old checkpoints.

**Configurable downward, never upward.** A bank may tighten either limit for its
own gate; it cannot loosen them. This keeps the floor a property of the design
rather than of local configuration — the same reasoning that refused a weaker
admission tier for delegated paths.

**Stale is a reject with a named rule, not a warning.** Consistent with binary
conformance (`noteworthy-conformance-binary`) and with the gate's general
discipline: a warning is a decision deferred to whoever is reading the console at
the time, which is not a control. A stale bundle is re-resolved and re-run —
cheap, since the artifact and its attestations are unchanged and only the trust
material needs refreshing.

**Consequence — air-gapped operation has a floor.** The tar projection
(`noteworthy-bundle-format`) must cross the gap within 24 hours of checkpoint
issuance, which sets a real operational cadence for air-gapped estates rather
than leaving it implicit. Flagged as a constraint the deployment story must
absorb, not a problem to solve in the schema.

**Binds:** new admission rule (freshness) in `artifact-architecture` §3.7;
`artifact-evidence-bundle` §6 freshness item resolved.
