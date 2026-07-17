```yaml
id: goal-the-gate
type: goal
title: The gate — five product components
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-17T14:15:00Z
review: accepted
provenance:
  conversationId: finos-osera-project-lookup
  timestamp: 2026-07-16T00:00:00Z
createdAt: 2026-07-17T14:15:00Z
updatedAt: 2026-07-17T14:15:00Z
```
# Goal: The gate — five product components

The verification gate is the product surface that does not exist off-the-shelf;
everything else integrates proven OSS (in-toto-verify, cosign, Archivista).
`in-toto-verify` checks the pipeline is *structurally* sound (right steps, right
signers, DAG intact); a Rego/Witness policy checks the contract's *meaning*.
Both run inside the bank, hermetic and offline. Decomposes into five components.
