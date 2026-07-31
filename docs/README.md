# Documentation index

What lives here, what lives in the graph, and which one is current when they
disagree.

## The dividing line

If it has an id, a review state and edges, it is a **record** and lives in
`.konspekt/instance/`. If it is written for a reader, it is a **publication** and
lives here.

| | `docs/` (this directory) | `.konspekt/instance/` |
|---|---|---|
| Nature | publications — written to be read | the project's design record |
| Identity | a filename | an id, with provenance and edges |
| Status | current unless filed under `historical/` | explicit `review:` state on every entity |
| Maintained | revised in place | append-only, under `.konspekt/OPERATING.md` |
| Validated in CI | no | yes — `node lib/validate.mjs` |

**The records are canonical.** Where a publication and a record disagree, the
record is current. Records are deliberately *not* copied here: a second copy
drifts, and only the instance is checked by the conformance workflow. Follow the
links.

## Layout

```
lifecycle.md          the complete pass over all three state machines   authored
operating-model.html  who runs it, on what clock, and what it leaves    authored
mockup.html           the lifecycle console's visual target             authored
paper/                Contract-Bound Evidence — sources and scripts     authored
resources/            the working-paper figures (SVG)                   authored
build/                derived outputs, stamped with the commit they
                      were built from and never edited — plus
                      explainer.html, which is authored and its own
                      source                                            mixed
historical/           working-group notes, frozen at reconstruction     archived
```

`build/` is the one directory holding both kinds, and
[`build/README.md`](build/README.md) says which files are which. The distinction
matters because a rebuild overwrites derived files without asking.

## Vocabulary

Fixed by
[`noteworthy-lifecycle-nouns`](../.konspekt/instance/noteworthy/noteworthy-lifecycle-nouns.md)
and applied across the records, the publications here, and the figures:

| Term | Means | Identity |
|---|---|---|
| **Product** | the software library or application being patched or created | version-less purl |
| **Package** | the distribution unit a product ships as | `hardened_digest` |
| **Project** | work on a product within a scope, against one release line | contract digest |
| **Contract** | the L-1 instrument that scopes a project; one per project | its own digest |
| **Line** | the release line a project works against | `lineKey` = version-less purl + `contract.osera.line` |
| **Alliance** | a group of OSERA members; acts as issuer | — |
| **Provider** | whoever works on the product and signs L0–L7 | — |
| **Signatory** | a member that signs and funds a contract, and therefore verifies it | — |
| **Bank** | a member and consumer; runs the gate, rebuilds what it adopts, keeps the ledger | — |

Retired: *candidate* (it spanned three grains), *maker* (now provider),
*mutualized* (now team). The identifier renames that followed: `candidateKey` →
`lineKey`, `candidate-version` → `package-version`, `verdict.candidateRef` →
`packageRef`.

**The rename pass ran on 2026-07-27** across the records, the publications, the
figures and the paper sources. Two things deliberately still carry the old
terms, and both should stay that way:

- **`.konspekt/instance/sources/`** — verbatim content-addressed excerpts whose
  filenames are their blob hashes. Rewriting them would change every hash and
  orphan every `provenance.contentHash` citing them.
- **Amendment notes and `noteworthy-candidate-key`** — documents that *state* a
  rename necessarily contain the term being retired. A blanket substitution
  turns "maker → provider" into "provider → provider" and destroys the record of
  what changed.

Nothing else carries them. This index previously claimed figure 4 was an
outstanding exception; it was not, and the claim was repeated into two other
documents before anyone opened the file. A currency claim about a file is worth
no more than the last time somebody looked.

---

## The design records

Ten artifacts, plus twenty-eight decision records carrying their rejected
alternatives. The design is factored into evidence, project, package/product and
data, with the perimeter interface and the physical topology alongside, and the
operating layer above them all. Read them in this order.

