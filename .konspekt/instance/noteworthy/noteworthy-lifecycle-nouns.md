```yaml
id: noteworthy-lifecycle-nouns
type: noteworthy
title: Decision — lifecycle nouns (product / package / project); candidate retired
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-lifecycle-terminology
  sourceRef: 211cfdf6564f021b5d599490b1c50d472e58487d
  contentHash: 211cfdf6564f021b5d599490b1c50d472e58487d
  timestamp: 2026-07-26T14:00:00Z
createdAt: 2026-07-26T14:00:00Z
updatedAt: 2026-07-27T00:00:00Z
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

**Cost.** Identifier churn, deferred to a separate pass so that the reasoning
lands before the rename does. Both halves are now settled: `candidateKey` is
product-grain and becomes **`lineKey`** (`noteworthy-candidate-key`, amended);
`candidate-version` is package-grain and becomes **`package-version`**
(amendment below).

---

## Amendment 2026-07-27 — `candidate-version` becomes `package-version`

**Decision.** The digest-keyed immutable record — one row per hardened artifact,
carrying the purl, its contract reference, the L0–L9 chain and the `supersedes`
pointer — is **`package-version`**.

**Why.** The replacement is judged on one test, the same one `lineKey` passed:
can a reader who meets the identifier cold tell which grain it belongs to? That
is the whole reason *candidate* was retired. `package-version` names one of the
four fixed nouns directly and so inherits its definition — a package is the
distribution unit identified by `hardened_digest`, and this record is one version
of one. The pair also reads correctly against the settled half: `lineKey` names
the product grain, `package-version` the package grain, so a `ledger-row` keyed
`(appId, lineKey)` pointing at a `package-version` announces both grains without
explanation. The `-version` suffix carries the over-time dimension the supersedes
chain needs: the package persists, and `osera.1 → osera.2` are versions of it.

**Rejected: `release`.** Three faults, the first decisive.

- **It collides with vocabulary already load-bearing.** *Project* is defined as
  work against one **release line**, and `lineKey` derives from
  `contract.osera.line`. Adopting `release` for the digest grain puts *release*
  and *release line* in adjacent sentences denoting opposite grains — the exact
  confusion this decision exists to remove, in new clothes.
- **It is overloaded per ecosystem.** Maven separates release from snapshot,
  GitHub has Releases as an API object, npm and PyPI use it for a published
  version. The design is agnostic by purl type, so a word meaning something
  different in each target ecosystem is a liability where it is read most.
- **It names the wrong aspect.** A release is a publishing event; this record is
  a frozen identity that exists from Built onward — including for packages that
  fail the gate, terminate at Rejected, and are released to nothing.

Also considered and dropped: `artifact-version` (*artifact* is triple-booked —
konspekt artifacts, in-toto artifacts, the jar), `build` (names the process; L3
already owns build provenance), and bare `package` (loses the over-time
dimension).

**Cost.** Length, at every occurrence. If it bites in code, settle on
`pkgVersion` for identifiers and `package-version` in prose once, rather than
drifting into both.

**Binds:** renames `candidate-version` → `package-version` in
`artifact-data-model` §4–§5, `resource/p2-datamodel.svg`,
`artifact-ri-fixtures-spec`, the `artifact-architecture` cross-references, and
`lifecycle-mockup.html`. **Resolves:** the identifier rename pass is now fully
specified and unblocked.

---

**Binds:** splits `artifact-product-lifecycle` §2–§3 into package-grain and
product-grain machines and removes Commissioned; retitles
`artifact-contract-lifecycle` to the project axis; renames the role in
`artifact-architecture` §3.3 and the mode in §1; renames `candidate-version` and
`candidateKey` in `artifact-data-model` §4–§5.
**Resolves:** the vocabulary drift between `docs/osera-lifecycle.md` and the
graph.
**Open:** whether a product that ships as several packages needs a key above
`lineKey` — one backpatch touching three modules currently yields three lineages
for one project.
