```yaml
id: noteworthy-referent-binding
type: noteworthy
title: Decision — binding external referents (anchor the immutable, snapshot the mutable)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T21:40:00Z
provenance:
  conversationId: konspekt-ri-scoping
  sourceRef: 60ce5a5b288716680b0ccc022e7398031cbb88d5
  contentHash: 60ce5a5b288716680b0ccc022e7398031cbb88d5
  timestamp: 2026-07-17T21:20:00Z
createdAt: 2026-07-17T21:20:00Z
updatedAt: 2026-07-17T21:40:00Z
```
# Decision: binding external referents (anchor the immutable, snapshot the mutable)

**Decision.** When the L-1 contract (or any attestation) points at an external
thing, *how* it binds that thing depends on whether the referent is
immutable-by-nature or mutable-by-nature. Two modes, chosen deliberately per
referent — never a bare id/string alone:

- **Immutable-by-nature** — artifacts, source commits, test corpora, recipe sets,
  dependency-lock manifests. A jar at a digest is forever that jar. Bind by
  **digest as identity + a re-derivable locator** (purl / URI / git commit SHA,
  itself a content hash). Verification is **must-match-live**: re-pull from the
  public source, bytes must equal the recorded digest, drift = tampering =
  reject. This is exactly the §3.4 anchor property.
- **Mutable-by-nature** — CVE/advisory records, and (anticipated) licence texts,
  policy documents, external vuln feeds, project-health signals. The record
  legitimately changes over time (enrichment, re-scoring, withdrawal). Bind by
  **stable id + live locator URI + a frozen snapshot digest** of the record as it
  read at commissioning. Verification is **frozen-snapshot**: validate the
  contract against the snapshot; the live pointer is **advisory** — pulled for
  current awareness (e.g. to flag "this range has since widened"), not to gate.
  Drift here = enrichment working correctly, not tampering.

**The rule:** *anchor the immutable (must-match-live), snapshot the mutable
(frozen digest + advisory live pointer).* Never leave a mutable referent bound by
bare id alone — that is the soft spot the contract's freeze-discipline exists to
remove (the same reason the test corpus is digest-named "so it cannot be
substituted"). And never demand a third party freeze a record you do not control
— you snapshot what it said, you do not require it to stop moving.

**Why both modes, not one.** Chain principle #1 ("everything digest-bound;
version strings never identity") is satisfied in *both* — the difference is only
the verification semantics attached to the digest. Forcing must-match-live onto a
CVE record would break on the first legitimate enrichment; forcing bare-id onto a
baseline would reintroduce "fixed from *a* version" ambiguity. The referent's
nature dictates the mode.

**First application — CVEs in scope.** Each `cvesInScope` entry gains:
- `source` — the OSV record URL (live, publicly re-derivable; OSV over CPE per
  the standards register).
- `recordDigest` — `sha256` over the canonicalized OSV record snapshot frozen at
  commissioning.
- `affectedRange` becomes **checkable**: the range asserted in the contract must
  match the range in the pinned snapshot, rather than standing as an unverified
  author claim.

Consequences: closes the last unfrozen corner of the contract scope; implies a
new CVE-record-integrity admission check (extends rule 13 / §3.5) and a matching
`cve-record-tampered` bad-variant in the fixtures (snapshot digest mismatch, or
contract `affectedRange` contradicting the pinned record).
`explicitlyOutOfScope` entries carry `source` (a real/defined advisory) but not
necessarily `recordDigest` — they are not load-bearing for L5/L7.

**Binds:** the `scope.cvesInScope` schema in the L-1 contract
(`osera-backpatch-contract.md` §3) and `artifact-ri-fixtures-spec` §4/§7/§9.
Refines the reading of `artifact-architecture` §3.1 (digest-binding) and §3.4
(the anchor) by naming the two modes explicitly; the admission ruleset §3.7 will
need the CVE-record-integrity rule added when that section is next revised.
**Anticipated:** the same immutable/mutable split will recur for licence texts,
policy objects, and external feeds — apply the rule rather than re-deciding each
time.
