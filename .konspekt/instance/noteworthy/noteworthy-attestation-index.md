```yaml
id: noteworthy-attestation-index
type: noteworthy
title: Decision — central attestation index (untrusted, projection over Rekor)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T22:10:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 4833f0e69a4b1de1865ca040457294ff9213ab2a
  contentHash: 4833f0e69a4b1de1865ca040457294ff9213ab2a
  timestamp: 2026-07-21T22:10:00Z
createdAt: 2026-07-21T22:10:00Z
updatedAt: 2026-07-21T22:10:00Z
```
# Decision: central attestation index

**Decision.** Attestation discovery runs through a **central digest → attestation
index** — Archivista — rather than through OCI referrers alone or through
dual-publishing artifact bytes. This resolves the conflict recorded in
`artifact-deployment-topology` §6.

```
  artifact bytes   → stay in the ecosystem-native repo (Maven, npm, PyPI, …)
  attestations     → OCI registry / Archivista blob store
  index            → digest → attestation refs
  digest           → computed locally from the downloaded artifact
```

**The problem it solves.** Chain principle #5 assumes attestations are OCI
referrers resolvable from the artifact digest. But hardened artifacts live in
ecosystem-native repositories, none of which implement the Referrers API. Without
an index the artifact and its evidence sit in different systems with no discovery
path between them. Dual-publishing the bytes would work but duplicates every
artifact for a discovery problem.

## Why a central index is safe here

**It can be untrusted, and that is the whole point.** The index is a *lookup*, not
evidence. A compromised, faulty or lying index points the resolver at the wrong
attestation set — and that fails immediately, because every attestation is
signed, digest-bound, and checked against the contract. **No admission rule rests
on the index being honest.** Same shape as the bundle: *a container, never a
credential*.

**It is a projection, not an authority.** Every attestation is already logged in
Rekor, so the index is **rebuildable by replaying the log**. Lose it, corrupt it,
or decide to run your own — re-derive it. This is `noteworthy-authoritative-form`
again: Rekor is the authority, the index is a view.

**That also answers the censorship objection.** A central index *can* hide that an
attestation exists. The log cannot, and the log is what the index is reconciled
against. Omission is therefore detectable rather than silent — which is the
standard one should hold a central component to, not "it can be trusted."

**Identity never depends on it.** The digest is computed locally from the
downloaded artifact, so the registry telling the truth is not load-bearing either.

## Hermeticity is untouched — the distinction is resolution vs verification

The index is read at **resolution** time by component ③, *before* the evidence
bundle is sealed. **Resolution is online; verification is offline.** The perimeter
is the line, not the whole bank — once the bundle exists, the gate reads nothing
else, and the regulator replays from the bundle alone.

## Scope clarification against `noteworthy-bundle-format`

That record concluded Archivista was **optional**. It is not reversed, it is
narrowed:

| Job | Mechanism | Archivista |
|---|---|---|
| **Transport** across the perimeter | OCI-canonical evidence bundle, tar projection | optional — conclusion stands |
| **Resolution** (digest → attestations) | central index | **load-bearing** |

Component ③ therefore does not shrink to configuration; it gains a defined
upstream instead.

**Consequences.**
- **The golden repo stays ecosystem-native.** App teams consume through their own
  package manager, so the bank-side copy is a Maven/npm/PyPI repository; the OCI
  bundle store sits beside it rather than replacing it.
- **The index is an issuer-side service** with an availability obligation, but
  not a trust obligation — an important distinction for the operating model.
- **Reconciliation is a real task**: something must periodically replay Rekor and
  confirm the index is complete. **Open** — whose job, and how often.

**Binds:** resolves `artifact-deployment-topology` §6; narrows
`noteworthy-bundle-format` (Archivista optional for transport, required for
resolution); `task-attestation-resolver` (③) gains the index as its discovery
source. **Opens:** index/log reconciliation ownership and cadence.
