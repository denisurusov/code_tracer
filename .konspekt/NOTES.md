# NOTES

Human scratchpad for this project. Append-only, organized by date.

Outside the konspekt graph: the `note:` / `note "…"` convention writes here and
is **never** reconciled into a `Noteworthy` entity. Notes are for the human; the
graph is for the project.

Date headings appear as notes are added.

## 2026-07-17

- Parked open questions (from goal-decomposition acceptance — not yet in the graph):
  - **CycloneDX vs SPDX** — SBOM format choice. CycloneDX carries VEX inline (fewer moving parts for the crux VEX domain); SPDX has the ISO stamp some regulators/second-line prefer. Ripples through the whole SBOM diff pipeline — decide early.
  - **The `k` / `n` quorum values** — who sits in the verifier registry, entry criteria, and whether verification is a *duty* of participation or a *credit* against funding contribution.
  - **VSA signing granularity** — per-artifact or per-release-set.

## 2026-07-30

- **All three items above are settled and have moved into the graph.** Left in
  place rather than deleted, because a scratchpad that quietly loses its entries
  is worse than one that carries their outcome:
  - SBOM format → `noteworthy-sbom-format`. CycloneDX authoritative, SPDX
    projection on demand, VEX stays OpenVEX at L7.
  - Quorum values → `noteworthy-quorum-parameters`, then superseded the same day
    by `noteworthy-signer-verification`. Neither duty nor credit: the parties
    that sign and fund a contract verify it, all of them, zero dissent, minimum
    two. The credit model stayed rejected on its original reasoning.
  - VSA signing granularity → per-artifact, settled implicitly by the chain
    binding every attestation to a `hardened_digest`
    (`artifact-architecture` §3.1). Worth a record of its own if it is ever
    questioned.

- Nothing is parked here now. New open questions belong in an artifact's own
  open-items section, where the conformance checker can see them.
