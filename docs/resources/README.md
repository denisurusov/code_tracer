# docs/resource — diagram set

Four views of the same system. Each answers one question; none repeats another.
Rendered from the SVG sources here; regenerate PNGs with any SVG renderer.

| Page | Question it answers | Read when |
|---|---|---|
| `p1-lifecycle.svg` | **What states exist, and where is the boundary?** Three machines at three grains — project (a commitment), package (an artifact), product (a bridge) — split at the bank perimeter. Renewal loop, terminals, the hinge and the handover. | first |
| `p2-datamodel.svg` | **Which attribute binds to which?** L-1 contract fields on the left, evidence chain in the middle, bank records on the right. Every orange arrow is an admission rule in disguise. | second |
| `p3-architecture.svg` | **What are the components and what do they touch?** Nine components across issuer and consumer sides, stores in one line each, the five properties everything serves. Assumes p1 and p2. | third |
| `code-tracer-topology.svg` | **Where do the bytes physically live?** Store-by-store read/write map — which are ours, which are third-party services, which are files in git. Companion to `artifact-deployment-topology`. | when deploying |

## Conventions used across the set

- **Red border** — a component we build (①–⑨). Everything else is integrated or
  someone else's infrastructure.
- **W:** what is written into a store (or, for an actor, what it writes out).
  **R:** what is read from it.
- Solid arrow = write path · dashed = read path · green = the admitted artifact.
- Actors are named by **role** — provider, verifier, issuer, bank — never by company.

## Provenance

These are generated views over the accepted konspekt instance under
`.konspekt/instance/`, not independent sources. Where a diagram and an artifact
disagree, **the artifact wins** and the diagram is stale. The artifacts each
diagram draws from:

- p1 — `artifact-contract-lifecycle`, `artifact-product-lifecycle`
- p2 — `artifact-data-model`, `artifact-architecture` §3
- p3 — `artifact-architecture` §4–§7
- topology — `artifact-deployment-topology`

The earlier `docs/osera-bank-schematic.svg` is a **reconstructed historical**
diagram from the origins conversation. It is superseded by this set for current
work but retained as a record of the original framing.
