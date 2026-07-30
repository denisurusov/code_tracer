```yaml
id: artifact-evidence-bundle
type: artifact
title: code_tracer — The evidence bundle: core and envelope (perimeter interface)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 05038f93a541216c0f6713ea13bcff58a40d823d
  contentHash: 05038f93a541216c0f6713ea13bcff58a40d823d
  timestamp: 2026-07-21T15:10:00Z
createdAt: 2026-07-21T15:10:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# code_tracer — The evidence bundle: core and envelope (perimeter interface)

**Status:** accepted. The thing that crosses the bank boundary — the interface
between the issuer and consumer sides.

> **Provenance of amendments.** §1, §3 and the §6 resolutions derive from excerpt
> `b73f250d059666768988095d440fa673548ef9d2`; §2's checkpoint set and §6's format
> and freshness resolutions from `62f7c4b932187a51625b047401a2925cb3b0715e` and
> `19c83a6696b0385da970572660b26d3871318fad`. The **core/envelope split** in §1,
> §2, §3, §5 and §6 derives from excerpt `7aa6325730d0516102bfe4d0adffadbc846626f1`
> (`noteworthy-bundle-split`).

> **Amendment 2026-07-30 (`noteworthy-adoption-rebuild`).** The core carries
> **digest-pinned rebuild references** — source, transformation, toolchain — so
> that every adopting bank can reproduce the build inside its own zone, in both
> governance modes. The envelope carries the **bank's own L8** over that rebuild.
> §4's "never leaves" is corrected to *unpublished, disclosable on demand*.

**Why it exists.** Because the bank verifies **hermetically and offline**
(`artifact-architecture` §1), the perimeter crossing cannot be a protocol — there
is no live call to the alliance at verify time. It is therefore a **copy of a
self-contained, content-addressed set of files**, and everything the gate needs
to reach a verdict must be inside it. Anything the gate needs that is *not* in
the bundle is, by definition, a live dependency and a violation of hermeticity.

That is the design test this artifact exists to enforce: **if the gate needs it,
it ships in the bundle.**

## 1. Three containers, each with one job

Three moments in the life of one delivery carry different authority and
different clocks, so each gets its own container.

| | **Delivery manifest** | **Evidence core** | **Ingest envelope** |
|---|---|---|---|
| Assembled by | provider | issuer, once | resolver ③, once per consuming bank |
| At | Delivered | Fulfilled | Verified → Resolved |
| Holds | L-1 + L0–L7 | delivery manifest + L-1 + L0–L8 + layout + policy bundle + advisory snapshots + rebuild references | core digest + trust material + this bank's L8 + local locator |
| Identity | logged digest | **one digest, shared by every bank** | bank-local digest |
| Clock | none | none — frozen at Fulfilled | trust root ≤ 7 days, checkpoints ≤ 24 hours, measured at the gate |
| Crosses the perimeter | no | yes | sealed at the crossing |

**The cut is evidence against trust material.** The core is what was claimed and
what was independently verified: frozen, identical for every consumer, and
therefore citable. The envelope is what one bank checked that evidence *against*,
current at its own decision moment, plus what that bank established for itself.
Evidence does not go stale; the material used to judge signatures and log
inclusion does, which is why one container cannot carry both.

**Why the core is issuer-assembled.** Its contents are complete at Fulfilled and
identical for every bank, so assembling it n times produces n manifest digests
over one evidence set — and then no two banks can cite the same evidence to each
other or to a supervisor. Assembling it once gives the alliance a shared
identifier at no cost to independence, because sealing confers no authority (§3).

**Why the envelope is bank-assembled.** Freshness is measured at the gate, so a
trust-root snapshot and log checkpoints sealed once for the alliance would be
stale for whoever ingests later. A bank must verify against material current at
its own admission moment, and must be free to tighten the window. It is also
where the bank's **own** rebuild result lands, which is by definition per-bank.
Per-bank assembly is cheap: it is discovery, one rebuild, and copy — and OCI blob
sharing means the core is referenced rather than duplicated.

**The delivery manifest freezes the hand-off.** Its job is to stop the provider
adjusting what it submitted after seeing how verification went — the same
loophole `L-1` closes for the test corpus, one layer out. It is checked
mechanically against `contract.requiredAttestations`.

**The freeze is a transparency-log entry, not a signature.** Log the delivery
manifest digest at hand-off in the shared FINOS Rekor instance
(`noteworthy-transparency-log`). That establishes *"this exact set existed at time
T"*, which is the property actually wanted, and asserts nothing about
correctness — an inclusion proof cannot be misread as an endorsement.

**Rejected: an alliance signature over a provider-assembled container.** Two
faults. *Timing* — before testing, the container holds only L-1 and L0–L7, so it
is the provider's submission rather than the artifact that crosses the perimeter;
L8 is the only element that converts claims into evidence. *Instrument* — such a
signature attests "this is the set the vendor handed us," which is provenance of
receipt masquerading as verification of contents. Issuer assembly of the **core**
is not that signature: the core is sealed after L8 exists, and sealing it is a
digest over independently signed elements rather than an assertion about them.

**Rejected: a single per-bank bundle with the delivery-manifest log entry as the
shared identifier.** The manifest digest is already logged and already common, so
it looks like a free answer. It covers L-1 and L0–L7 and stops at the provider's
submission — it names what was handed over, not what was verified, omitting the
L8 set, the compiled layout and the policy bundle. An identifier for the evidence
has to include the evidence.

## 2. Contents

**Evidence core** — frozen at Fulfilled, one copy for the whole membership.

| Element | Why it must be inside |
|---|---|
| Artifact digest and purl | the subject |
| Delivery manifest + its log inclusion proof | the frozen provider hand-off |
| Attestation set L0–L8, DSSE-wrapped | the provider's claims and every signatory's VSA, each carrying the tree head its verifier observed |
| L-1 contract, signed, with countersignature | the root referent every link is checked against |
| Compiled layout + `compilerVersion` | structural verification; the bank recompiles and compares (rule 14) |
| Rego policy bundle + version | semantic verification; the meaning layer |
| Pinned advisory snapshots, one per `cvesInScope` entry | the frozen records the contract's scope is checked against (rule 16); absent them, the range check becomes a live lookup |
| **Rebuild references** — source locator + digest, transformation digest, toolchain locator + digest | what lets the adopting bank reproduce the build itself. References, never images: pinning by hash is what makes the fetch safe, since it yields the named bytes or fails loudly. A tag is never acceptable in place of a digest |
| Core manifest | digest over every element above; the shared identity |

**Ingest envelope** — sealed by ③ at the crossing, one per bank per ingest.

| Element | Why it must be inside |
|---|---|
| Core digest | what this admission is about |
| **This bank's L8**, over its own rebuild | the reproduction the adopting bank performed for itself (`noteworthy-adoption-rebuild`). Produced at resolution while still online; the gate reads only the signed result |
| Trust-root snapshot (TUF metadata, versioned) | verifier registry, keys, delegations — no live TUF refresh at verify time |
| **Checkpoint set** — a current tree head plus consistency proofs against the heads observed in L8 | inclusion verifiable offline, **and** split-view detection: divergent heads across the signatory set are disqualifying (`noteworthy-transparency-log`) |
| Fulcio root / cert chain | signature validity without a live CA |
| Local artifact locator | where the bytes sit in this bank's quarantine registry |
| Envelope manifest | digest over the core digest and the material above |

The checkpoint is a **set rather than a singleton**, precisely because the log is
FINOS-operated: a single asserted tree head would have to be trusted, whereas
independently observed ones cannot be split without producing a dissent. The
observed heads are frozen in the core with their L8 records; what the envelope
adds is a head current at the bank's own decision moment and the proofs tying the
two together.

## 3. Properties

- **Neither container is a credential.** Sealing carries no signature of its own
  and confers no authority on the contents. Every element inside is
  independently signed and independently verified; a manifest is a digest over
  them, nothing more. This is the property that lets the issuer assemble the
  core without becoming a trust role, and it is what the split rests on — if
  sealing meant anything, issuer assembly would be an endorsement.
- **Content-addressed.** Each manifest digest is its container's identity,
  exactly as `sha256` is the artifact's (chain principle #1), and the core digest
  is **identical across the OCI and tar forms**.
- **Self-verifying offline.** Every admission rule in §3.7 must be decidable from
  bundle contents alone. A rule that cannot be is a design error in the rule or a
  missing element here. The bank's rebuild does not breach this: its *inputs* are
  fetched at resolution from pinned references, and what the gate consumes is the
  signed L8 that results.
- **Replayable.** A regulator handed the bundle re-runs the gate and reaches the
  same verdict — the §8 control statement, made physically true.
- **Immutable.** Once sealed, both containers are frozen. An amended contract
  produces a **new core**; a refreshed trust root, or a fresh rebuild, produces a
  **new envelope** over the same core. Neither is ever edited.
- **Fresh, within stated limits.** The clock applies to the envelope: trust-root
  snapshot ≤ 7 days, checkpoint set ≤ 24 hours; tightenable per bank, never
  loosenable; stale is a named-rule reject (`noteworthy-bundle-freshness`). The
  core has no clock — a sealed evidence set from last year still proves what it
  proved then, so it re-admits under a fresh envelope.
- **Re-admissible.** Because the core is stable and the envelope is cheap, a bank
  re-running an old admission, or a second bank admitting the same package
  later, works from the same core digest with an envelope of its own. The
  rebuild is the one part that is not cheap, and a re-admission may reuse the
  bank's existing L8 where the core digest is unchanged.

## 4. What is deliberately *not* in it

- **L9 acceptance** — the bank's own control, created inside, and **unpublished
  by default rather than undisclosable**: a supervisor may require confirmation
  that the institution tested and admitted, and producing it on request
  demonstrates the control (`noteworthy-adoption-rebuild`). It is produced
  *against* the bundle rather than carried by it. The same disclosure property
  applies to the bank's own L8, which the envelope does carry.
- **The verdict** — likewise bank-side output, not input.
- **The bank's acceptance suite** — inspections are bank-authored only; the
  layout may require that an inspection named `bank-acceptance` exists but must
  never supply its command
  (`docs/historical/osera-bank-verification.md` §7 item 4).
- **Rebuild images** — the toolchain and source are named by digest and fetched
  at resolution, never packed into the core. Carrying them would trade a small
  signed manifest for a container the size of a build environment.

## 5. Data-model placement

All three containers are `immutable` + `standard-bound`. The **delivery
manifest** is born at **Delivered** and the **evidence core** at **Fulfilled**;
both belong to the outside zone. The **ingest envelope** is born at the
**Verified → Resolved** transition (`artifact-product-lifecycle` §3) and is what
component ③ assembles.

The `verdict` carries **`coreDigest`** — the shared evidence set — alongside
`bundleDigest` for the envelope actually verified, plus `trustRootVersion` and
`trustPath` (`artifact-data-model` §4). Two banks admitting the same package
produce different `bundleDigest`s and the *same* `coreDigest`, which is exactly
the comparison the shared identifier exists to permit.

## 6. Format — OCI canonical, tar projection

Decided (`noteworthy-bundle-format`): an **OCI image index with the attestation
set attached as referrers** is canonical; a **deterministic tar + manifest
export** is emitted on demand for air-gapped transfer; the manifest digest is
identical across both. Both containers take the same two forms, and the envelope
references the core by digest rather than embedding it.

- OCI is native to the resolution path already chosen (cosign, Referrers API).
- Blobs are content-addressed and shared, so one core — and one trust-root
  snapshot — is *referenced* by every envelope that uses it rather than copied
  into each, which removes the size concern entirely for the registry case and
  makes per-bank envelopes nearly free.
- The tar form is fat by necessity and correct for an air gap; determinism
  (fixed entry ordering, normalized metadata, no timestamps) is required so the
  manifest digest survives the round trip.
- **Archivista becomes optional** — storage and DAG-traversal convenience, not
  transport.

**Operational consequence.** The 24-hour checkpoint clock means an air-gapped
estate must move the envelope across the gap within a day of checkpoint issuance.
The core can cross ahead of it on any schedule, which makes the courier problem
smaller than it first appears: the large, stable half moves once, and only the
small, fresh half is on the daily tempo. That cadence is something the rollout
plan absorbs; it is not a schema problem.

**An air gap complicates the rebuild.** The bank's own reproduction needs the
pinned source and toolchain, which an air-gapped estate cannot fetch at
resolution. Those references have to be mirrored inside beforehand, which makes
the mirror a rollout prerequisite rather than an optimisation — see §7.

## 7. Open

- **External witnessing** — whether the checkpoint set should additionally be
  cross-checked against a public log or witness network for consumers outside the
  membership. Not needed for admission inside a member bank; possibly wanted for
  the regulator story (`noteworthy-transparency-log`).
- **Core availability** — the shared identifier is only useful while the core is
  retrievable. Who hosts it, for how long, and what a member does when a core
  referenced by a live verdict is no longer served.
- **Rebuild-input durability** — the same question one level down. A pinned
  source or toolchain locator can stop resolving years later while every digest
  still checks out, which makes an old package un-rebuildable without
  invalidating any evidence. Local mirroring is the obvious remedy and its scope
  and retention are unspecified; an air-gapped estate needs the mirror from day
  one regardless.
- **Envelope retention** — whether a bank keeps every envelope it ever sealed, or
  only those named by a standing verdict. Bears on how long the ≤ 24-hour
  checkpoints stay meaningful as audit material, and now also on whether an old
  rebuild result survives to be reused.
