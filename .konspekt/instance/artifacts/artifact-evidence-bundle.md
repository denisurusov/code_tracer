```yaml
id: artifact-evidence-bundle
type: artifact
title: code_tracer — The evidence bundle (perimeter interface)
status: active
review: proposed
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-21T15:10:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  sourceRef: 05038f93a541216c0f6713ea13bcff58a40d823d
  contentHash: 05038f93a541216c0f6713ea13bcff58a40d823d
  timestamp: 2026-07-21T15:10:00Z
createdAt: 2026-07-21T15:10:00Z
updatedAt: 2026-07-21T15:10:00Z
```
# code_tracer — The evidence bundle (perimeter interface)

**Status:** proposed. The thing that crosses the bank boundary. Referenced by
`noteworthy-two-sited-scope`, `noteworthy-compiler-siting` and
`noteworthy-trust-root-ownership` as the interface between the issuer and
consumer sides, and until now undefined.

**Why it exists.** Because the bank verifies **hermetically and offline**
(`artifact-architecture` §1), the perimeter crossing cannot be a protocol — there
is no live call to the alliance at verify time. It is therefore a **copy of a
self-contained, content-addressed set of files**, and everything the gate needs
to reach a verdict must be inside it. Anything the gate needs that is *not* in
the bundle is, by definition, a live dependency and a violation of hermeticity.

That is the design test this artifact exists to enforce: **if the gate needs it,
it ships in the bundle.**

## 1. Contents

| Element | Why it must be inside |
|---|---|
| Artifact (or its digest + local repo locator) | the subject |
| Attestation set L0–L8, DSSE-wrapped | the maker's claims and the quorum's VSAs |
| L-1 contract, signed, with countersignature | the root referent every link is checked against |
| Compiled layout + `compilerVersion` | structural verification; the bank recompiles and compares (`noteworthy-compiler-siting`) |
| Rego policy bundle + version | semantic verification; the meaning layer |
| Trust-root snapshot (TUF metadata, versioned) | verifier registry, keys, delegations — no live TUF refresh at verify time |
| Transparency-log checkpoint (Rekor) | inclusion proofs verifiable without querying the log |
| Fulcio root / cert chain | signature validity without a live CA |
| Bundle manifest | digest over every element above; the bundle's own identity |

## 2. Properties

- **Content-addressed.** The manifest digest is the bundle's identity, exactly as
  `sha256` is the artifact's (chain principle #1).
- **Self-verifying offline.** Every admission rule in §3.7 must be decidable from
  bundle contents alone. A rule that cannot be is a design error in the rule or a
  missing element here.
- **Replayable.** A regulator handed the bundle re-runs the gate and reaches the
  same verdict — the §8 control statement, made physically true.
- **Immutable.** Once assembled it is frozen; a new trust-root version or an
  amended contract produces a **new bundle**, not an edit.

## 3. What is deliberately *not* in it

- **L9 acceptance** — the bank's own control, created inside, never leaves
  (`artifact-architecture` §3.3). It is produced *against* the bundle, not
  carried by it.
- **The verdict** — likewise bank-side output, not input.
- **The bank's acceptance suite** — inspections are bank-authored only; the
  layout may require that an inspection named `bank-acceptance` exists but must
  never supply its command (`docs/osera-bank-verification.md` §7 item 4).

## 4. Data-model placement

The bundle is `immutable` + `standard-bound`, born at the **Verified → Resolved**
transition (`artifact-product-lifecycle` §3) — it is what component ③ resolves.
The `verdict` gains `bundleDigest` alongside `trustRootVersion` and `trustPath`
(`noteworthy-trust-root-ownership`), so a verdict names the exact evidence set it
was reached from.

## 5. Open

- **Format.** OCI artifact with the attestation set as referrers, or a plain
  tar + manifest for air-gapped transfer? The OCI route is native to the
  resolution path already chosen; the tar route survives environments with no
  registry at the boundary. Possibly both, with the manifest as the invariant.
- **Freshness policy.** How stale may a trust-root snapshot or log checkpoint be
  before the gate refuses the bundle? Needs a stated maximum age, since offline
  verification forfeits TUF's own freshness guarantee.
- **Assembly siting.** Who builds the bundle — the alliance at publication, or
  the bank's resolver ③ at ingest? Affects whether the manifest is issuer-signed.
- **Size.** Attestation sets plus a full trust-root snapshot per bundle is
  duplicative across many candidates; deduplication vs self-containment is a real
  tension, and self-containment should probably win.
