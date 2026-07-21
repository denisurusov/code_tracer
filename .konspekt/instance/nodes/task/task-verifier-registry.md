```yaml
id: task-verifier-registry
type: task
title: Verifier registry and TUF trust root
status: open
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T17:20:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T17:20:00Z
```
# Task: Verifier registry and TUF trust root

Component ⑨. Curation of the verifier registry and operation of the TUF trust
root — formerly architecture §9's "biggest open gap," now built rather than
designed against (`noteworthy-trust-root-ownership`).

Scope:

- **Root metadata, k-of-m co-signed** across the alliance and member
  institutions, so root re-signing survives the disappearance of any one party.
  Root expiry is a live operational risk: lapse means every client hard-fails.
- **Delegated targets roles** for bilateral bank↔vendor namespaces, scoped per
  bank. Delegation confers signing over a path, never root authority.
- **Registry entries** — `verifier-entry` records: keys, status, rotation
  history, onboarding and offboarding.
- **Snapshot export** — the pinned, versioned trust-root snapshot that crosses
  the bank perimeter inside the evidence bundle. The consuming `verdict` pins the
  version it verified against (`artifact-data-model` §4).
- **Revocation events** — emit `verifier-revoked` into the ledger so the bank can
  answer "which admitted candidates rest on this signer."

Explicitly *not* in scope here: the governance questions (who sits in the
threshold, what `m` and `k` are, who admits a verifier). Those are formation-stage
alliance decisions this component implements but does not settle.
