# Documentation index

Design material for code_tracer lives in two places, and the difference matters.

| | `docs/` (this directory) | `.konspekt/instance/artifacts/` |
|---|---|---|
| Audience | the FINOS OSERA working group | this project |
| Nature | standalone design notes | the project's own design record |
| Status | **drafts, partially reconstructed** | current, with an explicit review state |
| Maintained | frozen unless the group revisits them | continuously, under `.konspekt/OPERATING.md` |
| Validated in CI | no | yes — `node lib/validate.mjs` |

**The artifacts are canonical.** Where the two disagree, the artifact is current
and the note is historical. They are deliberately *not* copied here: a second
copy drifts, and only the instance is checked by the conformance workflow. Follow
the links.

## Vocabulary

Fixed by
[`noteworthy-lifecycle-nouns`](../.konspekt/instance/noteworthy/noteworthy-lifecycle-nouns.md)
and applied across the artifacts and the lifecycle note:

| Term | Means | Identity |
|---|---|---|
| **Product** | the software library or application being patched or created | version-less purl |
| **Package** | the distribution unit a product ships as | `hardened_digest` |
| **Project** | work on a product within a scope, against one release line | contract digest |
| **Contract** | the L-1 instrument that scopes a project; one per project | its own digest |
| **Line** | the release line a project works against | `lineKey` = version-less purl + `contract.osera.line` |
| **Alliance** | a group of OSERA members; acts as issuer | — |
| **Provider** | whoever works on the product and signs L0–L7 | — |
| **Bank** | a member and consumer; runs the gate and the ledger | — |

Retired: *candidate* (it spanned three grains), *maker* (now provider),
*mutualized* (now team). The four working-group notes below predate this and
still use the old terms.

**The rename pass has not run.** `noteworthy-lifecycle-nouns` deferred the
identifier churn so the reasoning could land first, and that pass is still
outstanding. Today only `osera-lifecycle.md`, `resource/p1-lifecycle.svg` and
this table use the new terms; the artifacts themselves — including
`artifact-architecture` — still say *maker*, *mutualized* and *candidate*
throughout. Until the pass runs across the graph and these notes together, the
vocabulary above describes the decision rather than the state of the repository.

---

## The design artifacts

The design is factored into evidence, project, package/product, and records, plus
the interface between the two sides and the scope of the implementation that
realizes them. Read them in this order.

| Artifact | Covers | Review |
|---|---|---|
| [Architecture & Design](../.konspekt/instance/artifacts/artifact-architecture.md) | The integrating overview, and home of the **evidence axis**: the L-1…L9 attestation chain, the anchor problem, the k-of-n quorum, admission policy, the gate, the ledger, and the component register. Start here. | accepted |
| [Project lifecycle](../.konspekt/instance/artifacts/artifact-contract-lifecycle.md) | The **project axis**, issuer-side: Drafted through Fulfilled plus three terminals, what Accepted freezes, and amendment as the only route for a shortfall. | accepted |
| [Package and product lifecycles](../.konspekt/instance/artifacts/artifact-product-lifecycle.md) | The two machines that run after the freeze: the digest-keyed **package** machine (Built → Adopted, or Rejected) and the lineage-keyed **product** machine (Active, Sunset, Retired), plus the renewal loop. | accepted |
| [Evidence bundle](../.konspekt/instance/artifacts/artifact-evidence-bundle.md) | The **perimeter interface**: the delivery manifest, the issuer-assembled evidence core, and the bank-assembled ingest envelope — what crosses, who seals it, and which clock applies. | accepted |
| [Data model](../.konspekt/instance/artifacts/artifact-data-model.md) | The **records axis**: one schema per state, organized by facets. Immutable content-addressed records versus the append-only operational log and the projections replayed from it. | accepted |
| [Deployment topology](../.konspekt/instance/artifacts/artifact-deployment-topology.md) | The physical stores behind the logical model, and the air-gap cadence. | accepted |
| [Reference implementation scope](../.konspekt/instance/artifacts/artifact-reference-implementation.md) | What the walking skeleton must prove, the in/out boundary, the six build phases, and the acceptance criteria. | accepted |
| [RI fixture spec](../.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md) | The synthetic test corpus: one backpatch with every value fixed, the L0–L9 set, and the known-bad variants each expected to be refused by a named rule. **A living draft** — open items in §9. | proposed |
| [Paper outline](../.konspekt/instance/artifacts/artifact-paper-outline.md) | Structure of the working paper. | accepted |

Decisions with their rejected alternatives are recorded separately under
`.konspekt/instance/noteworthy/`, and the goals and tasks they attach to under
`.konspekt/instance/nodes/`. The whole graph starts at
[`project.md`](../.konspekt/instance/project.md).

