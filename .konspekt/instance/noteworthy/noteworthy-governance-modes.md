```yaml
id: noteworthy-governance-modes
type: noteworthy
title: Decision — two governance modes; verification is a duty, not a credit
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T18:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 362e1ebe2a81cdfabf6b106db12db1e3ade7531a
  contentHash: 362e1ebe2a81cdfabf6b106db12db1e3ade7531a
  timestamp: 2026-07-21T18:00:00Z
createdAt: 2026-07-21T18:00:00Z
updatedAt: 2026-07-21T18:00:00Z
```
# Decision: two governance modes; verification is a duty

**Decision.** The alliance operates in **two commissioning modes**, and they map
onto the two trust paths already fixed by `noteworthy-trust-root-ownership` — no
new trust machinery is required:

| | **Mode 1 — mutualized** | **Mode 2 — solo** |
|---|---|---|
| Commissioning | members vote a project in | one bank decides alone |
| Spend & benefit | shared | borne by the sponsoring bank |
| Accountability | collective | **the sponsoring bank, solely** |
| Trust path | `osera-root` | `delegated:<bank>` |
| Verification | k-of-n, zero dissent | **k-of-n, zero dissent (identical)** |

**Verification is a duty of membership, not a credit against funding
contribution.** Members verify what comes through the rails regardless of who
paid for it. This **reverses the recommendation** in
`docs/osera-attestation-chain.md` §9 item 6, which recommended the credit model;
that recommendation predates mode 2 and is incompatible with it.

**Why the reversal is forced, not preferred.** In mode 2 the sponsoring bank is
commissioner, consumer, and sole governor. If it also supplied its own
verification, k-of-n would collapse to 1-of-1 and the maker/checker split — the
single property the whole design exists to produce — would be gone. Under the
credit model a solo project would have no quorum **by construction**, so mode 2
could never reach FULL admission and would not be a real mode. Duty is what makes
it real. This is arithmetic, not policy preference.

## What mode 2 actually removes

**Consensus on *what should be commissioned* — not consensus on *whether what
was delivered conforms*.**

- **Removed:** the collective judgement that this package, this line, this
  baseline, this CVE set was worth the alliance's spend. In mode 2 that judgement
  is one bank's, and the accountability for it is that bank's alone.
- **Not removed:** the k-of-n independent quorum with zero dissent, the L-1
  contract, the anchor check, rule 13's binary conformance, or any other
  admission rule. The gate is identical across modes
  (`noteworthy-trust-root-ownership`: attribution, not leniency).

So **"other members act at their own risk"** attaches to the *commissioning
judgement*, never to evidence quality. A mode-2 artifact carries exactly the same
proof that it conforms to its contract; what it does not carry is anyone else's
agreement that the contract was the right one to issue. A consuming member's own
gate still runs the full policy and still records `verdict.trustPath`, which is
precisely how that distinction stays visible after the fact.

## The vote is evidence

The L-1 contract gains a `governance` block, so "was this properly
commissioned?" becomes checkable at the gate rather than assumed — the same move
L-1 already made for scope and corpus:

```jsonc
"governance": {
  "mode": "mutualized",              // mutualized | solo
  "sponsor": "https://osera.finos.org",   // or the single bank, in solo mode
  "mandateRef": { "sha256": "<vote or authorization record digest>" },
  "trustPath": "osera-root"          // or delegated:<bank>
}
```

The contract doc already recommends contracts be issued off the ranked
backpatch-candidate list rather than ad hoc; `mandateRef` is what makes that
recommendation enforceable. `governance.trustPath` must agree with the namespace
the artifact is actually signed under — a checkable admission invariant, in the
same family as the supersedes-agrees-with-line rule.

## Residues, deliberately not engineered away

- **Free-riding in mode 2.** The backpatch inherits the upstream licence, so a
  bank funding a hardening alone cannot readily stop other members consuming the
  result once it is on shared rails. Presumably much of why mode 1 exists. This
  is membership terms and economics, not schema — recorded so no one assumes the
  tooling enforces exclusivity.
- **Verification load.** Duty means members carry verification cost for projects
  they did not vote for and may not consume. Bounded by the fact that the
  marginal cost is one CI job (§3.6), but it is a real membership obligation and
  belongs in the participation agreement.

**Binds:** adds a `governance` block to the L-1 row in `artifact-data-model` §4,
plus the trustPath-agrees-with-namespace invariant; `task-contract-authoring`
(⑦) must capture mode, sponsor and mandate at drafting.
**Resolves:** `docs/osera-attestation-chain.md` §9 item 6 (duty, reversing its
recommendation); narrows `artifact-architecture` §6 the-gap — the commissioning
half of alliance governance is now decided, leaving trust-root thresholds,
verifier on/offboarding and compromise procedure open.
