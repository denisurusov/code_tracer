```yaml
id: artifact-operating-model
type: artifact
title: code_tracer — Operating model (who runs it, on what clock)
status: active
review: proposed
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-30T00:00:00Z
createdAt: 2026-07-30T00:00:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# code_tracer — Operating model

**Status: `review: proposed`.** The operating layer above the design axes. The
four axes say what the system means, `artifact-evidence-bundle` says what crosses
the perimeter, and `artifact-deployment-topology` says where the bytes live. None
of them says **who is on the hook, by when, and what each activity leaves
behind.**

Reader-facing companion: `docs/operating-model.html`.

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
no threshold and no service level cannot be run. So this artifact **proposes
values and names who ratifies each**. What it never does is present a proposed
value as a ratified one: §7 marks every unsettled value with its owner.

## 3. Roles — the functions inside each party

The design names four parties. Operating them needs one level down, because most
of these are separately staffed and separately keyed.

| Party | Functions |
|---|---|
| **#1 Issuer** | secretariat (demand pipeline, ballots, mandate) · contract author (⑦) · registrar (⑨, the active count) · root custodian · log operator · core assembler · index operator |
| **#2 Provider** | build and delivery — countersigns, mints L0–L7, assembles and logs the delivery manifest |
| **#3 Signatory** | verification operator — runs the distributable rebuild harness, signs an L8 under its registry identity |
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
| A4 | publish | #1 registrar / secretariat | nexus publication; petition where solo |
| D1 | resolve | #4 gate operator (③) | **this bank's L8**, then the sealed envelope |
| D2 | verify | #4 gate operator (①②) | rule-by-rule evaluation |
| D3 | admit | #4 gate operator (④) + app team | signed L9 and verdict; promotion |
| D3a | refuse | #4 gate operator | verdict naming the failing rule |
| D3b | accept risk | #4 second line | signed acceptance against that rule |
| E1 | open exposure | #4 exposure owner (⑤) | `issued` ledger event |
| E2 | review | #4 exposure owner | retire or renew decision |
| E1a | migrate | #4 app team | `retired` event |
| N5 | benefits | #4 exposure owner | record citing `mandateRef` |
| E2a | re-run | #4 gate operator | fresh verdict, same `coreDigest` |
| S1 | trust metadata | #1 root custodian | new metadata version |
| S2 | registry + assignment | #1 registrar (⑨) | entry status, published count |
| S3 | log + checkpoints | #1 log operator | signed tree heads |
| S4 | index reconciliation | #1 index operator | reconciliation record carrying the lag |
| S5 | trust material refresh | #4 gate operator | refreshed directory at a recorded version |
| S6 | ledger reconciliation | #4 exposure owner | discrepancy record |

**Two loops, different meanings.** E2's renewal re-enters at N4, because the
lineage was already voted in and a continuation carries the same `osera.line`.
N5 re-enters at N1, because benefits data is what argues the next nomination.

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

**Validity windows** — already mechanical, this layer adds only an owner:
trust-root snapshot ≤ 7 days and checkpoint set ≤ 24 hours, both enforced at D2
as named-rule rejects and tightenable per bank; TUF metadata expiry, which fails
closed; `deliverBy`, `embargoUntil` and `bridgeExpiry`, frozen at
countersignature. The evidence core has none.

**Service levels** — measured, and mostly unset. Nothing in the system rejects
anything because a party was slow: a signatory who never verifies produces no
dissent and no failing rule, and the project simply reaches `deliverBy` and
Lapses, where the record is indistinguishable from provider lateness
(`artifact-contract-lifecycle` §2). That is the silent-lapse class §1 exists to
catch, and it needs a measured figure plus an escalation rather than a rule.

Proposed: verification within 5 business days of Delivered; core sealed same-day
at Fulfilled; index reconciliation lag ≤ 24 hours; registry attestation monthly;
ledger reconciliation monthly; replay drill twice yearly. **The gate carries no
decision deadline** — review takes as long as the evidence requires — but queue
age from Resolved is measured.

**The notice window at E2 is derived, not chosen.** It must cover the whole
renewal path — commission, deliver, verify, admit, deploy — so it is the sum of
those service levels plus buffer. Picking a number first and hoping the path fits
inverts the dependency; if the sum exceeds what a release train absorbs, that is
a finding about the path.

## 6. Exception paths

Eight, each with a trigger, an owner and a terminating record. None is performed
on a normal day, so they attach to activities as exits rather than appearing in
§4: **dissent** (registrar; freeze at Delivered, investigate reproducibility
before conformance) · **breach** and **lapse** (secretariat; terminal) ·
**amendment** (issuer + provider; the only route by which a shortfall reaches
admission honestly) · **verifier revocation** (registrar + every second line;
verdicts stand, pinned to their `trustRootVersion`) · **root compromise**
(co-signers; emergency ceremony) · **split view** (log operator; disqualifying,
no envelope sealed) · **core unavailable** (issuer + bank; a verdict naming a core
nobody serves cannot be replayed — the retention question).

## 7. Open — with owners

Three owners, and the distinction is authority rather than difficulty.
**Alliance policy** binds every member. **Bank policy** is internal. **Engineering**
is ours and lands in an artifact.

| # | Value | Owner | Proposed |
|---|---|---|---|
| 1 | Provider selection criteria | alliance | ballot selects in team mode, sponsor in solo; the mandate names the choice either way. Mechanism already satisfied — the contract records it |
| 2 | Service levels, then the derived notice window | alliance (verification), issuer (offer), bank (notice) | §5 |
| 3 | Seconding threshold; ballot weighting basis | alliance | **none offered** — both encode how much influence a contribution buys, which is constitutional rather than operational |
| 4 | Ballot cadence and the emergency route | alliance | a regular cadence plus standing emergency authority with later ratification; an exploited flaw cannot wait for a scheduled vote |
| 5 | What a benefits record asserts | bank, with an alliance floor | floor: flaws closed and applications migrated, since those weight the next ballot |
| 6 | Core hosting and retention; rebuild-input mirroring | engineering (hosting), alliance (retention) | the replay claim holds only while both core and envelope are held |
| 7 | Verification and admission separately keyed | alliance (membership term) | §3. Engineering hook exists either way |
| 8 | Blessing-petition threshold | alliance | **unset and live** — it borrowed "the quorum threshold", which stopped naming a number when `k` became the signatory set. `docs/lifecycle.md` currently refers to a threshold with no value |

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
- `artifact-contract-lifecycle` — N1–A2a and the Lapsed ambiguity §5 measures.
- `artifact-product-lifecycle` — D1–E1a; the derived notice window closes its
  sunset-signalling item.
- `artifact-evidence-bundle` — A3, A4, D1, and the clock split §1 rests on.
- `artifact-deployment-topology` — the stores every activity writes to.
- `noteworthy-signer-verification`, `noteworthy-adoption-rebuild` — why C1–C3
  bind to signatories and why D1 rebuilds.
