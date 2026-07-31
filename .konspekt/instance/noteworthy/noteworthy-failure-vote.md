```yaml
id: noteworthy-failure-vote
type: noteworthy
title: Decision — any contract failure is resolved by a signatory vote
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-31T00:00:00Z
createdAt: 2026-07-31T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: any contract failure is resolved by a signatory vote

**Decision.** When a contract fails — **breach**, **lapse**, **unresolved
dissent**, or a **missed service level** — the contract's **signatories vote on
how to proceed**. One rule for every failure, rather than a separately reasoned
escalation per path.

**Why the signatories.** They funded it and they carry the consequence, which is
the same binding that makes them the verifiers (`noteworthy-signer-verification`).
Nobody else has standing to decide whether to amend, re-commission, abandon or
write off work they did not pay for.

**Detection and decision are separate.** Each exception path keeps its owner for
*detecting and recording* the failure — the registrar sees dissent, the
secretariat sees a lapse, the index operator sees a reconciliation gap. What the
owner does **not** do is decide the response. That was accumulating as
per-path invention: five escalations, each with its own implied authority, none
of them written down as a rule.

**Solo mode degenerates cleanly.** One signatory means the vote is the sponsor's
decision alone. That is consistent rather than exceptional — the sponsor pays,
decides and carries the risk, which is what solo mode means
(`noteworthy-solo-distribution`).

**What this does not change.** The gate is untouched. A failure is a *contract*
event, not an admission event: no vote can promote a package that failed a rule,
and conformance stays binary (`noteworthy-conformance-binary`). The vote decides
what the alliance does about the commitment — amend the contract, re-commission,
abandon it, or accept the shortfall as a finding — and the outcomes it can reach
are the ones the machinery already provides.

**Consequence for the exception paths.** `artifact-operating-model` §6 gets
simpler: each path names a trigger, an owner who records, and the terminating
record, and the response is one rule stated once. **The vote itself is a
recorded event** — like the commissioning mandate it resembles — so a project
that was abandoned rather than amended leaves evidence of the decision, not just
of the failure.

**Binds:** `artifact-operating-model` §6; the three terminal states in
`artifact-contract-lifecycle` §1, which now have a defined route out rather than
only a definition. **Relates:** `noteworthy-signer-verification`,
`noteworthy-conformance-binary`.
