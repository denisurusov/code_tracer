```yaml
id: noteworthy-quorum-parameters
type: noteworthy
title: Decision — quorum parameters (k ≥ 3 and ≥ one third, zero dissent)
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
# Decision: quorum parameters

**Decision.**

```
  n = the active verifier set (≈ active membership, since verification is a duty)
  k = max(3, ceil(n / 3))          # a floor expressed two ways
  dissent tolerance = 0            # unchanged: zero dissent, not majority
```

**`n` ≈ active membership.** Verification is a duty rather than a credit
(`noteworthy-governance-modes`), so every active member is in the verifier set by
virtue of membership. `n` is therefore not a separately negotiated number; it is
the live count of active, non-revoked entries in the verifier registry (⑨).

**`k` as a dual floor — absolute *and* fractional.** Three is the smallest number
that makes independent agreement meaningful, and it matches the value already
sketched in `docs/osera-backpatch-contract.md` (`"k": 3`). But a fixed absolute
**silently weakens as membership grows**: 3-of-5 is a strong claim, 3-of-40 is
nearly meaningless. Expressing `k` as `max(3, ceil(n/3))` keeps the guarantee
proportional without ever dropping below the absolute floor.

**Zero dissent is unchanged and is the load-bearing half.** `k` sets how much
independent agreement is required; the dissent rule is what converts
disagreement into a signal rather than an outvoted minority (§3.6,
`noteworthy-threshold-everywhere`). Raising `k` without zero-dissent would be
theatre.

**Where the parameters live.** `k` is written into each L-1 contract
(`verification.k`) at issuance and compiled into the layout's `threshold`, so a
given artifact is judged against the quorum size in force when it was
commissioned — not against a value that drifted afterwards. The formula is the
default the issuer applies; the contract records the resulting number.

**Onboarding / offboarding stays alliance governance.** Who qualifies as an
active verifier, and the process for admitting or removing one, is
formation-stage policy that ⑨ implements but does not settle
(`artifact-architecture` §6, the-gap).

**Open consequence — small-membership start.** At formation `n` may be below 3,
in which case no artifact can reach FULL admission. That is the correct failure
(it is what the floor means), but it makes verifier recruitment a launch
prerequisite rather than a growth activity. Worth stating plainly to the working
group.

**Binds:** `verification.k` in the L-1 schema; layout `threshold` via ①;
resolves the quorum-parameters item in `artifact-architecture` §9.
