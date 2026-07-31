```yaml
id: artifact-ri-fixtures-spec
type: artifact
title: code_tracer — RI Phase 0 fixture spec
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-30T00:00:00Z
provenance:
  conversationId: konspekt-ri-scoping
  sourceRef: dadaff950befab61c9a7d73ec19d1500c7c0c65a
  contentHash: dadaff950befab61c9a7d73ec19d1500c7c0c65a
  timestamp: 2026-07-21T22:30:00Z
createdAt: 2026-07-17T21:00:00Z
updatedAt: 2026-07-30T00:00:00Z
```
# code_tracer — RI Phase 0 fixture spec

**Status:** accepted and pinned. §9 is closed. Details the corpus
`task-fixtures` emits and the target the Phase 1 ADMIT path is built against.

**Exit criteria for `waypoint-ri-fixtures`:** the conforming bundle verifies to
ADMIT under a stock verifier, and each known-bad variant (§7) drives REJECT
**naming its rule**. The variant matrix must reach every admission rule that is
decidable from fixture data — see the coverage table in §7.

> **Amendment 2026-07-21.** Original excerpt `60ce5a5b288716680b0ccc022e7398031cbb88d5`;
> this revision derives from `dadaff950befab61c9a7d73ec19d1500c7c0c65a`. Brings
> the spec into line with decisions taken after it was first written — governance
> block, `verification.k`, `compilerVersion`, trust-root snapshot and checkpoint
> set, the delivery-manifest / evidence-bundle split, and rules 14–15 — and
> closes both remaining §9 items.

> **Amendment 2026-07-27.** Rule 16 (CVE-record integrity) added to
> `artifact-architecture` §3.7; `cve-record-tampered` re-keyed from rule 13 to
> rule 16 and given its own coverage row. Vocabulary per
> `noteworthy-lifecycle-nouns`.

> **Amendment 2026-07-27 (recordDigest).** `recordDigest` is **`sha256` over the
> pinned advisory snapshot exactly as carried**, not over a canonical form — see
> `noteworthy-record-digest`. This is a deliberate exception to §2's general
> canonicalize-then-hash rule, and it is what makes the `cve-record-tampered`
> variant constructible: without it, the generator would be hashing by a
> convention no other implementation is bound to, and the corpus would pass
> against itself while testing nothing.

> **Amendment 2026-07-30 (`noteworthy-signer-verification`,
> `noteworthy-adoption-rebuild`).** The scenario was built on `k=3, n=4`, and its
> dissent variant was designed to sit between the two — 3 present, one
> disagreeing — to isolate the clauses of rule 5′. That threshold is retired:
> **every signatory verifies and all must agree**, so the corpus now has four
> signatories and the two clauses separate more cleanly than before (one missing
> versus one disagreeing). The contract gains `governance.signatories[]` and
> digest-pinned `rebuild` references; the bank contributes **its own L8** over a
> rebuild, which needs a variant of its own; and the positive `solo` variant
> becomes a real test of mode-independence rather than a trust-path relabel.

## 1. Scenario — one backpatch, every value fixed

A single class-(a) bridge; fixing the values is what makes every downstream
digest consistent and the run reproducible.

- **Package:** `pkg:maven/org.apache.commons/commons-collections`
- **Baseline** `@3.2.1` → **Hardened** `@3.2.1-osera.1` (Maven's suffix form —
  `noteworthy-purl-namespace`; the ordering invariant holds here because Maven's
  version grammar sorts the qualifier above the bare version)
- **lineKey:** `…/commons-collections?osera.line=3`, so `contract.osera.line = "3"`
- **Contract:** `OSERA-2026-0142` v1
- **Governance:** team, trust path `osera-root`, **four signatories** (a solo
  variant with one signatory is listed in §7 so both modes are exercised and
  shown to admit identically)
- **In-scope CVE:** `CVE-2025-40142` (synthetic — fixtures use synthetic CVE ids)
- **Out-of-scope CVE:** `CVE-2024-40099`, reason "no upstream fix path"
- **Verification:** all four signatories, zero dissent, **plus the adopting
  bank's own L8**. Four is chosen over the minimum of two so that a variant can
  drop one signatory and still leave three — a corpus that fails for the right
  reason rather than for falling under a floor.

## 2. Digest & content-addressing scheme