## The lifecycle note

[Lifecycle](osera-lifecycle.md) is the one note here that is **current rather
than historical**: a step-by-step synthesis of the three machines with the
terminology, the commissioning modes, the perimeter crossing, the gate sequence,
and the renewal rules, written as bullets. It tracks the artifacts rather than
the working group, and is kept in step with them. Shortest complete pass over
the whole design.

## The working-group notes

Written for the OSERA formation working group rather than for this repository.
Each was **reconstructed on 2026-07-17** from design conversations that were not
persisted, and each carries a provenance note naming the sections that survived
intact and those that are partial. Treat the marked sections as incomplete, and
read them against the vocabulary table above: all four predate it.

| Note | Covers |
|---|---|
| [Backpatch contract](osera-backpatch-contract.md) | The **L-1 contract** — the binding artifact that scopes a job before work starts and becomes the root everything else is verified against. Includes the machine-readable schema. Cited by the fixture spec. Superseded on partial fulfilment: its §6 item 2 recommends PARTIAL-promotable, which `noteworthy-conformance-binary` rejected. |
| [Bank-side fulfilment verification](osera-bank-verification.md) | How a bank verifies a contract was *fulfilled* before ingesting code — and the finding the whole design rests on: the bank needs no new verification mechanism, because the contract compiles to a layout its existing in-toto verifier already enforces. |
| [Attestation chain](osera-attestation-chain.md) | The L0–L9 chain, core principles, the anchor problem, admission rules, and quorum verification. **Superseded** — now inlined and extended as [Architecture §3](../.konspekt/instance/artifacts/artifact-architecture.md), which carries 16 rules to this note's 13; kept for the working-group framing and its open questions. |
| [Standards register](osera-standards-register.md) | Standards, formats and protocols across the lifecycle, with the load-bearing ones starred. §6–§9 are partial, and the Maven-specific framing is generalized by `noteworthy-ecosystem-generalization`. |
| [Bank schematic](osera-bank-schematic.svg) | Diagram of the ingestion path. Predates the split; still draws the single machine. |

These five also name the provider as **Moderne** throughout, which the diagram
set and the artifacts have since replaced with the role name. That is left
standing: they are a record of the working-group framing at a date, not live
documents.

## Figures

`resource/` carries the working-paper figures. Four views, indexed in
[`resource/README.md`](resource/README.md).

| Figure | State |
|---|---|
| `p1-lifecycle.svg` | **current** — redrawn for the three machines, three bands with their identities, hinge and handover labelled. One stale label: it still reads *15 rules* |
| `p2-datamodel.svg` | pending — still names `candidate-version` and `candidateKey` |
| `p3-architecture.svg` | pending — the component map is current, but it names the provider as *maker*, a console screen as *candidate*, and *15 admission rules* |
| `code-tracer-topology.svg` | pending — the store map is current, but it names the provider as *maker* and the quarantine subject as *candidate* |

`paper/` holds the working paper: the `part-*.md` sources and the built outputs
(HTML, DOCX, PDF). **Both** predate the vocabulary reconciliation, so
regenerating alone will not fix the terms — the sources need the rename pass
first. See the vocabulary table above for what changes.

## The mockup

[`lifecycle-mockup.html`](../lifecycle-mockup.html) at the repository root is the
visual target for the lifecycle console (⑥) — one fix walked across the whole
state machine, in labels written for a reader who has never heard of OSERA. It
realizes [`task-lifecycle-mockup`](../.konspekt/instance/nodes/task/task-lifecycle-mockup.md)
and feeds [`task-lifecycle-ui`](../.konspekt/instance/nodes/task/task-lifecycle-ui.md).

Two gaps against its own brief: the refusal case is not yet drawn, and it still
uses `candidateKey`.

## Reading paths

**"What is this project?"** — the [root README](../README.md), then
[Architecture](../.konspekt/instance/artifacts/artifact-architecture.md).

**"How does the whole thing run, start to finish?"** —
[Lifecycle](osera-lifecycle.md), then `resource/p1-lifecycle.svg`.

**"How does admission actually work?"** —
[Backpatch contract](osera-backpatch-contract.md) for what is agreed, then
[Bank-side verification](osera-bank-verification.md) for how it is checked, then
Architecture §4 for the gate.

**"What are we building, and how far along?"** —
[RI scope](../.konspekt/instance/artifacts/artifact-reference-implementation.md)
for the phases and acceptance criteria, then
[the fixture spec](../.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md)
for what Phase 0 emits.

**"What is still unresolved?"** — Architecture §9, plus the open-items section
that closes each artifact.
