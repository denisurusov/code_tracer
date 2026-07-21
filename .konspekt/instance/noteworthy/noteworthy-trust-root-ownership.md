```yaml
id: noteworthy-trust-root-ownership
type: noteworthy
title: Decision — trust root co-signed (alliance + member banks); delegation for bilateral paths
status: active
review: proposed
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-21T14:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: c284e12b3f1e77a4f712644a85aba7e8195b4648
  contentHash: c284e12b3f1e77a4f712644a85aba7e8195b4648
  timestamp: 2026-07-21T14:00:00Z
createdAt: 2026-07-21T14:00:00Z
updatedAt: 2026-07-21T14:00:00Z
```
# Decision: trust-root ownership, continuity, and delegated bilateral paths

**Decision.** Verifier-registry curation and the TUF trust root are **built, and
built by us**, on the issuer side. Ownership splits into two distinct mechanisms
that must not be conflated:

- **Continuity — root is k-of-m co-signed** across OSERA *and* participating
  member institutions. Member banks are **co-signers in the root threshold**,
  not delegates.
- **Bilateral vendor relationships — TUF delegation.** A bank dealing with a
  vendor directly, over OSERA rails, receives a **delegated targets role scoped
  to its own namespace**. It signs for its own artifacts; other members' clients
  need not trust that namespace.

**Why co-signing, not delegation, carries continuity.** TUF delegation runs
*downward*: root delegates targets authority over a scoped path. **A delegate
cannot sign a new root.** If OSERA alone holds root keys and dissolves,
delegation buys nothing — and the failure is worse than "no new artifacts,"
because root metadata **expires**. When it lapses with no one able to re-sign,
every client hard-fails closed and verification bricks. A root threshold spanning
multiple organizations survives the disappearance of any one of them.

**Delegated paths get attribution, not leniency.** Under a bilateral delegation
the bank is issuer *and* consumer for that path, which collapses the
maker/checker split and with it the k-of-n quorum property. Therefore:

- **No weaker tier.** The admission policy is **identical** across signing
  namespaces. A bilateral artifact that cannot muster k-of-n independent
  verifiers fails the gate like anything else; the bank does without, or records
  an explicit risk acceptance against a **named failing rule**.
- **The `verdict` records the trust path** that admitted the artifact, so the
  ledger can answer "which admissions came over delegated rails" without that
  being a different standard.

Rationale for refusing a second tier: a weaker path is well-understood on the day
it is created and load-bearing-but-forgotten three years later. Keeping the
shortfall loud preserves the §8 control statement without qualification.

**Hermeticity.** TUF's rollback and freshness guarantees assume timely metadata
refresh; the bank verifies offline and makes no live call at verify time. The
resolution is the standing pattern in `noteworthy-referent-binding`: the verifier
registry is a **mutable external referent**, so it crosses the perimeter as a
**pinned, versioned snapshot** (frozen digest + advisory live URI), refreshed on
a deliberate cadence. Consequently the **`verdict` must pin the trust-root
version it verified against** — otherwise "a regulator can re-run this decision
offline and reach the same verdict" becomes false the moment the registry
changes.

**Revocation after admission — newly modeled.** If a verifier key is revoked in
month six, candidates admitted on VSAs it signed were validly admitted *at the
time* and now rest on a compromised signer. The hash-chained ledger can answer
"which admitted candidates depend on verifier X" (a last-write row could not),
but nothing currently emits that fact. Adds a `ledger-event` kind
`verifier-revoked`. **Open:** does revocation force re-verification, or record an
exposure? Recommend record-an-exposure with a review trigger, on the same
reasoning as `Expiring` being computed rather than stored.

**Governance residue — named, not resolved.** Building the mechanism does not
answer: who sits in the root threshold, what `m` and `k` are, what quorum signs a
root rotation, who may admit or remove a verifier, and what happens procedurally
on suspected compromise. These are formation-stage alliance governance, not
engineering, and they remain open.

**Accepted risk (human call, 2026-07-21).** A bank co-signing the trust root of a
system it also consumes from is a conflict its own second line is expected to
accept, on the grounds that the counterfactual is not a stricter regime but an
unguarded one — banks ingest open source today without any of these controls.

**Binds:** `artifact-architecture` §6 (trust-root governance moves *the gap* →
*build*) and §9; `artifact-data-model` `verdict` gains `trustRootVersion` and
`trustPath`, `ledger-event` gains kind `verifier-revoked`.
**Resolves:** the TUF-shaped trust-root gap as *owned*; leaves its governance open.
