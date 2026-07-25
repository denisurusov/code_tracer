```yaml
id: noteworthy-core-manifest
type: noteworthy
title: Decision — the evidence core is one canonical JSON file, sha256-identified
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-25T00:00:00Z
provenance:
  conversationId: konspekt-osera-member-deck
  sourceRef: 4c033a33595c2cf803123955559edfbeb6585d05
  contentHash: 4c033a33595c2cf803123955559edfbeb6585d05
  timestamp: 2026-07-25T00:00:00Z
createdAt: 2026-07-25T00:00:00Z
updatedAt: 2026-07-25T00:00:00Z
```
# Decision: the evidence core is one canonical JSON file

**Decision.** The evidence core (`noteworthy-bundle-split`) is a **single JSON
file** listing, for each element, its `sha256` and a locator. It is published in
the alliance master repo and identified by the digest of its own bytes.

```
coreDigest = sha256(canonical file bytes)          # what verdict.coreDigest names
path       = cores/{contractId}/v{N}/{seq}.json    # seq starts at 1
schema     = schemas/core/v{N}.json                # version pinned inside the file
canonical  = RFC 8785 (JCS) + trailing LF
freeze     = Rekor entry over coreDigest at seal time
```

Re-sealing produces `{seq}` + 1 carrying `supersedes: <prior coreDigest>`, the
same append-only supersede pattern `candidate-version` already uses. There is no
index file: which core belongs to a candidate resolves through the accepted
contract, exactly as the `(package, line)` lineage registry is a projection over
accepted contracts (`noteworthy-candidate-key`).

**Why a file rather than an OCI image index.** The core is the citable half of
the perimeter interface, so its form should serve reading and comparison rather
than transport.

- **A supervisor or a peer bank can open it.** Text, diffable, checkable with
  standard tools. An OCI index says nothing without a registry and a client.
- **Availability stops being an open question.** The master repo is already the
  never-deleted, tagged, released publication surface, and the signed contract
  already lives there on exactly this pattern — file for retrieval, digest
  authoritative (`artifact-deployment-topology` §3).
- **It matches the delivery manifest.** That is already a list of digests frozen
  by a log entry. One mechanism, used three times, rather than a new one.
- **Issuance becomes a reviewed merge**, so commissioning governance falls out of
  the storage choice.
- **It is kilobytes**, which makes mirroring free and turns the air-gap courier
  problem into moving a text file.

**Identity is `sha256`, and the git blob SHA is a locator.** A git blob SHA is
SHA-1 over `blob <len>\0` plus content, and SHA-1 has had practical
chosen-prefix collisions since 2019 at falling cost. Every other subject in this
design is sha256-bound (chain principle #1, admission rule 12), so keying the
top-level evidence identifier on SHA-1 would place the weakest hash in the chain
on the one value handed to a regulator and compared between members. It would
also couple evidence identity to a hosting platform's object format. konspekt's
own convention — the blob SHA "resolves and verifies structurally" — is right for
a knowledge graph and too weak for an admission gate. `git hash-object` stays
useful for finding and fetching the file; no admission rule keys on it, which
gives it the status the attestation index already has: a lookup, never evidence.

**A list of digests is a commitment to the bytes.** Every entry names its element
by `sha256`, so hashing the list is a Merkle root written out longhand: a wrong
locator fails immediately against the digest it claims to serve. That is what
lets the core stay small while the bytes travel separately, resolved online by ③
before the envelope seals (`artifact-deployment-topology` §4).

**Canonical serialization is load-bearing.** Because the digest of the file *is*
the identity, the encoding has to be pinned or the identity breaks the first time
anyone round-trips the object. RFC 8785 gives sorted keys, no insignificant
whitespace, and UTF-8, so any implementation can re-serialize from parsed content
and reproduce `coreDigest` — the same property the deterministic tar export
exists to provide for the byte set.

**The Rekor entry is the real freeze.** Path and git history are navigation. The
digest plus its log entry is what survives a force-push, a repo migration, or the
alliance losing the repository, and `verdict.coreDigest` is what two banks
compare. A path never appears in a verdict.

**Consequences.**

- **`noteworthy-bundle-format` narrows.** OCI stays canonical for the attestation
  blobs and for transport; the core's canonical form is this file. The tar
  projection question does not arise for the core, which is already a file, and
  still applies to the byte set.
- **`noteworthy-authoritative-form` gains a row:** canonical core file →
  OCI/registry copies as projections.
- **`artifact-deployment-topology` §1 restated.** The master repo now publishes
  two authoritative files. Neither repository's own hashing is load-bearing,
  because both are identified by `sha256` over canonical bytes, so the original
  correction survives in substance and needs re-wording.
- **`artifact-data-model` gains the `evidence-core` record shape** (§4).
- **Component ③ reads the core file** and resolves its locators before sealing an
  envelope, checking every fetched element against the digest the core names.

**Binds:** `artifact-evidence-bundle` §1–§2 and §6; `artifact-deployment-topology`
§1 and §3; `artifact-data-model` §4. **Resolves:** the core-availability open item
in `artifact-evidence-bundle` §7.
