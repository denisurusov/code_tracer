```yaml
id: noteworthy-revocation-semantics
type: noteworthy
title: Decision — revocation records an exposure, does not force re-verification
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 19c83a6696b0385da970572660b26d3871318fad
  contentHash: 19c83a6696b0385da970572660b26d3871318fad
  timestamp: 2026-07-21T19:10:00Z
createdAt: 2026-07-21T19:10:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# Decision: revocation records an exposure

**Decision.** When a verifier key is revoked, packages already admitted on that
verifier's VSAs **remain admitted**. The `verifier-revoked` ledger event records
an **exposure with a review trigger**; it does not force re-verification and does
not retroactively invalidate the verdict.

> **Amendment 2026-07-30.** The decision is unchanged; the argument that makes it
> tolerable had to be replaced. It rested on `k ≥ 3` with zero dissent, and
> `noteworthy-signer-verification` retires that floor. See §"Cost, accepted".

**Why not forced re-verification.** One revoked key would simultaneously
invalidate every package that verifier ever signed — potentially hundreds,
across many applications, all at once. That is a self-inflicted outage triggered
by a *trust* event rather than an *artifact* event, and the artifacts have not
changed: they still rebuild to the same digest, still pass the same suites, still
prove the same CVEs fixed. Revocation says the signer can no longer be relied on
**going forward**, not that its past observations were false.

**Why the verdict stands.** Admission was valid at the time, against a pinned
`trustRootVersion` (`artifact-data-model` §4). The whole point of pinning that
version is that a past decision remains replayable and correct on its own terms.
Rewriting history when trust material changes would break exactly the property
the pin exists to guarantee.

**What happens instead.**
1. `verifier-revoked` is appended to the ledger for each affected `lineKey`.
2. The hash-chained ledger answers "which admitted packages rest on this
   signer" — a question a last-write row could not
   (`noteworthy-ledger-substrate`).
3. The exposure surfaces in the lifecycle console (⑥) as a **review trigger**
   against those packages.
4. The risk function decides, per package, whether to re-verify, accelerate
   sunset, or accept.

**Consistent with the design's habit of deriving rather than storing.** Same
shape as `Expiring`: the condition is computed from an append-only fact plus the
present moment, and the judgement stays with a human rather than being encoded as
an automatic state flip.

## Cost, accepted — and the argument that carries it

Between revocation and review, the bank is running artifacts whose evidence rests
partly on a compromised signer.

The original bound was quorum size: with `k ≥ 3` and zero dissent, a single
revoked verifier was never the sole basis for an admission. That no longer holds
uniformly — a two-signatory project rests on two signers, and a solo project on
one outside (`noteworthy-signer-verification`).

**The bound that replaces it is stronger, because it does not depend on how many
parties signed the contract.** The adopting bank rebuilt the package itself and
signed its own L8 (`noteworthy-adoption-rebuild`), so a revoked *signatory* key
was never the sole basis for **that bank's** admission in any mode. The
maker/checker separation the exposure window has to survive is preserved inside
the perimeter rather than assumed from outside.

Two cases still deserve sharper handling at review:

- **A revoked solo sponsor.** Outside corroboration was one signature and it is
  now suspect, so the bank's own rebuild is the whole of the remaining
  independent evidence. Enough to keep the package running while reviewed;
  thin enough that the review should be prompt.
- **A revoked key belonging to the adopting bank itself.** Here the inside
  argument is the one that fails, and the outside signatories carry it. Symmetric
  to the case above, and it is the reason the verification and admission
  functions inside one member should be separately keyed.

**Binds:** `artifact-data-model` §5 revocation item resolved; ⑤ exposure tracker
and ⑥'s console view gain the review-trigger surface;
`artifact-architecture` §5 carries the replacement argument.
