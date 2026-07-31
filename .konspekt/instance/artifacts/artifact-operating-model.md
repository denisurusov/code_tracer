```yaml
id: artifact-operating-model
type: artifact
title: code_tracer — Operating model (who runs it, on what clock)
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
# code_tracer — Operating model

**Status:** accepted (`review: accepted`). The operating layer above the design
axes. The four axes say what the system means, `artifact-evidence-bundle` says
what crosses the perimeter, and `artifact-deployment-topology` says where the
bytes live. None of them says **who is on the hook, by when, and what each
activity leaves behind.**

Reader-facing companion: `docs/operating-model.html`, which carries the
field-by-field register this artifact indexes.

**What acceptance covers.** The activities, the roles, the two kinds of clock,
the exception paths and the principle in §1 are accepted as the shape of the
operating layer. The **values** are not: §5 names every service level as a
parameter and marks it TBD, and §7 marks every unsettled question with the party
that ratifies it. Accepting the model is accepting where the questions sit, not
answers to them.

> **Amendment 2026-07-31 (`noteworthy-solo-distribution`).** The
> blessing-petition threshold is closed by removing the thing that needed one.
> Solo output distributes on the same terms as team output under its own trust
> path; there is no blessing, no petition and no re-attribution. Activity A4
> loses its petition branch.

> **Amendment 2026-07-31 (three decisions).** §4 — a "renewal" is a **successor
> project** and re-enters the pipeline at N1, not N4
> (`noteworthy-successor-project`). §5 — service levels become **named parameters
> with TBD values**, and the notice window is **derived by formula**
> (`noteworthy-service-level-parameters`). §6 — every contract failure resolves
> by a **vote of the contract's signatories**, replacing five separately reasoned
> escalations (`noteworthy-failure-vote`).

## 1. The organising principle

**Every activity terminates in an artifact the machinery already defines** — a
signed record, a transparency-log entry, a hash-chained `ledger-event`, or a
projection that visibly ages. An activity whose only output is that somebody
looked cannot be audited and cannot be shown to have lapsed, so it does not
appear here.

Three consequences:

- **Clocks belong to containers.** A sealed evidence set never expires; the
  material used to check signatures on it does. So evidence duties are
  alliance-wide and one-shot, freshness duties are bank-local and repeating
  (`artifact-evidence-bundle` §3).
- **Failure is already loud** — expired trust metadata fails closed, stale
  material is a named-rule reject, one dissent disqualifies. The mechanism
  catches bad evidence. This layer exists for the remaining class: **a duty that
  quietly goes unperformed**, which nothing rejects and nothing alarms.
- **The gate is identical everywhere.** Modes, trust paths, first admission and
  re-admission all face the same sixteen rules. This layer differentiates who is
  accountable, never what is required.

## 2. The layer boundary

`artifact-architecture` §1 is deliberate: it builds the mechanism and leaves
alliance governance policy to the alliance, because those are not engineering
questions.

**That boundary does not hold one layer up.** An operating model with no cadence,
no threshold and no service level cannot be run. So this artifact **names the
parameters and states how they combine**, and leaves the values to whoever
ratifies them. Naming is the part that must exist to be runnable; the numbers are
policy.

## 3. Roles — the functions inside each party

The design names four parties. Operating them needs one level down, because most
of these are separately staffed and separately keyed.

| Party | Functions |
|---|---|
| **#1 Issuer** | secretariat (demand pipeline, ballots, mandate) · contract author (⑦) · registrar (⑨, the active count) · root custodian · log operator · core assembler · index operator |
| **#2 Provider** | build and delivery — countersigns, mints L0–L7, assembles and logs the delivery manifest |
| **#3 Signatory** | verification operator — runs the distributable rebuild harness, signs an L8 under its registry identity; and votes on any failure of the contract it signed |
| **#4 Bank** | gate operator (①②③) · app team (④, migrations) · exposure owner (⑤) · second line (risk acceptances, revocation review) |

**Every member is simultaneously #3 and #4.** If one team holds both, that
member's own L8 and its own verdict rest on the same people and the same keys,
and independence is nominal. **Proposed as an invariant:** the verification and
admission functions are separately owned and separately keyed, and the registry
entry carries the verification identity alone. `artifact-ri-fixtures-spec` §3
makes this testable with distinct `bank` and `bank-verify` keys.

## 4. The activities

Twenty-nine. Twenty-three run on a package; six run on timers. Each is one actor
doing one thing that leaves one trace. Full field-by-field register — trigger,
actor, inputs, action, trace, state effect, service level, failure exit — is in
`docs/operating-model.html`; this table is the index.

| | Activity | Actor | Leaves |
|---|---|---|---|
| N1 | nominate | #4 exposure owner | signed interest declaration |
| N2 | second | #1 members | seconding records; backlog is a projection |
| N3 | prioritise | #1 secretariat | ballot record |
| N4 | commission | #1 ballot, or #4 sponsor | signed mandate → `governance.mandateRef` |
| A2 | issue | #1 contract author | signed L-1, digest minted, logged |
| A2a | countersign | #2 provider | countersignature — **the freeze** |
| B1 | build | #2 provider | L0–L7 |
| B2 | hand off | #2 provider | delivery manifest + log inclusion proof |
| C1 | rebuild | #3 each signatory | rebuild result |
| C2 | re-run tests | #3 each signatory | result set |
| C3 | attest | #3 each signatory | signed L8 + observed checkpoint |
| A3 | seal core | #1 core assembler | `coreDigest`, logged |
| A4 | publish | #1 registrar | nexus publication under the contract's trust path |
| D1 | resolve | #4 gate operator (③) | **this bank's L8**, then the sealed envelope |
| D2 | verify | #4 gate operator (①②) | rule-by-rule evaluation |
| D3 | admit | #4 gate operator (④) + app team | signed L9 and verdict; promotion |
| D3a | refuse | #4 gate operator | verdict naming the failing rule |
| D3b | accept risk | #4 second line | signed acceptance against that rule |
| E1 | open exposure | #4 exposure owner (⑤) | `issued` ledger event |
| E2 | review | #4 exposure owner | retire, or nominate a successor |
| E1a | migrate | #4 app team | `retired` event |
| N5 | benefits | #4 exposure owner | record citing `mandateRef` |
| E2a | re-run | #4 gate operator | fresh verdict, same `coreDigest` |
| S1 | trust metadata | #1 root custodian | new metadata version |
| S2 | registry + assignment | #1 registrar (⑨) | entry status, published count |
| S3 | log + checkpoints | #1 log operator | signed tree heads |
| S4 | index reconciliation | #1 index operator | reconciliation record carrying the lag |
| S5 | trust material refresh | #4 gate operator | refreshed directory at a recorded version |
| S6 | ledger reconciliation | #4 exposure owner | discrepancy record |

**A4 has no branch.** Publication is the same act in both modes — the package
goes to the nexus under whichever trust path its contract froze, and the path
never changes afterwards (`noteworthy-solo-distribution`). This was the one
activity whose behaviour differed by governance mode; it no longer does, which
means **no activity in this register branches on mode**.

**Both loops return to N1.** E2's continuation is a **successor project** — a
fresh commissioning decision with its own contract, baseline, CVE set,
signatories and money, carrying over only `osera.line`
(`noteworthy-successor-project`). So it runs the whole pipeline from nomination
rather than re-entering at the ballot. N5's benefits record returns to N1 too,
because it is what argues the next nomination. One re-entry point, two reasons.

**S1–S6 were one activity until the coverage check.** Three issuer functions —
root custodian, log operator, index operator — appeared nowhere else, which meant
one box carried nine duties across six functions on four cadences. A bucket hides
work nobody has been asked to staff.

**N5 has no state machine.** A project ends at Fulfilled, outside. Nothing records
whether the commissioned bridge closed the flaws and moved the applications. It
is proposed here and absent from `artifact-contract-lifecycle`; that gap is
named in `docs/lifecycle.md` under "Not yet in the machines".

## 5. Clocks — two kinds

Conflating these is why an earlier draft read as vague.

### Validity windows — real values, already mechanical

Trust-root snapshot **≤ 7 days** and checkpoint set **≤ 24 hours**, both enforced
at D2 as named-rule rejects and tightenable per bank; TUF metadata expiry, which
fails closed; `deliverBy`, `embargoUntil` and `bridgeExpiry`, frozen at
countersignature. The evidence core has none.

These are **settled, not placeholders** (`noteworthy-bundle-freshness`). They are
a different kind of clock — a validity window the gate checks, rather than a
service level a party is measured against — and marking them TBD alongside the
rest would suggest the gate has an unset parameter, which it does not.

### Service levels — named parameters, values TBD

Nothing in the system rejects anything because a party was slow: a signatory who
never verifies produces no dissent and no failing rule, and the project simply
reaches `deliverBy` and Lapses, where the record is indistinguishable from
provider lateness (`artifact-contract-lifecycle` §2). That is the silent-lapse
class §1 exists to catch, and it needs a measured figure plus an escalation
rather than a rule.

| Parameter | Spans | Owner |
|---|---|---|
| `CADENCE_BALLOT` | nomination → commissioning | alliance |
| `SL_OFFER` | A2 issue → A2a countersign | issuer |
| `SL_VERIFY` | B2 delivered → C3 attested | alliance |
| `SL_SEAL` | Fulfilled → A3 | issuer |
| `SL_RESOLVE` | Verified → envelope sealed | bank |
| `SL_GATE_QUEUE` | D1 → verdict | bank — **measured, no target** |
| `SL_RECONCILE` | S4, S6 | issuer, bank |
| `SL_DRILL` | E2a replay | bank |
| `RELEASE_TRAIN` | admitted → deployed | bank — estate-specific |

All values TBD (`noteworthy-service-level-parameters`). `SL_GATE_QUEUE` carries
no target by design: the review takes as long as the evidence requires, and what
is measured is queue age from Resolved.

### The notice window is computed, never set

```
WINDOW_NOTICE = CADENCE_BALLOT + SL_OFFER + contract.deliverBy
              + SL_VERIFY + SL_SEAL + SL_RESOLVE + SL_GATE_QUEUE
              + RELEASE_TRAIN + BUFFER
