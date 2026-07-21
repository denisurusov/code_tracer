```yaml
id: noteworthy-conformance-binary
type: noteworthy
title: Decision — conformance is binary at the gate (FULL or nothing)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T15:10:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 05038f93a541216c0f6713ea13bcff58a40d823d
  contentHash: 05038f93a541216c0f6713ea13bcff58a40d823d
  timestamp: 2026-07-21T15:10:00Z
createdAt: 2026-07-21T15:10:00Z
updatedAt: 2026-07-21T15:10:00Z
```
# Decision: conformance is binary at the gate

**Decision.** `conformance == "FULL"` or the artifact does not promote. `PARTIAL`
and `BREACH` are never admission paths. **Admission rule 13 stands unamended.**

**Why.** The L-1 contract is on a path to **smart-contract execution**, and
executable terms have no room for a discretionary middle state. A gate outcome
that depends on someone judging whether *this particular* shortfall is tolerable
cannot be compiled, cannot be re-run identically by a regulator, and cannot be
signed in advance. Determinism at the gate is the property the whole design is
built to produce; a promotable `PARTIAL` would trade it away for convenience.

**Rejects** the recommendation in `docs/osera-backpatch-contract.md` §6 item 2
("PARTIAL-promotable with the shortfall carried as open exposure — blocking
punishes honest partial delivery"). Honest partial delivery is real, but the
remedy is not a softer verdict.

**The route for honest partial delivery is amendment, not leniency.** If a CVE
turns out to be unfixable under the contract's own constraints (e.g. a fix
requiring an API break under `apiAbiStability: required`), the contract is
**amended** (`artifact-contract-lifecycle` §3): the CVE moves to
`explicitlyOutOfScope` with a stated reason, the maker re-countersigns, and
delivery is then `FULL` against a contract that tells the truth. The residual
exposure is recorded in a **signed contract**, not smuggled through as a
qualified gate verdict.

**Consequences.**
- **Scoping rigour moves to commissioning time**, which is where it belongs. A
  CVE that cannot be fixed under the contract's own stability constraints should
  never have been `cvesInScope`. `task-contract-authoring` (⑦) must surface
  fixability-under-constraints as a scoping question rather than discovering it
  at delivery.
- **`PARTIAL` and `BREACH` remain in the VSA enum** as maker/quorum *findings* —
  they describe what was delivered. They simply have no path to promotion.
- **The exposure stays visible either way.** Under amendment it sits in
  `explicitlyOutOfScope`, signed and auditable; the ledger tracks it as open
  rather than as covered.

**Cost, accepted deliberately.** A truthful 2-of-3 delivery cannot be admitted
until the contract is amended, costing a countersignature round-trip — during
which the bank still runs the unpatched baseline. This trades **latency at the
contract layer** for **determinism at the gate**, knowingly.

**Binds:** resolves `artifact-contract-lifecycle` §4 (no longer open); leaves
`artifact-architecture` §3.7 rule 13 unchanged; adds a fixability check to
`task-contract-authoring`.