| Artifact | Covers | Review |
|---|---|---|
| [Architecture & Design](../.konspekt/instance/artifacts/artifact-architecture.md) | The integrating overview, and home of the **evidence axis**: the L-1…L9 attestation chain, the anchor problem, who verifies, the 16 admission rules, the gate, the ledger, and the component register. Start here. | accepted |
| [Project lifecycle](../.konspekt/instance/artifacts/artifact-contract-lifecycle.md) | The **project axis**, issuer-side: Drafted through Fulfilled plus three terminals, what Accepted freezes, and amendment as the only route for a shortfall. | accepted |
| [Package and product lifecycles](../.konspekt/instance/artifacts/artifact-product-lifecycle.md) | The two machines that run after the freeze: the digest-keyed **package** machine (Accepted → Built → Adopted, or Rejected) and the lineage-keyed **product** machine (Active, Sunset, Retired), plus the renewal loop. | accepted |
| [Evidence bundle](../.konspekt/instance/artifacts/artifact-evidence-bundle.md) | The **perimeter interface**: the delivery manifest, the issuer-assembled evidence core, and the bank-assembled ingest envelope — what crosses, who seals it, and which clock applies. | accepted |
| [Data model](../.konspekt/instance/artifacts/artifact-data-model.md) | The **records axis**: one schema per state, organized by facets. Immutable content-addressed records versus the append-only operational log and the projections replayed from it. | accepted |
| [Deployment topology](../.konspekt/instance/artifacts/artifact-deployment-topology.md) | The physical stores behind the logical model, and the air-gap cadence. | accepted |
| [Operating model](../.konspekt/instance/artifacts/artifact-operating-model.md) | The **operating layer**: twenty-nine activities with their actors and traces, the roles inside each party, validity windows against service levels, and the eight exception paths. Its §7 values carry owners and are *not* settled by its acceptance. | accepted |
| [Reference implementation scope](../.konspekt/instance/artifacts/artifact-reference-implementation.md) | What the walking skeleton must prove, the in/out boundary, the six build phases, and the acceptance criteria. | accepted |
| [RI fixture spec](../.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md) | The synthetic test corpus: one backpatch with every value fixed, the L0–L9 set, and the known-bad variants each expected to be refused by a named rule. | accepted |
| [Paper outline](../.konspekt/instance/artifacts/artifact-paper-outline.md) | Structure of the working paper. | accepted |

Decisions live under `.konspekt/instance/noteworthy/`, the goals and tasks they
attach to under `.konspekt/instance/nodes/`. The whole graph starts at
[`project.md`](../.konspekt/instance/project.md).

## The lifecycle note

[`lifecycle.md`](lifecycle.md) is the shortest complete pass over the whole
design: the terminology, the commissioning modes, all three machines with their
states and transitions, the perimeter crossing, the gate sequence, and the
renewal rules, written as bullets. It tracks the records and is kept in step with
them.

It closes with **"Not yet in the machines"** — three steps the operating model
proposes that no state machine carries yet, marked as proposals rather than
states so the machines are not read as complete.

## The operating model

[`operating-model.html`](operating-model.html) is the reader-facing form of
`artifact-operating-model`, and the only place the **field-by-field register**
lives: twenty-nine activities, each with its trigger, actor, inputs, action,
trace, state effect, service level and failure exit.

Where `lifecycle.md` answers *what states exist*, this answers **who is on the
hook, by when, and what the activity leaves behind**. The two are complementary
and deliberately not merged: a state machine and a duty register age differently,
and the duty register carries values that are somebody else's to ratify.

Its section eight marks every unsettled value with the party that settles it —
alliance policy, bank policy, or engineering. **One of them is live**: the
blessing-petition threshold, which `lifecycle.md` currently refers to without a
value, because it borrowed a number that stopped existing when the quorum became
the signatory set.

## The paper

[`paper/`](paper/) holds *Contract-Bound Evidence*, a working draft for the
formation working group: four parts plus front matter and appendices, assembled
by `assemble.py` into a single document and converted onward by `mkdocx.js`.

The **sources** are current as of 2026-07-30. The **built outputs** in
[`build/`](build/) predate both the rename pass and the signatory-verification
amendments, so they are stale twice over and must be regenerated before anything
is circulated. They are a projection over the parts — rebuild rather than edit
(`noteworthy-authoritative-form`).

