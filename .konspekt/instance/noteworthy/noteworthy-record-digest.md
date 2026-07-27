```yaml
id: noteworthy-record-digest
type: noteworthy
title: Decision — recordDigest is over snapshot bytes; no canonicalization at the gate
status: active
review: proposed
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-rename-pass
  timestamp: 2026-07-27T00:00:00Z
createdAt: 2026-07-27T00:00:00Z
updatedAt: 2026-07-27T00:00:00Z
```
# Decision: `recordDigest` is over snapshot bytes; no canonicalization at the gate

**Decision.** `cvesInScope[].recordDigest` is **`sha256` over the pinned advisory
snapshot exactly as carried in the evidence bundle** — the bytes, not a canonical
form derived from them. The word *canonicalized* is struck from admission rule 16
(`artifact-architecture` §3.7).

**Why the rule never needed it.** Rule 16 asks two things, and both are
gate-local:

1. the snapshot in the bundle has not been altered since commissioning;
2. the contract's `affectedComponent` and `affectedRange` agree with it.

The snapshot ships **inside the bundle**, so the gate holds the identical bytes
the issuer froze. `sha256` over a file is already unambiguous; there is no second
serialization to reconcile against. Check (2) needs parsing, not canonicalization.

The case that *would* need a canonical form is a different one: a verifier or
regulator re-pulling the advisory from OSV and asking whether the issuer's
snapshot is **faithful to what OSV served**. That comparison holds two
independently fetched byte sequences with no shared copy, which is exactly where
JSON's lack of a unique representation bites — key order, whitespace, unicode
escaping, number formatting all float free.

But that check **cannot be rule 16**, by rule 16's own final clause: *the live
source URI is never read at the gate.* Faithfulness is establishable only at
commissioning, when ⑦ pulls the record, or by the quorum. Different check,
different time, different actor.

**Rejected: JCS (RFC 8785) over the full record, at the gate.** It was the first
answer reached for, and it solves a problem the gate does not have. It would
import a canonicalization dependency into the offline verification path in order
to serve a comparison the gate is forbidden from performing, and every
implementation of that dependency is a place two conforming parties can diverge.

**Precedent, from a standard already in the chain.** DSSE — the envelope every
attestation here rides in — rejected canonicalization deliberately and signs over
the payload bytes as transmitted, on the reasoning that canonicalization is
subtle, divergently implemented, and a recurring source of signature-verification
bugs. Taking the opposite position one layer up, for a weaker requirement, would
be hard to defend. The ecosystem does contain the other school — JCS specifies
the canonical form, CBOR avoids the question at the format layer, which is why
SCITT is COSE/CBOR rather than JSON — but this design is already committed to the
bytes-as-transmitted side.

**Consequences.**

- **Rule 16 is offline-decidable with no new dependency.** It was already
  intended to be; *canonicalized* quietly made it otherwise.
- **RI Phase 0 is unblocked.** The fixture generator can emit a conforming
  snapshot and a `cve-record-tampered` variant that differ by a byte, with no
  canonicalization convention to agree on first.
- **Bundle assembly must preserve the snapshot verbatim.** The resolver ③ and the
  tar/OCI projections must not reformat, re-indent or re-encode it. This is a
  real constraint that a canonical form would have hidden, and it belongs in the
  bundle-format requirements.
- **The advisory pointer keeps its job unchanged.** Live drift remains an
  exposure finding read by the ledger ⑤, never an admission input
  (`noteworthy-referent-binding`).

**What a specification would add here, and it is not prose.** The failure this
guards against is two conforming implementations disagreeing on a digest, and
specification text does not catch that — **frozen test vectors** do. The alliance
master repo already carries `schemas/`; it should carry a conformance corpus
beside it. Same shape as the contract-schema compatibility item still open in
`artifact-architecture` §9: a schema says which fields exist, never how to hash
them.

**Binds:** strikes *canonicalized* from rule 16 (`artifact-architecture` §3.7),
fixes `recordDigest` in `artifact-ri-fixtures-spec` §2/§4, adds a
verbatim-preservation requirement on bundle assembly.
**Resolves:** the `recordDigest` canonicalization open item, which blocked RI
Phase 0.
**Open:** **snapshot faithfulness** — whether ⑦ records anything at commissioning
letting a third party confirm the snapshot matches what OSV served, and whether
the quorum checks it. Needs a canonical form *if* it is done at all, so JCS may
return — scoped to the issuer side, where a live fetch is legitimate, rather than
to the gate.
