```yaml
id: project-code-tracer
goal: >-
  Design the bank-side admission-and-tracking layer that ingests OSERA-backpatched
  open source — and FINOS-native projects — into a regulated bank: the gate and
  ledger at the end of the supply chain, not the supply chain itself.
summary:
  origin: human
  pinned: false
  updatedAt: 2026-07-17T14:10:00Z
createdAt: 2026-07-17T13:46:20Z
updatedAt: 2026-07-17T14:10:00Z
```
# code_tracer

A design effort for the **bank-side ingestion gate** for OSERA (Open Source
Enterprise Resiliency Alliance) — the FINOS coalition mutualizing backpatches of
old, widely-shared open source across regulated banks. code_tracer is *not* the
supply chain; it is the on-prem admission gate and ledger at the end of it.

Two ingest classes with different risk profiles: (a) OSERA-backpatched existing
OSS, and (b) FINOS-native projects. Verification runs hermetically inside the
bank (offline, re-runnable by a regulator): `in-toto-verify` checks the pipeline
is structurally sound, then a Rego/Witness policy checks the contract's meaning.

The product surface is five components that don't exist off-the-shelf; the rest
integrates proven OSS (in-toto-verify, cosign, Archivista). See the proposed
goal decomposition in `edges/` (pending acceptance).

Index: `nodes/`, `concepts/`, `noteworthy/`, `artifacts/`, `waypoints/`,
`edges/`.
