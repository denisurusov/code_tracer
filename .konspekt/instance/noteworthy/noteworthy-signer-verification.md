```yaml
id: noteworthy-signer-verification
type: noteworthy
title: Decision — signers verify; zero dissent; minimum two
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-30T00:00:00Z
createdAt: 2026-07-30T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: signers verify; zero dissent; minimum two

**Decision.** The parties that sign a contract are the parties that verify it.
All of them verify, all must agree, and a team-mode project needs at least two
signatories. `k` is therefore the signer count rather than a computed threshold,
and `k = max(3, ceil(n/3))` retires.

**Why.** Whoever signs carries the financial risk. That binding is what makes
verification reliable — a funder has already accepted the cost and bears the
consequence of a bad patch running in its own estate. It also removes the
assignment problem entirely: no sortition function, no registrar discretion, and
no project starving at Delivered because nobody picked it up. The assignment
falls out of the mandate, which is already signed and recorded.

**Why the floor of three fell.** `noteworthy-quorum-parameters` justified it on
the grounds that two verifiers disagreeing give no way to tell which is wrong
without a third. That rationale was void on arrival: dissent is disqualifying and
nothing arbitrates. Two agree and it admits; two disagree and it stops, exactly
as five would. The third verifier was never going to break a tie, because there
are no ties.

**What the formula gave up.** Two arguments for three survive, and both are worth
recording because neither was the one the decision rested on:

- **Compromise resistance.** At two, one compromised verifier is half the
  evidence; at three it is a third, and the remaining two still disagree with it.
- **Revocation semantics.** `noteworthy-revocation-semantics` leaves past verdicts
  standing after a key revocation because no single verifier was ever the sole
  basis for an admission. At two that argument weakens; at one — solo mode — it
  fails, and solo needs its own treatment there.

Both are judged acceptable against parties bound by a contract they signed and
funded.

**The sunk-cost risk, stated.** A funder who needs the package in production has
a motive to see it pass as well as a motive to see it checked. What holds is that
the rebuild comparison is digest equality with nothing to interpret, and that the
same funder carries the operational consequence of admitting a bad patch.

**Consequences.**

- **`n` stops being the membership.** Verification becomes a cost of
  commissioning rather than a duty of membership, reversing the framing in
  `noteworthy-governance-modes`. The reasoning that killed the credit model still
  holds — a credit invites commissioning solo and never verifying — and is now
  moot, because the party that commissions is the party that verifies.
- **Two funders become a commissioning precondition** in team mode. A project
  nobody else will co-fund cannot be commissioned as a team project, which is a
  filter on the demand pipeline that the commissioning ballot did not previously
  have.
- **Solo carries a different rule** (`noteworthy-adoption-rebuild`).
- **One consequence has since been resolved by deletion.** This decision left the
  blessing petition without a number, since it had borrowed "the quorum
  threshold" and that phrase stopped naming one. Rather than choosing a value,
  `noteworthy-solo-distribution` removed the petition: solo output publishes on
  the same terms as team output under its own trust path. Recorded because the
  shape recurs — a value that becomes unnameable is sometimes evidence that the
  thing needing it should not exist.

**Binds:** `verification.k` in the L-1 contract and what Accepted freezes
(`artifact-contract-lifecycle`); rules 2′ and 5′ and §3.6 in
`artifact-architecture`. **Supersedes:** the sizing rule in
`noteworthy-quorum-parameters`; its zero-dissent and frozen-at-issuance
provisions stand unchanged.
