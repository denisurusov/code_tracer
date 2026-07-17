```yaml
id: task-rego-policy
type: task
title: Rego semantic policy
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
# Task: Rego semantic policy

The meaning layer in-toto can't read. Over the resolved link/attestation
contents, check that CVEs-fixed ⊇ scope, digests match across the k-of-n
quorum, patched-path coverage ≥ threshold, and so on. Runs at the same internal
gate, right after structural verification. Component ② of the gate.
