```yaml
id: noteworthy-purl-namespace
type: noteworthy
title: Decision — purl namespace for backpatched artifacts
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T18:45:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: ce42f850ccfc660dde5fce05f46db479f0993fe0
  contentHash: ce42f850ccfc660dde5fce05f46db479f0993fe0
  timestamp: 2026-07-17T18:45:00Z
createdAt: 2026-07-17T18:45:00Z
updatedAt: 2026-07-17T18:45:00Z
```
# Decision: purl namespace for backpatched artifacts

**Decision (Option B).** A backpatched artifact carries a **distinct
version-suffixed purl** — `pkg:maven/…@<upstream>-osera.N`, where `N` is the
renewal count (`3.2.1-osera.1`, `3.2.1-osera.2`, …). The `sha256` digest remains
the identity (chain principle #1); the purl is the legible label. The hardening
relationship is declared explicitly: L2 names `baseline → hardened`, and L6/L7
(SBOM/VEX) assert the is-hardening-of link and the fixed CVEs.

Rejected **Option A** (same coordinate as upstream, distinguished only by
digest): although equally safe under digest-keyed verification, it produces a
label that lies — two artifacts sharing a coordinate but differing in bytes,
which every coordinate-keyed scanner, SBOM diff, and dependency resolver
conflates.

**Why B.**
- The supersedes chain (lifecycle §5) becomes self-describing: successive
  bridges read as `-osera.1`, `-osera.2`, not identical purls separable only by
  digest — the audit story §5 exists to make easy.
- It survives the bank boundary into Maven/Artifactory repos and app POMs, where
  a distinct coordinate is pinnable and visible; a same-coordinate/different-
  digest artifact is a footgun for ordinary tooling that doesn't key on digests.
- The CPE mismatch (architecture §7 trap) is turned into an explicit,
  machine-readable is-hardening-of relationship (declared in L6/L7) rather than
  hidden — B declares and annotates the relationship; A conceals it.

**Suffix scheme:** `-osera.N` (alliance-scoped, N = renewal count), chosen over
encoding the contract id (`+osera.OSERA-2026-0142`) — the latter is more precise
but pushes build-metadata semantics onto Maven's version grammar, which handles
it poorly.

**Binds:** `artifact-data-model` `candidate-version.purl` (§4). **Resolves:**
`artifact-data-model` §6 and the purl question in `artifact-architecture` §7.
