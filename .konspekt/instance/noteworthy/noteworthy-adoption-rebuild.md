```yaml
id: noteworthy-adoption-rebuild
type: noteworthy
title: Decision — the adopting bank rebuilds; solo verifies alone outside
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-30T00:00:00Z
createdAt: 2026-07-30T00:00:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# Decision: the adopting bank rebuilds; solo verifies alone outside

**Decision.** Every adopting institution rebuilds the package inside its own
zone, and **inside-zone activities are identical in both governance modes**. The
rebuild runs during resolution, while the bank is still online, and emits an
**L8 signed by the bank** — the same predicate a quorum verifier signs, made by a
different party. That record seals into the ingest envelope, and the gate checks
it offline like any other.

**Solo.** One sponsor signs, so one party verifies outside. The business meaning
of solo is: pay for it, decide it, carry the risk, and publish the evidence so
others may use the output if they choose. Independent reproduction is therefore
absent outside the perimeter and restored at adoption, by the party taking the
risk.

**What this repairs.** A sponsor-verifies-alone rule would have falsified three
accepted sentences. It does not, because the rules and the inside-zone work are
mode-independent:

- `artifact-architecture` §8 — the control statement holds across modes and trust
  paths. Still true of the **rules**; the amendment is that the evidence reaching
  them carries fewer outside reproductions in solo, and the trust path on the
  verdict makes that visible.
- `noteworthy-governance-modes` — second-hand consumption of solo output was
  justified by "the evidence is identical". That clause goes: what is identical is
  what the gate requires, plus the adopter's own rebuild.
- The no-weaker-tier argument survives intact, since no bank applies a lighter
  check to anything.

**The core carries rebuild metadata.** References pinned by digest, never the
images: source locator and digest, transformation digest, toolchain locator and
digest. Pinning by hash is what makes a live fetch safe — it yields the named
bytes or it fails loudly — so the core stays a set of small signed files while
carrying everything a rebuild needs. **A tag is never acceptable in place of a
digest**; it is a mutable pointer that would reintroduce a live dependency
through the side door.

**Why the rebuild sits at resolution.** The design's line already runs there:
resolution is online, verification is offline. What the *gate* needs is not the
rebuild inputs but the result — a signed record of a reproduction — so the
hermetic, replayable verdict is untouched and the rule that everything the gate
needs ships in the bundle still holds.

**Disclosure.** The bank-signed L8 is not published by default and **is
disclosable on demand**. "Never leaves the bank" was an overclaim: a supervisor
may require confirmation that the institution rebuilt and validated. The same
correction applies to L9. Producing both on request demonstrates the control
rather than asserting it.

**Costs and limits.**

- **Verification does not compress, and now the consumer pays it.** Each adopting
  institution bears roughly production cost per package. That is the price of the
  independence claim, and it cannot be reduced by sampling without making
  inside-zone work differ by mode.
- **A pinned locator can stop resolving.** Registries delete, and a toolchain
  image may be gone years later while every digest still checks out. Same shape as
  the anchor-durability limit for deletion-permitting registries, and it wants the
  same remedy: mirror locally anything the institution intends to re-run.

**Binds:** the evidence core's contents (`artifact-evidence-bundle`,
`noteworthy-core-manifest`); the Verified → Resolved transition and component ③
(`artifact-product-lifecycle`); L8 and L9 signer and disclosure semantics
(`artifact-architecture` §3.3). **Amends:** `noteworthy-governance-modes`, and
`noteworthy-revocation-semantics` for the solo case.
