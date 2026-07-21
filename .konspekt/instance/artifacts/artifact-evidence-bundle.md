```yaml
id: artifact-evidence-bundle
type: artifact
title: code_tracer — The evidence bundle (perimeter interface)
status: active
review: proposed
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-21T16:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 05038f93a541216c0f6713ea13bcff58a40d823d
  contentHash: 05038f93a541216c0f6713ea13bcff58a40d823d
  timestamp: 2026-07-21T15:10:00Z
createdAt: 2026-07-21T15:10:00Z
updatedAt: 2026-07-21T16:00:00Z
```
# code_tracer — The evidence bundle (perimeter interface)

**Status:** proposed. The thing that crosses the bank boundary. Referenced by
`noteworthy-two-sited-scope`, `noteworthy-compiler-siting` and
`noteworthy-trust-root-ownership` as the interface between the issuer and
consumer sides, and until now undefined.

> **Provenance of amendments.** §1, §3 and the resolutions in §6 derive from a
> second exchange, excerpt `b73f250d059666768988095d440fa673548ef9d2`. The
> remainder derives from the creation excerpt cited in `provenance` above.

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
| Contents | L-1 + L0–L7 | delivery manifest + L8 + layout + policy bundle + trust-root snapshot + log checkpoints |
| Purpose | freeze the submission | carry everything the gate needs, offline |
| Crosses the perimeter | no | yes |

**The delivery manifest freezes the hand-off.** Its job is to stop the maker
adjusting what it submitted after seeing how verification went — the same
loophole `L-1` closes for the test corpus, one layer out. It is checked
mechanically against `contract.requiredAttestations`: did the maker hand over
everything the contract obliged it to?

**The freeze is a transparency-log entry, not a signature.** Log the delivery
manifest digest at hand-off. That establishes *"this exact set existed at time
T"*, which is the property actually wanted, and asserts nothing about
correctness — an inclusion proof cannot be misread as an endorsement.

**Rejected: an alliance signature over a maker-assembled container.** Two
faults. *Timing* — before testing, the container holds only L-1 and L0–L7, so it
is the maker's submission rather than the artifact that crosses the perimeter;
L8 is the only element that converts claims into evidence. *Instrument* — such a
signature attests "this is the set the vendor handed us," which is provenance of
receipt masquerading as verification of contents. It would invite precisely the
inference the schematic's one-gap panel exists to prevent.

## 2. Contents of the evidence bundle

| Element | Why it must be inside |
|---|---|
| Artifact (or its digest + local repo locator) | the subject |
| Delivery manifest + its log inclusion proof | the frozen maker hand-off |
| Attestation set L0–L8, DSSE-wrapped | the maker's claims and the quorum's VSAs |
| L-1 contract, signed, with countersignature | the root referent every link is checked against |
| Compiled layout + `compilerVersion` | structural verification; the bank recompiles and compares (`noteworthy-compiler-siting`) |
| Rego policy bundle + version | semantic verification; the meaning layer |
| Trust-root snapshot (TUF metadata, versioned) | verifier registry, keys, delegations — no live TUF refresh at verify time |
| Transparency-log checkpoint (Rekor) | inclusion proofs verifiable without querying the log |
| Fulcio root / cert chain | signature validity without a live CA |
| Bundle manifest | digest over every element above; the bundle's own identity |

## 3. Properties

- **A container, never a credential.** The bundle carries no signature of its
  own and confers no authority on its contents. Every element inside is
  independently signed and independently verified; the manifest is a digest over
  them, nothing more. This is the property that keeps assembly from becoming a
  trust role.
- **Content-addressed.** The manifest digest is the bundle's identity, exactly as
  `sha256` is the artifact's (chain principle #1).
- **Self-verifying offline.** Every admission rule in §3.7 must be decidable from
  bundle contents alone. A rule that cannot be is a design error in the rule or a
  missing element here.
- **Replayable.** A regulator handed the bundle re-runs the gate and reaches the
  same verdict — the §8 control statement, made physically true.
- **Immutable.** Once assembled it is frozen; a new trust-root version or an
  amended contract produces a **new bundle**, not an edit.

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
**Delivered**, and belongs to the outside zone. The `verdict` gains
`bundleDigest` alongside `trustRootVersion` and `trustPath`
(`noteworthy-trust-root-ownership`), so a verdict names the exact evidence set it
was reached from.

## 6. Open

**Resolved by §1:**
- ~~Assembly siting~~ — the resolver ③ assembles bank-side at ingest. Because
  the bundle is a container and not a credential, assembly confers no authority,
  so ③ stays a resolver rather than becoming a trusted packager.
- ~~Manifest signature~~ — none. The freeze it was reaching for is provided by
  the delivery manifest's transparency-log entry instead.

**Still open:**
- **Format.** OCI artifact with the attestation set as referrers, or a plain
  tar + manifest for air-gapped transfer? The OCI route is native to the
  resolution path already chosen; the tar route survives environments with no
  registry at the boundary. Possibly both, with the manifest as the invariant.
- **Freshness policy.** How stale may a trust-root snapshot or log checkpoint be
  before the gate refuses the bundle? Needs a stated maximum age, since offline
  verification forfeits TUF's own freshness guarantee.
- **Size.** Attestation sets plus a full trust-root snapshot per bundle is
  duplicative across many candidates; deduplication vs self-containment is a real
  tension, and self-containment should probably win.
