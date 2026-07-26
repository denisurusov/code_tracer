```yaml
id: noteworthy-lifecycle-nouns
type: noteworthy
title: Decision — lifecycle nouns (product / package / project); candidate retired
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-26T14:00:00Z
provenance:
  conversationId: konspekt-lifecycle-terminology
  sourceRef: 211cfdf6564f021b5d599490b1c50d472e58487d
  contentHash: 211cfdf6564f021b5d599490b1c50d472e58487d
  timestamp: 2026-07-26T14:00:00Z
createdAt: 2026-07-26T14:00:00Z
updatedAt: 2026-07-26T14:00:00Z
```
# Decision: lifecycle nouns (product / package / project); candidate retired

**Decision.** The design names four things, and each state in the lifecycle
belongs to exactly one of them:

- **Product** — the software library or application being patched or created.
- **Package** — the distribution unit a product ships as, named by `purl`. The
  technical identity the attestation chain binds to.
- **Project** — work on a product within a particular scope, against one release
  line. One project, one contract.
- **Contract** — the L-1 instrument that scopes a project. It controls project
  scope among other things; the project is what has a lifecycle.

Cardinality: product 1:N project, project 1:1 contract, project 1:1 package.

**`candidate` is retired.** It was a single word spanning three grains:

| Former candidate state | Grain | Keyed by |
|---|---|---|
| Commissioned | project | contract digest |
| Built, Verified, Resolved, Gate, Adopted, Rejected | package | `hardened_digest` |
| Active, Sunset, Retired | product | lineage (version-less purl + `osera.line`) |

**Commissioned is dropped as a duplicate.** `artifact-contract-lifecycle` §1
already names Accepted as the state that emits Commissioned; the two describe one
moment under two names. The package machine now opens at **Accepted → Built**.

**Adopted is the handover, and sits on the package side.** It mints L9 over a
digest (package-grain) and opens the exposure row (product-grain). Assigning it
to the package machine puts the grain seam exactly where `artifact-data-model`
§2 already draws it — immutable rows born Commissioned→Gate, mutable rows living
Adopted→Sunset.

**The tell was `candidateKey`.** It is defined as version-less purl +
`contract.osera.line` (`noteworthy-candidate-key`) precisely because the
operational half needs a handle that survives renewals. That is a product-grain
key, introduced while the states were still called candidate — the model had
already split, without the vocabulary following.

**Two renames, same reconciliation.**

- **maker → provider.** Whoever works on the product and signs L0–L7 against a
  contract it countersigned. Supersedes the role name fixed in
  `noteworthy-ecosystem-generalization`; the role itself is unchanged.
- **mutualized → team.** The commissioning mode where members vote collectively
  and verification is an enforced duty. Supersedes the mode name in
  `noteworthy-governance-modes`; `governance.mode` values change accordingly.

**Why this over keeping candidate.** A word that spans three grains hides the one
distinction the operational side depends on: whether a fact attaches to a digest
or to a lineage. Every renewal question — what was in force in March, which line
does this continue, does the supersedes edge agree — is a product-grain question
answered against package-grain records, and naming both "candidate" is what made
that hard to see. The split also removes a duplicate state and gives the second
and third machines the same naming form as the first.

**Cost.** Identifier churn: `candidateKey` is product-grain and wants a name such
as `bridgeKey` or `lineKey`; `candidate-version` is package-grain and wants
`package-version` or `release`. Deferred to a separate pass so that the reasoning
lands before the rename does.

**Binds:** splits `artifact-product-lifecycle` §2–§3 into package-grain and
product-grain machines and removes Commissioned; retitles
`artifact-contract-lifecycle` to the project axis; renames the role in
`artifact-architecture` §3.3 and the mode in §1; renames `candidate-version` and
`candidateKey` in `artifact-data-model` §4–§5.
**Resolves:** the vocabulary drift between `docs/osera-lifecycle.md` and the
graph.
**Open:** the identifier rename pass, and whether a product that ships as several
packages needs a key above `candidateKey` — one backpatch touching three modules
currently yields three lineages for one project.
