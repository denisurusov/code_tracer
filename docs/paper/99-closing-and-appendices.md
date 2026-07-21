# Contract-Bound Evidence — closing and appendices

## Closing

The sentence this model lets a regulated institution put in front of a regulator
is the point of all of it:

> Every artifact we admitted provably conforms to a scope its supplier committed
> to before starting work, was independently re-derived by a quorum of at least
> three parties with no disagreement permitted, and was separately
> acceptance-tested inside our own environment. We can re-run that decision
> offline, today, and reach the same verdict.

Each clause is doing work. *Committed to before starting* is what makes the test
evidence falsifiable. *Independently re-derived* is what converts the supplier's
claims into evidence. *No disagreement permitted* is what turns a divergent
result into an alarm instead of a rounding error. *Acceptance-tested inside our
own environment* is the part no alliance can do on anyone's behalf. And
*offline, today* is what separates an auditable control from a story about one.

None of the components are novel. Content-addressed subjects, in-toto layouts,
SLSA provenance, verification summary attestations, transparency logs, TUF trust
roots and reproducible builds all exist and are deployed elsewhere. What is new
is the ordering: fixing the specification before the work, and requiring
independent reproduction against it rather than after it.

The honest summary is that this model does not make third-party patches
trustworthy. It makes them *checkable*, which is a smaller claim and a more
useful one.

---

## Appendix A — Figures

All four figures, and the sources they are generated from, are in
`docs/resource/`. Where a figure and the design records disagree, the records are
authoritative.

| Figure | Answers |
|---|---|
| 1 — Lifecycle and zones | What states exist, and where the boundary falls |
| 2 — Data model | Which attribute binds to which; every arrow is an admission rule |
| 3 — Architecture | The components, and the stores they touch |
| 4 — Physical topology | Where the bytes actually live, and who reads them |

## Appendix B — The admission ruleset

The gate evaluates fifteen rules in two passes, structural then semantic. They
are enumerated in full in `artifact-architecture` §3.7 rather than reproduced
here, because they are versioned artifacts that will drift from any copy printed
in prose.

The rules divide into five groups: **signature and log validity** (1),
**verifier quorum** (2, 5), **anchor re-derivability** (3), **graph and
digest-binding integrity** (4, 6, 7, 11, 12), and **contract conformance**
(8, 9, 10, 13). Two further rules cover **compile agreement** (14) — both sides
compile the policy and compare digests — and **freshness** (15), since offline
verification forfeits the trust root's own currency guarantee.

Every rule must be decidable from the evidence bundle alone. A rule requiring a
live lookup is either wrong or evidence of a missing bundle element, and that
test is what keeps the hermeticity claim falsifiable rather than aspirational.

## Appendix C — Status

This is a working draft circulated for comment. Parts I–IV are drafted; the
worked example's CVE identifiers and version numbers are deliberately absent and
must be verified against a live source before publication.

The design records this paper is drawn from — including the decisions it
summarises and the open questions it lists — are maintained as a content-addressed
graph under `.konspekt/instance/`. Where this paper and those records disagree,
the records are authoritative and this paper is stale.
