# Historical notes

Design notes written for the FINOS OSERA formation working group and frozen at the
point they were reconstructed. Kept for their framing, their open questions, and
the record of what was recoverable.

## How to read them

Their **content** is historical, including the gaps. Each carries a provenance
note naming which sections survived intact and which are partial, and those notes
are themselves part of the record — quietly reconstructing a missing section
would destroy the evidence that it was ever missing.

Their **vocabulary** is current. The rename pass of 2026-07-27 applied provider,
team, package and `lineKey` here as everywhere else, and replaced the provider's
company name with the role placeholder Provider P.

Where one of these disagrees with an artifact under `.konspekt/instance/`, the
artifact is current and the note is stale.

## The set

| Note | Subject | Now carried by |
|---|---|---|
| `osera-attestation-chain.md` | The L0–L9 chain, the anchor problem, the quorum, and a 13-rule admission set | `artifact-architecture` §3 |
| `osera-backpatch-contract.md` | The L-1 contract and its machine-readable schema | `artifact-contract-lifecycle`. Its §6 item 2 recommends promoting partial fulfilment, which `noteworthy-conformance-binary` rejected |
| `osera-bank-verification.md` | Why the bank needs no new verification mechanism, only a new layout | `artifact-architecture` §4 |
| `osera-standards-register.md` | Standards across the lifecycle; §6–§9 partial | `artifact-architecture` §7, and `noteworthy-ecosystem-generalization` for the Maven-specific framing |
| `osera-bank-schematic.svg` | The ingestion path, drawn before the three machines were separated | `docs/resources/p1-lifecycle.svg` |
