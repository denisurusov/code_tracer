```yaml
id: investigation-ingest-classes
type: investigation
title: Two ingest classes
status: active
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T16:45:00Z
review: accepted
provenance:
  conversationId: finos-osera-project-lookup
  timestamp: 2026-07-16T00:00:00Z
createdAt: 2026-07-17T14:15:00Z
updatedAt: 2026-07-17T16:45:00Z
```
# Investigation: Two ingest classes

Two things get ingested, with different risk profiles, handled by one tool:
(a) **OSERA-backpatched existing OSS** — a known baseline was modified, so the
risk is the provenance and correctness of the *change*; and (b) **FINOS-native
projects** — new code, so the risk is project health and origin. A single gate
must handle both.
