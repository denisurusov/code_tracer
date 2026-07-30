```yaml
id: noteworthy-governance-modes
type: noteworthy
title: Decision — two governance modes; verification follows the money
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 362e1ebe2a81cdfabf6b106db12db1e3ade7531a
  contentHash: 362e1ebe2a81cdfabf6b106db12db1e3ade7531a
  timestamp: 2026-07-21T18:00:00Z
createdAt: 2026-07-21T18:00:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# Decision: two governance modes; verification follows the money

> **Amendment 2026-07-30 (`noteworthy-signer-verification`,
> `noteworthy-adoption-rebuild`).** The original decision made verification a
> **duty of membership**, on the arithmetic that solo mode would otherwise
> collapse to a single verifier and lose the maker/checker split. That arithmetic
> was right and its premise has changed: the split is now preserved *inside the
> perimeter* instead, because every adopting bank rebuilds for itself. So
> verification binds to the parties that **sign and fund** a contract, solo does
> carry exactly one outside verifier, and the mode table below is amended
> accordingly. The original reasoning is retained in full under §"What the duty
> model was defending", because it is the argument the new position has to answer
> rather than a mistake to erase.

**Decision.** The alliance operates in **two commissioning modes**, and they map
onto the two trust paths already fixed by `noteworthy-trust-root-ownership` — no
new trust machinery is required:

| | **Mode 1 — team** | **Mode 2 — solo** |
|---|---|---|
| Commissioning | members vote a project in | one bank decides alone |
| Spend & benefit | shared | borne by the sponsoring bank |
| Accountability | collective | **the sponsoring bank, solely** |
| Trust path | `osera-root` | `delegated:<bank>` |
| Outside verification | every signatory, zero dissent, minimum two | the sponsor alone |
| Inside verification | the adopting bank rebuilds and signs its own L8 | **identical** |
| Admission rules | the full policy | **identical** |

**Verification follows the money.** The parties that sign a contract verify it,
because they carry the financial risk and the operational consequence of a bad
patch in their own estate. A team project needs at least two signatories to be
commissioned at all; a solo project has one
(`noteworthy-signer-verification`).

## What the duty model was defending

The original decision made verification an obligation of membership rather than a
credit against funding contribution, and the argument was arithmetic. In solo
mode the sponsoring bank is commissioner, consumer and sole governor. If it also
supplied its own verification, the quorum would collapse to one and the
maker/checker split — the single property the whole design exists to produce —
would be gone. Under a credit model a solo project would have no quorum **by
construction**, so solo could never reach FULL admission and would not be a real
mode.

That reasoning still holds against the credit model, which stays rejected: a
credit invites a member to commission alone and never verify, starving exactly
the institutions best able to check the work.

**What changed is where the split is preserved.** Outside the perimeter, solo
carries one reproduction. Inside it, **every adopting bank rebuilds the package
itself and signs its own L8**, in both modes identically
(`noteworthy-adoption-rebuild`). The checker is therefore always distinct from
the maker at the point where the decision actually matters — the admission — and
it is the party carrying the risk that performs the check. The duty model
achieved that by conscripting uninvolved members; this achieves it by the
consumer doing its own work.

**The cost moves rather than disappears.** Verification does not compress, so
under the duty model members paid for projects they neither commissioned nor
consumed, and under this model every consumer pays for what it adopts. The second
distribution matches benefit to cost and removes the free-rider incentive the
first had to legislate against.

## What mode 2 actually removes

**Consensus on *what should be commissioned*, and the number of independent
reproductions before the perimeter — never the rules the gate applies.**

- **Removed:** the collective judgement that this package, this line, this
  baseline, this CVE set was worth the alliance's spend. In mode 2 that judgement
  is one bank's, and the accountability for it is that bank's alone.
- **Reduced:** outside corroboration. A team package crosses the perimeter with
  several independent reproductions behind it; a solo package with one.
- **Not removed:** the L-1 contract, the anchor check, rule 13's binary
  conformance, zero dissent, the adopting bank's own rebuild, or any other
  admission rule. The gate is identical across modes
  (`noteworthy-trust-root-ownership`: attribution, not leniency).

So **"other members act at their own risk"** attaches to the *commissioning
judgement* and to *how much outside corroboration accompanied the artifact*. A
consuming member's own gate still runs the full policy, still rebuilds for
itself, and still records `verdict.trustPath`, which is how the distinction stays
visible after the fact. The earlier phrasing — that the evidence is identical and
only the commissioning judgement differs — no longer holds and has been removed.

## The vote is evidence

The L-1 contract gains a `governance` block, so "was this properly
commissioned?" becomes checkable at the gate rather than assumed — the same move
L-1 already made for scope and corpus:

```jsonc
"governance": {
  "mode": "team",                        // team | solo
  "sponsor": "https://osera.finos.org",  // or the single bank, in solo mode
  "signatories": [ "..." ],              // the parties that sign, fund and verify
  "mandateRef": { "sha256": "<vote or authorization record digest>" },
  "trustPath": "osera-root"              // or delegated:<bank>
}
```

The contract doc already recommends contracts be issued off the ranked
backpatch-candidate list rather than ad hoc; `mandateRef` is what makes that
recommendation enforceable. `governance.trustPath` must agree with the namespace
the artifact is actually signed under — a checkable admission invariant, in the
same family as the supersedes-agrees-with-line rule. `signatories` is what rules
2′ and 5′ evaluate against.

## Residues, deliberately not engineered away

- **Free-riding in mode 2.** The backpatch inherits the upstream licence, so a
  bank funding a hardening alone cannot readily stop other members consuming the
  result once it is on shared rails. Presumably much of why mode 1 exists. This
  is membership terms and economics, not schema — recorded so no one assumes the
  tooling enforces exclusivity. Note that a free rider now pays its own rebuild
  cost, which narrows the gap without closing it.
- **Sunk cost pulls against scrutiny.** A signatory that has already paid, and
  needs the package in production, has a motive to see it pass. What holds is
  that the rebuild comparison is digest equality with nothing to interpret, and
  that the same party carries the consequence of admitting a bad patch
  (`noteworthy-signer-verification`).

**Binds:** adds a `governance` block — now including `signatories` — to the L-1
row in `artifact-data-model` §4, plus the trustPath-agrees-with-namespace
invariant; `task-contract-authoring` (⑦) must capture mode, sponsor, signatories
and mandate at drafting.
**Resolves:** `docs/historical/osera-attestation-chain.md` §9 item 6 — the credit
model stays rejected, and the duty model that replaced it is now itself replaced
by signatory verification; narrows `artifact-architecture` §6 the-gap — the
commissioning half of alliance governance is decided, leaving trust-root
thresholds, verifier on/offboarding and compromise procedure open.
