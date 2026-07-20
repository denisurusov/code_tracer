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

---

## The design artifacts

The design is factored into three axes — evidence, product, and records — plus
the scope of the implementation that realizes them. Read them in this order.

| Artifact | Covers | Review |
|---|---|---|
| [Architecture & Design](../.konspekt/instance/artifacts/artifact-architecture.md) | The integrating overview, and home of the **evidence axis**: the L-1…L9 attestation chain, the anchor problem, the k-of-n quorum, admission policy, the gate, the ledger, and the component register. Start here. | accepted |
| [Product lifecycle](../.konspekt/instance/artifacts/artifact-product-lifecycle.md) | The **product axis**: the candidate state machine from Commissioned to Sunset, the outside/inside boundary, and why a renewal is a superseding record rather than a status change. | accepted |
| [Data model](../.konspekt/instance/artifacts/artifact-data-model.md) | The **records axis**: one schema per state, organized by facets. Immutable content-addressed records versus the append-only operational log and the projections replayed from it. | accepted |
| [Reference implementation scope](../.konspekt/instance/artifacts/artifact-reference-implementation.md) | What the walking skeleton must prove, the in/out boundary, the six build phases, and the acceptance criteria. | accepted |
| [RI fixture spec](../.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md) | The synthetic test corpus: one backpatch with every value fixed, the L0–L9 set, and the known-bad variants each expected to be refused by a named rule. **A living draft** — open items in §9. | proposed |

Decisions with their rejected alternatives are recorded separately under
`.konspekt/instance/noteworthy/`, and the goals and tasks they attach to under
`.konspekt/instance/nodes/`. The whole graph starts at
[`project.md`](../.konspekt/instance/project.md).

## The working-group notes

Written for the OSERA formation working group rather than for this repository.
Each was **reconstructed on 2026-07-17** from design conversations that were not
persisted, and each carries a provenance note naming the sections that survived
intact and those that are partial. Treat the marked sections as incomplete.

| Note | Covers |
|---|---|
| [Backpatch contract](osera-backpatch-contract.md) | The **L-1 contract** — the binding artifact that scopes a job before work starts and becomes the root everything else is verified against. Includes the machine-readable schema. Cited by the fixture spec. |
| [Bank-side fulfilment verification](osera-bank-verification.md) | How a bank verifies a contract was *fulfilled* before ingesting code — and the finding the whole design rests on: the bank needs no new verification mechanism, because the contract compiles to a layout its existing in-toto verifier already enforces. |
| [Attestation chain](osera-attestation-chain.md) | The L0–L9 chain, core principles, the anchor problem, admission rules, and quorum verification. **Superseded** — now inlined and extended as [Architecture §3](../.konspekt/instance/artifacts/artifact-architecture.md); kept for the working-group framing and its open questions. |
| [Standards register](osera-standards-register.md) | Standards, formats and protocols across the lifecycle, with the load-bearing ones starred. §6–§9 are partial. |
| [Bank schematic](osera-bank-schematic.svg) | Diagram of the ingestion path. |

## The mockup

[`lifecycle-mockup.html`](../lifecycle-mockup.html) at the repository root is the
visual target for the lifecycle console (⑥) — one fix walked across the whole
state machine, in labels written for a reader who has never heard of OSERA. It
realizes [`task-lifecycle-mockup`](../.konspekt/instance/nodes/task/task-lifecycle-mockup.md)
and feeds [`task-lifecycle-ui`](../.konspekt/instance/nodes/task/task-lifecycle-ui.md).

Incomplete against its own brief: the refusal case is not yet drawn.

## Reading paths

**"What is this project?"** — the [root README](../README.md), then
[Architecture](../.konspekt/instance/artifacts/artifact-architecture.md).

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
