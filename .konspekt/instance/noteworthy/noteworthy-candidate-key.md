```yaml
id: noteworthy-candidate-key
type: noteworthy
title: Decision — candidateKey (bridge lineage, line declared in L-1)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T19:20:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: d52387ff30f91edbbcfbd34f44095c034df02adb
  contentHash: d52387ff30f91edbbcfbd34f44095c034df02adb
  timestamp: 2026-07-17T19:20:00Z
createdAt: 2026-07-17T19:20:00Z
updatedAt: 2026-07-17T19:20:00Z
```
# Decision: candidateKey (bridge lineage, line declared in L-1)

**Decision.**

```
candidateKey = <version-less upstream purl> + contract.osera.line
             # e.g. pkg:maven/org.apache.commons/commons-collections?osera.line=3
```

`candidateKey` is the stable handle the mutable side uses to name one **bridge
lineage** as it moves and renews. It is:

- **Constant across the supersedes chain.** `osera.1` and `osera.2` are distinct
  `candidate-version`s (different digests/contracts, possibly a rebased baseline)
  but the same ongoing bridge; the `state-pointer` and `ledger` follow that
  continuity. candidateKey identifies neither the artifact (that is the digest)
  nor a single version — it identifies the lineage.
- **Line-qualified.** A 3.x bridge and a 4.x bridge for the same package are
  different lineages with different keys. A renewal that jumps lines (3.x → 4.x)
  is correctly a *new* lineage: the old line Retires, a new one is Commissioned.
- **App-free.** `app` is deliberately not in the key: a bridge is built,
  verified, and admitted once regardless of how many apps adopt it. The per-app
  dimension lives only in the ledger: `ledger-row` key = `(appId, candidateKey)`.
  `state-pointer` key = `candidateKey`.

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
  candidate-version` falls out as a view over accepted contracts; no separately
  hand-curated lineage database.

Cost: OSERA must assign the line when commissioning a bridge — but "continuation
or new lineage?" is a decision that should be signed and deliberate, not
inferred.

Class (b) FINOS-native uses the same shape (version-less project purl + line);
there renewals are ordinary releases rather than bridges, but the key holds.

**Binds:** adds `osera.line` to the L-1 row and redefines `state-pointer` /
`ledger-row` keys in `artifact-data-model` §4–§5, plus the supersedes-agrees-
with-line invariant. **Resolves:** the candidateKey open item (§6).