Appendix B deliberately carries no rule count or enumeration. The ruleset is
numbered in exactly one place, Architecture §3.7, because a count printed in
prose drifts from the record it summarises — which is precisely what happened to
that appendix before 2026-07-30.

## The three visual documents

Each addresses a different reader, and the differences are deliberate.

| | For | Shows |
|---|---|---|
| [`build/explainer.html`](build/explainer.html) | someone meeting the design for the first time | the whole model, then one package walked through every state of it, in plain language with the technical term demoted to a chip |
| [`mockup.html`](mockup.html) | whoever builds the lifecycle console (⑥) | four screens at the moments they carry the most information — the board, the decision, the exposure table, the history |
| [`resources/`](resources/) | a reader of the paper | four figures: lifecycle and zones, the data model, the architecture, the physical topology |

The explainer and the mockup overlap by design: the explainer sets up the model
and then uses the mockup's screens as its worked example, so the screens arrive
with the vocabulary already established. `explainer.pdf` beside it is that
document as rendered.

The mockup realizes
[`task-lifecycle-mockup`](../.konspekt/instance/nodes/task/task-lifecycle-mockup.md)
and feeds [`task-lifecycle-ui`](../.konspekt/instance/nodes/task/task-lifecycle-ui.md).
Two gaps against its own brief, stated on the page itself: the refusal case is
not yet drawn, and it still uses `candidateKey`.

## Figures

[`resources/`](resources/) carries the working-paper figures, indexed in
[`resources/README.md`](resources/README.md). All four are current as of
2026-07-30.

| Figure | State |
|---|---|
| `p1-lifecycle.svg` | **current** — redrawn 2026-07-30: every signatory's L8, the bank's rebuild at Resolved, the core crossing |
| `p2-datamodel.svg` | **current** — redrawn 2026-07-30: `signatories[]`, rebuild references, L8 on both sides |
| `p3-architecture.svg` | **current** — redrawn 2026-07-30: co-funding as the launch prerequisite, core + envelope, ③ rebuilds |
| `code-tracer-topology.svg` | **current** — redrawn 2026-07-30: the evidence core added, two containers at the perimeter |

## The archive

[`historical/`](historical/) holds the five working-group documents, frozen at
the point they were reconstructed on 2026-07-17. Their **content** is historical,
including its recovery gaps; their **vocabulary** is current. Which record
supersedes each of them is listed in
[`historical/README.md`](historical/README.md), and the two whose
*recommendations* were overturned carry a supersession note at the top of the
file itself — a stale recommendation is more misleading than a stale fact.

They are kept rather than deleted because the recovery notes are themselves part
of the record: quietly reconstructing a missing section would destroy the
evidence that it was ever missing.

## Reading paths

**"What is this project?"** — the [root README](../README.md), then
[`build/explainer.html`](build/explainer.html) if you would rather be shown than
told.

**"How does the whole thing run, start to finish?"** — [`lifecycle.md`](lifecycle.md),
then `resources/p1-lifecycle.svg`.

**"Who actually does this, and on what clock?"** —
[`operating-model.html`](operating-model.html), then its section eight for what
is still somebody's to decide.

**"Why is it built this way?"** — the paper, in order. Part I for the model,
Part II for who commissions and who verifies, Part III for what a bank deploys,
Part IV for what it does not do.

**"How does admission actually work?"** — Architecture §3.5 for how the contract
binds the chain, §3.7 for the sixteen rules, §4 for the gate. Then
[`historical/osera-bank-verification.md`](historical/osera-bank-verification.md)
for the original framing of why no new verification mechanism is needed.

**"What are we building, and how far along?"** —
[RI scope](../.konspekt/instance/artifacts/artifact-reference-implementation.md)
for the phases and acceptance criteria, then
[the fixture spec](../.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md)
for what Phase 0 emits.

**"What is still unresolved?"** — Architecture §9, the operating model's section
eight for values with owners, plus the open-items section that closes each
artifact.
