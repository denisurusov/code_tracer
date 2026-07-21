```yaml
id: artifact-evidence-bundle
type: artifact
title: code_tracer — The evidence bundle (perimeter interface)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-21T19:30:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 05038f93a541216c0f6713ea13bcff58a40d823d
  contentHash: 05038f93a541216c0f6713ea13bcff58a40d823d
  timestamp: 2026-07-21T15:10:00Z
createdAt: 2026-07-21T15:10:00Z
updatedAt: 2026-07-21T19:30:00Z
```
# code_tracer — The evidence bundle (perimeter interface)

**Status:** accepted. The thing that crosses the bank boundary — the interface
between the issuer and consumer sides.

> **Provenance of amendments.** §1, §3 and the §6 resolutions derive from excerpt
> `b73f250d059666768988095d440fa673548ef9d2`; §2's checkpoint set and §6's format
> and freshness resolutions from `62f7c4b932187a51625b047401a2925cb3b0715e` and
> `19c83a6696b0385da970572660b26d3871318fad`.

**Why it exists.** Because the bank verifies **hermetically and offline**
(`artifact-architecture` §1), the perimeter crossing cannot be a protocol — there
is no live call to the alliance at verify time. It is therefore a **copy of a
self-contained, content-addressed set of files**, and everything the gate needs
to reach a verdict must be inside it. Anything the gate needs that is *not* in
the bundle is, by definition, a live dependency and a violation of hermeticity.

That is the design test this artifact exists to enforce: **if the gate needs it,
it ships in the bundle.**

## 1. Two containers, not one

A single container cannot serve both jobs, because the maker's hand-off and the
verified output exist at different times and carry different authority.

| | **Delivery manifest** | **Evidence bundle** |
|---|---|---|
| Assembled by | maker | resolver ③, bank-side at ingest |
| At | Delivered transition | Verified → Resolved |
| Contents | L-1 + L0–L7 | delivery manifest + L8 + layout + policy bundle + trust-root snapshot + checkpoint set |
| Purpose | freeze the submission | carry everything the gate needs, offline |
| Crosses the perimeter | no | yes |

**The delivery manifest freezes the hand-off.** Its job is to stop the maker
adjusting what it submitted after seeing how verification went — the same
loophole `L-1` closes for the test corpus, one layer out. It is checked
mechanically against `contract.requiredAttestations`.

**The freeze is a transparency-log entry, not a signature.** Log the delivery
manifest digest at hand-off in the shared FINOS Rekor instance
(`noteworthy-transparency-log`). That establishes *"this exact set existed at time
T"*, which is the property actually wanted, and asserts nothing about
correctness — an inclusion proof cannot be misread as an endorsement.

**Rejected: an alliance signature over a maker-assembled container.** Two
faults. *Timing* — before testing, the container holds only L-1 and L0–L7, so it
is the maker's submission rather than the artifact that crosses the perimeter;
L8 is the only element that converts claims into evidence. *Instrument* — such a
signature attests "this is the set the vendor handed us," which is provenance of
receipt masquerading as verification of contents.

## 2. Contents of the evidence bundle

| Element | Why it must be inside |
|---|---|
| Artifact (or its digest + local repo locator) | the subject |
| Delivery manifest + its log inclusion proof | the frozen maker hand-off |
| Attestation set L0–L8, DSSE-wrapped | the maker's claims and the quorum's VSAs |
| L-1 contract, signed, with countersignature | the root referent every link is checked against |
| Compiled layout + `compilerVersion` | structural verification; the bank recompiles and compares (rule 14) |
| Rego policy bundle + version | semantic verification; the meaning layer |
| Trust-root snapshot (TUF metadata, versioned) | verifier registry, keys, delegations — no live TUF refresh at verify time |
| **Checkpoint set** — one Rekor checkpoint per verifier | inclusion proofs verifiable offline, **and** split-view detection: divergent tree heads across the quorum are disqualifying (`noteworthy-transparency-log`) |
| Fulcio root / cert chain | signature validity without a live CA |
| Bundle manifest | digest over every element above; the bundle's own identity |

The checkpoint is a **set, not a singleton**, precisely because the log is
FINOS-operated: a single asserted tree head would have to be trusted, whereas k
independently observed ones cannot be split without producing a dissent.

## 3. Properties

- **A container, never a credential.** The bundle carries no signature of its
  own and confers no authority on its contents. Every element inside is
  independently signed and independently verified; the manifest is a digest over
  them, nothing more. This is the property that keeps assembly from becoming a
  trust role.
- **Content-addressed.** The manifest digest is the bundle's identity, exactly as
  `sha256` is the artifact's (chain principle #1), and it is **identical across
  the OCI and tar forms**.
- **Self-verifying offline.** Every admission rule in §3.7 must be decidable from
  bundle contents alone. A rule that cannot be is a design error in the rule or a
  missing element here.
- **Replayable.** A regulator handed the bundle re-runs the gate and reaches the
  same verdict — the §8 control statement, made physically true.
- **Immutable.** Once assembled it is frozen; a new trust-root version or an
  amended contract produces a **new bundle**, not an edit.
- **Fresh, within stated limits.** Trust-root snapshot ≤ 7 days, checkpoint set
  ≤ 24 hours; tightenable per bank, never loosenable; stale is a named-rule
  reject (`noteworthy-bundle-freshness`).

## 4. What is deliberately *not* in it

- **L9 acceptance** — the bank's own control, created inside, never leaves
  (`artifact-architecture` §3.3). It is produced *against* the bundle, not
  carried by it.
- **The verdict** — likewise bank-side output, not input.
- **The bank's acceptance suite** — inspections are bank-authored only; the
  layout may require that an inspection named `bank-acceptance` exists but must
  never supply its command (`docs/osera-bank-verification.md` §7 item 4).

## 5. Data-model placement

The bundle is `immutable` + `standard-bound`, born at the **Verified → Resolved**
transition (`artifact-product-lifecycle` §3) — it is what component ③ assembles
and resolves. The delivery manifest is likewise `immutable`, born at
**Delivered**, and belongs to the outside zone. The `verdict` carries
`bundleDigest` alongside `trustRootVersion` and `trustPath`
(`artifact-data-model` §4), so a verdict names the exact evidence set it was
reached from.

## 6. Format — OCI canonical, tar projection

Decided (`noteworthy-bundle-format`): an **OCI image index with the attestation
set attached as referrers** is canonical; a **deterministic tar + manifest
export** is emitted on demand for air-gapped transfer; the manifest digest is
identical across both.

- OCI is native to the resolution path already chosen (cosign, Referrers API).
- Blobs are content-addressed and shared, so one trust-root snapshot is
  *referenced* by every bundle that uses it rather than copied into each — which
  removes the size concern entirely for the registry case.
- The tar form is fat by necessity and correct for an air gap; determinism
  (fixed entry ordering, normalized metadata, no timestamps) is required so the
  manifest digest survives the round trip.
- **Archivista becomes optional** — storage and DAG-traversal convenience, not
  transport.

**Operational consequence.** The 24-hour checkpoint clock means an air-gapped
estate must move the tar across the gap within a day of checkpoint issuance.
That is a deployment cadence the rollout plan must absorb, not a schema problem.

## 7. Open

- **External witnessing** — whether the checkpoint set should additionally be
  cross-checked against a public log or witness network for consumers outside the
  membership. Not needed for admission inside a member bank; possibly wanted for
  the regulator story (`noteworthy-transparency-log`).
