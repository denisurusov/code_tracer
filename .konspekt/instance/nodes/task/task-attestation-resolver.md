```yaml
id: task-attestation-resolver
type: task
title: Attestation resolver / collector
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
# Task: Attestation resolver / collector

Discover and collect the attestations attached to an artifact (OCI referrers /
sigstore bundles keyed to the artifact digest) and feed them into the gate. May
shrink to configuration if Archivista is adopted. Component ③ of the gate.