Same `git hash-object` discipline as the `sources/` store, because
reproducibility *is* the replay property.

- Canonicalize every JSON object the generator **authors** (sorted keys, no
  insignificant whitespace, UTF-8) → `sha256` → `sha256:<hex>`. This covers the
  contract, the attestation envelopes, the layout and the manifests — objects
  the fixture generator creates and therefore controls.
- **Exception: `recordDigest`.** Advisory snapshots are objects the generator
  *carries* rather than authors, and rule 16 digests them **as carried**. Hash
  the file bytes; do not canonicalize, re-indent or re-encode. Every consumer —
  gate, signatories, tar export — must preserve those bytes unchanged
  (`noteworthy-record-digest`).
- The two artifacts are tiny synthetic blobs, distinct by construction:
  - baseline  = `commons-collections-3.2.1\nUNPATCHED\n`
  - hardened  = `commons-collections-3.2.1-osera.1\nPATCHED:CVE-2025-40142\n`
  - different bytes → `baseline_digest ≠ hardened_digest` (chain principle #2).
- Deterministic generation from a fixed seed → byte-identical output every run,
  so `gate verify` twice → identical verdict, no network.

## 3. Keys, trust root, and log

Offline/hermetic, so Sigstore's keyless path is faked with static keys — the RI
needs *a* trust root, not the *right* one (the deferred TUF gap).

- **ed25519** keypairs, each derived deterministically from a fixed seed:
  `provider`, `signatory-1`…`signatory-4`, `bank`, `bank-verify`, `osera-root`,
  `delegated-bank-a`.
- **`bank` and `bank-verify` are separate keys on purpose.** The bank signs L9
  and the verdict with one, and its own L8 with the other, because a member's
  verification and admission functions should be separately keyed
  (`noteworthy-revocation-semantics`). The fixture is the cheapest place to make
  that concrete rather than aspirational.
- **`osera-root`** is the fixture trust anchor — a static root that certifies the
  functionary keys, standing in for Fulcio; rule 1's "certs chain to a trusted
  root" is checked against it locally.
- **Trust-root snapshot.** A static TUF-shaped metadata file with a `version` and
  an `expires`, pinned into the bundle. Rule 15's 7-day clock is evaluated
  against a fixture-supplied `now`, never wall-clock, so the corpus does not rot.
- **Checkpoint set.** Four synthetic log checkpoints, one per signatory, each a
  `{treeSize, rootHash, timestamp}` triple. In the conforming corpus all four
  agree; the `split-view` variant (§7) makes two disagree.
- Attestations are **DSSE** envelopes over in-toto Statements. **L8 is five
  separate VSA envelopes** — one per signatory, plus one from `bank-verify`.

## 4. The conforming contract (L-1)

Schema from `docs/historical/osera-backpatch-contract.md` §3, filled in. Per
`noteworthy-referent-binding`, referents bind by their nature: the **baseline**
is the immutable-anchor case (digest + re-derivable purl/sourceRef, must-match-
live); **in-scope CVEs** are the mutable-snapshot case — `source` (live OSV
locator, advisory) + `recordDigest` (frozen snapshot of the record at
commissioning, digested as carried) + `affectedRange` checked against that
snapshot.

```jsonc
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [{
    "name": "pkg:maven/org.apache.commons/commons-collections@3.2.1",
    "digest": { "sha256": "<baseline_digest>" }
  }],
  "predicateType": "osera/backpatch-contract/v1",
  "predicate": {
    "contractId": "OSERA-2026-0142",
    "version": 1,
    "schemaVersion": "v1",                          // pinned; ships in the bundle
    "status": "ACCEPTED",
    "osera": { "line": "3" },
    "governance": {                                  // noteworthy-governance-modes
      "mode": "team",
      "sponsor": "https://osera.finos.org",
      "signatories": [ "bank-a", "bank-b", "bank-c", "bank-d" ],
      "mandateRef": { "sha256": "<vote_record_digest>" },
      "trustPath": "osera-root"
    },
    "issuer": { "id": "https://osera.finos.org", "role": "commissioner" },
    "provider":  { "id": "https://provider.example",   "role": "producer/tester" },
    "scope": {
      "cvesInScope": [
        { "id": "CVE-2025-40142",
          "affectedComponent": "pkg:maven/org.apache.commons/commons-collections",
          "affectedRange": ">=3.0,<3.2.2",           // must match the pinned snapshot
          "source": "https://osv.dev/vulnerability/CVE-2025-40142",  // live locator, advisory
          "recordDigest": { "sha256": "<osv_record_digest>" }         // sha256 of the snapshot AS CARRIED
        }
      ],
      "explicitlyOutOfScope": [
        { "id": "CVE-2024-40099",
          "affectedComponent": "pkg:maven/org.apache.commons/commons-collections",
          "reason": "no upstream fix path",
          "source": "https://osv.dev/vulnerability/CVE-2024-40099" }  // locator only
      ],
      "noNewFeatures": true,
      "apiAbiStability": "required"
    },
    "baseline": {
      "purl": "pkg:maven/org.apache.commons/commons-collections@3.2.1",
      "digest": { "sha256": "<baseline_digest>" },
      "sourceRef": "git+https://github.com/apache/commons-collections@<synthetic-sha>",
      "anchorClass": "immutable-registry",           // noteworthy-ecosystem-generalization §1
      "anchorPublic": true,
      "dependencyLock": { "digest": { "sha256": "<deps_digest>" } }
    },
    "rebuild": {                                     // noteworthy-adoption-rebuild
      "source":         { "locator": "file:anchor/src/commons-collections-3.2.1-src.tar",
                          "digest": { "sha256": "<src_digest>" } },
      "transformation": { "digest": { "sha256": "<patch_digest>" } },
      "toolchain":      { "locator": "file:anchor/toolchain/jdk8-fixture.tar",
                          "digest": { "sha256": "<toolchain_digest>" } }
    },
    "acceptanceCriteria": {
      "testCorpus": {
        "upstreamSuite":     { "digest": { "sha256": "<suite_digest>" } },
        "supplementalTests": { "digest": { "sha256": "<supp_digest>" } },
        "requiredResult": "identical-to-baseline"
      },
      "vulnProofRequired": { "perCve": true, "mustFailOnBaseline": true, "mustPassOnHardened": true },
      "apiAbi": {
        "tool": "japicmp",                           // pinned by name AND digest — see §9
        "toolVersion": "0.18.3",
        "toolDigest": { "sha256": "<japicmp_digest>" },
        "breakingChangesAllowed": 0
      },
      "patchedPathCoverage": { "min": 0.90 },
      "reproducibility": { "required": true, "level": "digest-identical" }
    },
    "schedule": {
      "acceptedAt": "2026-07-01T00:00:00Z",
      "deliverBy":  "2026-07-31T00:00:00Z",
      "bridgeExpiry": "2027-06-30T00:00:00Z",
      "forwardTarget": "pkg:maven/org.apache.commons/commons-collections@4.4"
    },
    "verification": { "k": [ "bank-a", "bank-b", "bank-c", "bank-d" ],
                      "dissentPolicy": "disqualifying" },
    "legalTerms": { "warranty": "none", "digest": { "sha256": "<legal_digest>" } }
  }
}
```

`verification.k` is the signatory set itself, frozen here at issuance
(`noteworthy-signer-verification`). It duplicates `governance.signatories` by
design — one names who is accountable for commissioning, the other is what rules
2′ and 5′ evaluate against — and the fixture asserts they agree, which is itself
a checkable invariant worth a variant (§7).

The **`rebuild` block** is what lets any signatory and, later, any adopting bank
reproduce the build. References carry a locator plus a digest and never bytes;
in the fixture the locators resolve into `anchor/`, which is where the faked
public sources live (§8).

## 5. The L0–L9 set

Each a DSSE envelope; `asserts` follows data-model §4.

| Lvl | Subject | Signer | Key `asserts` (fixture values) |
|---|---|---|---|
| L0 | baseline_digest | provider | sourceRef, coordinates == contract.baseline |
| L1 | baseline_digest | provider | cves:[CVE-2025-40142], baselineSbomRef |
| L2 | baseline→hardened | provider | patch.digest (the PATCHED delta) |
| L3 | hardened_digest | provider | builder, materials=[L0.digest, L2.digest, toolchain.digest] |
| L4 | hardened_digest | provider | corpus.digest == contract corpus, patchedPathCoverage:0.95 |
| L5 | hardened_digest | provider | per cve: failsOnBaseline:true, passesOnHardened:true |
| L6 | hardened_digest | provider | CycloneDX sbom.digest, diffVsL0 (declared only) |
| L7 | hardened_digest | provider | per cve: status:fixed, justifiedBy:<L5 id> |
| L8 ×4 | hardened_digest | signatory-1..4 | rebuild.digestMatch:true, log.checkpoint:{…}, osera.contract.conformance:FULL |
| L8 ×1 | hardened_digest | bank-verify | rebuild.digestMatch:true — **the adopting bank's own**, sealed into the envelope rather than the core |
| L9 | hardened_digest | bank | bankTests.pass:true, promotedTo:golden |

**L3 materials are exactly three digests** — source, transformation, toolchain —
which is what rule 6 reads and no more (§9). They are the same three the
contract's `rebuild` block pins, which is what makes the bank's reproduction
checkable against the provider's claim.

## 6. On-disk layout

Two containers, matching `artifact-evidence-bundle` §1: the provider's **delivery
manifest** (L-1 + L0–L7, frozen at hand-off) and the bank-assembled **ingest
envelope** over the issuer-sealed **evidence core**. The local directory stands
in for OCI referrers plus the attestation index.

```
fixtures/conforming/
  artifacts/   baseline.blob  hardened.blob
  contract/    osera-2026-0142.intoto.jsonl
  delivery/    manifest.json                 # L-1 + L0–L7 digests, provider-assembled
               manifest.logentry.json        # synthetic inclusion proof (the freeze)
  core/        core.json                     # issuer-sealed: manifest + L-1 + L0–L8(×4)
                                             #   + layout + policy + snapshots + rebuild refs
               core.logentry.json
  chain/       L0.jsonl … L7.jsonl  L8.signatory-{1..4}.jsonl
               L8.bank.jsonl                 # the adopting bank's own rebuild
               L9.jsonl
  policy/      layout.json                   # compiled from the contract
               layout.compilerVersion        # rule 14 — bank recompiles and compares
               admission.rego                # semantic pass
               schema-v1.json                # pinned; never fetched at verify
  trust/       osera-root.pub  provider.pub  signatory-{1..4}.pub
               bank.pub  bank-verify.pub
               tuf-snapshot.json             # version + expires, rule 15
               checkpoints.json              # four observed log heads
  deps/        resolved-manifest.json        # dependencyLock.digest target
  anchor/      registry/commons-collections-3.2.1.jar   # faked public anchor
               src/commons-collections-3.2.1-src.tar    # rebuild source, pinned
               toolchain/jdk8-fixture.tar               # rebuild toolchain, pinned
               osv/CVE-2025-40142.json       # frozen snapshot — recordDigest is sha256 of THIS FILE
               osv/CVE-2024-40099.json       # out-of-scope advisory (locator only)
  index.json                                 # digest → attestation refs (untrusted lookup)
  manifest.json                              # envelope manifest: digest → path
```

`index.json` exists so the resolver's discovery path is exercised, and is
deliberately **not** consulted by any admission rule
(`noteworthy-attestation-index`). The `anchor/osv/` files are **byte-stable
fixtures**: once generated, they are never reformatted, because their bytes are
what `recordDigest` commits to. `anchor/src/` and `anchor/toolchain/` stand in
for what a real bank fetches at resolution before sealing.

## 7. Known-bad variants — the Phase 0 test matrix

Each = conforming corpus + one surgical change; must REJECT naming its rule.
Stored as overlays (`fixtures/bad/<variant>/`) so the diff documents the test.

| Variant | Mutation | Rule |
|---|---|---|
| `bad-signature` | corrupt one DSSE signature | 1 |
| `split-view` | signatory-2 and signatory-3 report divergent `rootHash` | 1 |
| `missing-vsa` | drop signatory-4's L8, leaving three of four signatories | 2' |
| `missing-bank-vsa` | drop the bank's own L8 from the envelope | 2' |
| `dissenting-vsa` | all five L8s present; flip signatory-4 `digestMatch:false` | 5' |
| `signatory-set-mismatch` | `verification.k` lists a party absent from `governance.signatories` | 13 |
| `wrong-baseline` | L0 baseline_digest ≠ contract & anchor | 3 |
| `broken-dag` | L3 materials reference an attestation not in the set | 4 |
| `toolchain-drift` | L3 toolchain digest ≠ the contract's pinned toolchain | 6 |
| `patch-digest-drift` | L2 recipe digest ≠ what the layout expects | 7 |
| **`corpus-substituted`** | **L4 corpus.digest ≠ contract testCorpus digest** | **8** |
| `coverage-below-threshold` | L4 patchedPathCoverage 0.85 < 0.90 | 8 |
| `missing-l5` | drop L5 for the in-scope CVE | 9 |
| `vex-unjustified` | L7 marks fixed with no `justifiedBy` | 10 |
| `undeclared-sbom` | L6 lists a component absent from the diff | 11 |
| `version-string-subject` | one subject identified by version string, no digest | 12 |
| `scope-mismatch` | L7 marks a CVE not in cvesInScope | 13 |
| `trustpath-mismatch` | `governance.trustPath` ≠ the signing namespace | 13 |
| `cve-record-tampered` | alter one byte of `anchor/osv/CVE-2025-40142.json`, leaving `recordDigest` unchanged | 16 |
| `cve-range-mismatch` | contract `affectedRange` disagrees with the (untampered) snapshot | 16 |
| `layout-digest-mismatch` | distributed layout ≠ locally recompiled layout | 14 |
| `stale-trust-root` | TUF snapshot older than 7 days against fixture `now` | 15 |
| `stale-checkpoint` | checkpoint set older than 24 hours against fixture `now` | 15 |
| `expired-bridge` | bridgeExpiry in the past | expiry |

**Rule 2′ now has two variants because it has two obligations**, and they fail on
different sides of the perimeter: `missing-vsa` is an outside signatory who never
verified, `missing-bank-vsa` is the adopting bank's own rebuild absent. Under the
old `k=3, n=4` scheme the first of these had to drop *two* envelopes to fall
under the threshold; with every signatory required, dropping one is enough, and
the variant now fails for the reason it is named after.

`dissenting-vsa` correspondingly gets cleaner: the full set is present and one
disagrees, which isolates 5′ from 2′ without needing a threshold to sit between
them.

Rule 16 gets **two** variants because it has two clauses, and they fail for
different reasons: `cve-record-tampered` breaks the digest (the snapshot was
altered in transit), while `cve-range-mismatch` leaves the digest intact and
breaks the agreement between contract and snapshot (the contract misstates what
the advisory says). A single variant would leave one clause untested.

One **positive** variant, which must still ADMIT:

| Variant | Mutation | Expectation |
|---|---|---|
| `solo-path` | mode `solo`, one signatory, trustPath `delegated:bank-a`, signed under the delegated namespace — **and the bank's own L8 unchanged** | **ADMIT** — identical policy and identical inside-zone work across modes (`noteworthy-trust-root-ownership`, `noteworthy-adoption-rebuild`) |

This variant carries more weight than it used to. Under the old scheme it changed
a trust-path label; now it drops the outside evidence from four reproductions to
one and must *still* admit, which is exactly the claim that solo output needs no
weaker tier — and the reason it holds is the bank's own L8, which the variant
leaves untouched.

### Rule coverage

| Rule | Variant(s) |
|---|---|
| 1 signature / log validity | `bad-signature`, `split-view` |
| 2' every signatory present, plus the bank | `missing-vsa`, `missing-bank-vsa` |
| 3 anchor | `wrong-baseline` |
| 4 DAG integrity | `broken-dag` |
| 5' zero dissent | `dissenting-vsa` |
| 6 build integrity | `toolchain-drift` |
| 7 transformation integrity | `patch-digest-drift` |
| 8 test conformance | `corpus-substituted`, `coverage-below-threshold` |
| 9 vuln-proof completeness | `missing-l5` |
| 10 VEX ↔ proof linkage | `vex-unjustified` |
| 11 SBOM integrity | `undeclared-sbom` |
| 12 digest binding | `version-string-subject` |
| 13 contract binding | `scope-mismatch`, `trustpath-mismatch`, `signatory-set-mismatch` |
| 14 compile agreement | `layout-digest-mismatch` |
| 15 freshness | `stale-trust-root`, `stale-checkpoint` |
| 16 CVE-record integrity | `cve-record-tampered`, `cve-range-mismatch` |

All sixteen rules are exercised. `corpus-substituted` remains the most important
single variant in the corpus: substituting an easier test suite after the fact is
the loophole the commissioned specification exists to close.

## 8. Fidelity caveats — stated, not hidden

- **The anchor is faked.** Rule 3 wants the baseline re-derivable from the public
  registry for its purl type; the fixture satisfies it against a local `anchor/`
  file. Real anchor re-pull is out of RI v1 scope — this is where that boundary
  bites.
- **The bank's rebuild is asserted, not performed.** `L8.bank` states
  `digestMatch:true`; Phase 0 does not actually rebuild from `anchor/src` and
  `anchor/toolchain`. The pinned references exist so the contract and the core
  are honest about what a real resolution step must fetch and run, and so
  `toolchain-drift` has something to disagree with. Performing the rebuild is a
  Phase 1 question.
- **Static keys, not keyless.** No Fulcio; `osera-root` stands in for the whole
  trust root (the deferred TUF gap). `bank` and `bank-verify` are distinct, which
  makes the separately-keyed-functions recommendation testable.
- **The transparency log is synthetic.** Checkpoints are fixture-generated
  triples, and the delivery manifest's inclusion proof is fabricated. This
  exercises the *shape* of split-view detection without a real log.
- **CVE live-pull is faked, and faithfulness is untested.** Per
  `noteworthy-referent-binding` the `source` pointer is advisory-only in
  production; in the fixture it resolves to the local `anchor/osv/` snapshot, and
  only `recordDigest` gates. Note what this does *not* cover: whether the
  snapshot is faithful to what OSV actually served is an issuer-side question,
  open in `artifact-architecture` §9, and no fixture here speaks to it.
- **`now` is supplied, never read from the clock.** Rules 15 and the expiry check
  evaluate against a fixture-supplied timestamp so the corpus does not rot and
  runs identically in a year.
- **The API/ABI tool is pinned but not invoked.** L4 asserts the japicmp result;
  Phase 0 does not run it. The pin exists so the contract is honest about what
  Phase 1 must execute (§9).
- **The attestation index is present but not load-bearing.** `index.json`
  exercises the resolver's discovery path; no admission rule reads it.

## 9. Resolved — formerly open

- **Baseline / CVE referents — decided.** Baseline is the immutable-anchor case
  (digest + purl + sourceRef, must-match-live). In-scope CVEs are the mutable-
  snapshot case: `source` (live OSV) + `recordDigest` (frozen snapshot) +
  checkable `affectedRange`. See `noteworthy-referent-binding`.
- **`recordDigest` form — decided: bytes as carried.** No canonicalization, per
  `noteworthy-record-digest`. This is what makes the two rule-16 variants
  constructible and keeps the generator from inventing a convention no other
  implementation is bound to.
- **SLSA materials depth (L3) — decided: digest-only, plus the toolchain.**
  Rule 6 asks whether the artifact was built from L0 source + L2 transformation
  on the pinned toolchain. Digest references to L0 and L2 cover two of the three
  clauses; a deeper synthetic provenance graph (transitive build dependencies,
  plugin versions) would add surface no admission rule reads. So depth buys
  nothing — but the **toolchain must be a digest-addressed material in its own
  right**, or rule 6's third clause has nothing to check against. `materials` is
  therefore exactly three digests, and `toolchain-drift` (§7) exercises the
  clause that previously had no test. The same three now appear in the
  contract's `rebuild` block, which is what a real adopter fetches.
- **japicmp label — decided: keep the tool, and pin its version and digest.**
  The intuitive answer was to genericize, since naming a tool the fixture never
  invokes implies invocation. That is wrong, and the reason is zero dissent: if
  the contract names only a capability, one signatory running japicmp and another
  running revapi can reach different conclusions on the same artifact, and under
  a zero-dissent rule a spurious disagreement is disqualifying. Reproducible
  verification requires the *check* to be pinned exactly as the toolchain is.
  Genericizing would manufacture dissent. The Phase 0 caveat — that the fixture
  asserts the result rather than running the tool — belongs in §8, not in the
  contract schema.

No open items remain at this level. Live constraints inherited from elsewhere:
the fixture uses Maven precisely because its suffix and anchor semantics are
settled; a semver-ecosystem fixture cannot be written until the coordinate
encoding is resolved (`noteworthy-ecosystem-generalization` §4).