```

Its job is to give a **successor project** time to complete before the incumbent
bridge lapses, and a successor runs the whole pipeline — so `CADENCE_BALLOT` is
in the sum and cannot be dropped. Two things the formula makes visible:

- **`CADENCE_BALLOT` dominates.** The window can never be shorter than one ballot
  cycle, so lengthening the cadence lengthens every bridge in the estate — a
  governance decision with an operational cost most participants would not
  otherwise see attached to it.
- **If the sum exceeds what a release train absorbs, that is a finding about the
  path**, not a reason to shorten the notice. Shortening would move the problem
  and put bridges into Sunset with work still in flight.

## 6. Exception paths

**Every contract failure resolves the same way: the contract's signatories vote
on how to proceed** (`noteworthy-failure-vote`). They funded it and they carry
the consequence, which is the same binding that makes them the verifiers. In solo
mode the vote is the sponsor's decision alone — degenerate, and consistent.

**Detection and decision are separate.** Each path below names who *detects and
records*; none of them decides the response.

| Path | Detected by | Terminating record |
|---|---|---|
| **Dissent** | registrar | project frozen at Delivered; investigation, then a vote |
| **Breach** | secretariat | conformance BREACH recorded; vote |
| **Lapse** | secretariat | `deliverBy` passed; vote |
| **Missed service level** | the parameter's owner | measured figure; vote if material |
| **Amendment** | issuer + provider | new contract version, fresh countersignature |
| **Verifier revocation** | registrar + every second line | `verifier-revoked` event; verdicts stand |
| **Root compromise** | co-signers | emergency rotation ceremony |
| **Split view** | log operator | disqualifying; no envelope sealed |
| **Core unavailable** | issuer + bank | a verdict naming a core nobody serves cannot be replayed |

The last four are **trust and infrastructure events rather than contract
failures**, so they do not route to a vote — nothing about them is the
signatories' to decide.

**The vote is a recorded event**, like the commissioning mandate it resembles, so
a project abandoned rather than amended leaves evidence of the decision and not
just of the failure. **The gate is untouched:** no vote promotes a package that
failed a rule, and conformance stays binary
(`noteworthy-conformance-binary`).

## 7. Open — with owners

Three owners, and the distinction is authority rather than difficulty.
**Alliance policy** binds every member. **Bank policy** is internal. **Engineering**
is ours and lands in an artifact. **None of these is settled by this artifact's
acceptance.**

| # | Question | Owner |
|---|---|---|
| 1 | Provider selection criteria. Mechanism already satisfied — the mandate and the contract record the choice | alliance |
| 2 | **Values for every parameter in §5.** The names and the formula are settled; the numbers are not | alliance, issuer, bank per the §5 table |
| 3 | Seconding threshold; ballot weighting basis. **No default offered** — both encode how much influence a contribution buys, which is constitutional rather than operational | alliance |
| 4 | `CADENCE_BALLOT` and whether an emergency route bypasses it. An exploited flaw cannot wait for a scheduled vote | alliance |
| 5 | What a benefits record asserts. Floor: flaws closed and applications migrated, since those weight the next nomination | bank, with an alliance floor |
| 6 | Core hosting and retention; rebuild-input mirroring. The replay claim holds only while both core and envelope are held | engineering (hosting), alliance (retention) |
| 7 | Verification and admission separately keyed, as a membership term | alliance |

**Items 2 and 4 are the same question seen twice.** `CADENCE_BALLOT` is one of
the §5 parameters and the dominant term in the notice window, so setting it is
both an operating value and a governance rhythm. It is listed separately because
the emergency route is a distinct decision from the cadence itself.

**Closed 2026-07-31:** the blessing-petition threshold, by removing the petition
(`noteworthy-solo-distribution`) — not by choosing a number but by noticing that
the thing needing one should not exist. It had been unanswerable because it
quietly depended on item 3, the one place this artifact deliberately proposes
nothing.

Ours alone, and open: whether A2 splits into separate drafting and issuance
activities, given the release-line judgement has its own screen; how demand
formation works for a class-(b) project, since N1 assumes exposure data a new
project does not have; and which activities the reference implementation
exercises — probably the replay drill and the stale-material refusal alone.

**Not ours at any layer:** which organisations sit in the trust-root threshold,
how a verifier is admitted or removed, and the procedure on suspected compromise.
The mechanism is built; no operating model can propose that on a membership's
behalf.

## 8. Relation to the other axes

- `artifact-architecture` — §3.6 fixes who verifies; §3.7 the rules D2 evaluates;
  §9's index/log reconciliation item is answered by S4.
- `artifact-contract-lifecycle` — N1–A2a, the Lapsed ambiguity §5 measures, and
  the three terminal states §6 now gives a route out of.
- `artifact-product-lifecycle` — D1–E1a; §5's formula closes its
  sunset-signalling item, and its renewal loop is a successor project.
- `artifact-evidence-bundle` — A3, A4, D1, and the clock split §1 rests on.
- `artifact-deployment-topology` — the stores every activity writes to.
- `noteworthy-signer-verification`, `noteworthy-adoption-rebuild` — why C1–C3
  bind to signatories and why D1 rebuilds.
- `noteworthy-solo-distribution` — why A4 has no branch.
- `noteworthy-successor-project` — why both loops return to N1.
- `noteworthy-service-level-parameters` — §5.
- `noteworthy-failure-vote` — §6.
