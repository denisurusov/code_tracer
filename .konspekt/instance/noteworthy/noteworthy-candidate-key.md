```yaml
id: noteworthy-candidate-key
type: noteworthy
title: Decision — lineKey (bridge lineage, line declared in L-1)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-26T18:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: d52387ff30f91edbbcfbd34f44095c034df02adb
  contentHash: d52387ff30f91edbbcfbd34f44095c034df02adb
  timestamp: 2026-07-17T19:20:00Z
createdAt: 2026-07-17T19:20:00Z
updatedAt: 2026-07-26T18:00:00Z
```
# Decision: lineKey (bridge lineage, line declared in L-1)

> **Amendment 2026-07-26 (`noteworthy-lifecycle-nouns`).** The field was named
> `candidateKey` when the states it served were called candidate states. That
> noun is retired, and this key is product-grain: **`candidateKey` → `lineKey`**.
> Semantics are unchanged; only the name moves.
>
> `bridgeKey` was rejected. A *bridge* is a temporary hardening with a sunset
> date, which is class (a) only — class (b) FINOS-native carries the same key
> shape with ordinary releases rather than bridges, so `bridgeKey` would be
> accurate for half the ingest. `projectKey` was rejected because the key is
> deliberately constant across renewals while each renewal is a *new* project;
> a project's identity is its contract digest.
>
> The entity id `noteworthy-candidate-key` is retained: it is the graph handle
> the edge table references, and renaming it would orphan those edges.

**Decision.**

```
lineKey = <version-less upstream purl> + contract.osera.line
        # e.g. pkg:maven/org.apache.commons/commons-collections?osera.line=3
```

`lineKey` is the stable handle the mutable side uses to name one **bridge
lineage** as it moves and renews. It is:

- **Constant across the supersedes chain.** `osera.1` and `osera.2` are distinct
  package records (different digests/contracts, possibly a rebased baseline)
  but the same ongoing bridge; the `state-pointer` and `ledger` follow that
  continuity. `lineKey` identifies neither the artifact (that is the digest)
  nor a single version — it identifies the lineage.
- **Line-qualified.** A 3.x bridge and a 4.x bridge for the same package are
  different lineages with different keys. A renewal that jumps lines (3.x → 4.x)
  is correctly a *new* lineage: the old line Retires, and a new one starts with
  a fresh project.
- **App-free.** `app` is deliberately not in the key: a bridge is built,
  verified, and admitted once regardless of how many apps adopt it. The per-app
  dimension lives only in the ledger: `ledger-row` key = `(appId, lineKey)`.
  `state-pointer` key = `lineKey`.

**Where it sits in the identity set.** Four grains, four identities — the whole
reason this key needed its own name:

| Grain | Identity |
|---|---|
| package | `hardened_digest` |
| project | contract digest |
| **lineage** | **`lineKey`** — version-less purl + `contract.osera.line` |
| product | version-less purl |

The lineage is finer than the product (a 3.x and a 4.x bridge are separate) and
coarser than the project (it survives renewals). No other noun in the set fits
it.

**The line is declared, not derived.** Mapping an incoming baseline version to a
line is a judgement, not a function of the version — maintenance branches, non-
semver schemes, renames, and upstream forks all make "which line?" ambiguous. So
the line is authored at commissioning time and frozen into the **L-1 contract**
as `contract.osera.line`, signed and verified with the rest of the contract.

Consequences:

- **The line assignment is evidence.** It rides in L-1, which the quorum verifies
  and the gate reads; a mis-filed line is a contract error caught at admission,
  not silent operational drift.
- **The renewal chain is explicit.** A continuing renewal's contract carries the
  *same* `osera.line`; a fresh lineage carries a new one. The `supersedes` edge
  and the shared line must agree — a checkable admission invariant.
- **The registry is a projection.** The live set `(package, line) → current
  package record` falls out as a view over accepted contracts; no separately
  hand-curated lineage database.

Cost: OSERA must assign the line when commissioning a bridge — but "continuation
or new lineage?" is a decision that should be signed and deliberate, not
inferred.

Class (b) FINOS-native uses the same shape (version-less project purl + line);
there renewals are ordinary releases rather than bridges, but the key holds.

**Binds:** adds `osera.line` to the L-1 row and redefines `state-pointer` /
`ledger-row` keys in `artifact-data-model` §4–§5, plus the supersedes-agrees-
with-line invariant. **Resolves:** the lineage-key open item (§6), and the
`candidateKey` half of the identifier rename pass opened by
`noteworthy-lifecycle-nouns`.
**Open:** the package-record rename (`candidate-version` → `package-version`)
is proposed and unconfirmed.
