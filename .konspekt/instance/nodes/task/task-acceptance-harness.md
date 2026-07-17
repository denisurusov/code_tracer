```yaml
id: task-acceptance-harness
type: task
title: Bank-acceptance inspection harness
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
# Task: Bank-acceptance inspection harness

The L9 step *inside* the gate: run the bank's own app-team contract/integration
tests as an in-toto inspection at verification time, folding pass/fail into
promote-or-reject. The part OSERA can't do for you — acceptance testing against
the candidate on the bank side. Component ④ of the gate.
