```yaml
id: artifact-ri-fixtures-spec
type: artifact
title: code_tracer — RI Phase 0 fixture spec
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-ri-scoping
  sourceRef: dadaff950befab61c9a7d73ec19d1500c7c0c65a
  contentHash: dadaff950befab61c9a7d73ec19d1500c7c0c65a
  timestamp: 2026-07-21T22:30:00Z
createdAt: 2026-07-17T21:00:00Z
updatedAt: 2026-07-27T00:00:00Z
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

## 1. Scenario — one backpatch, every value fixed

A single class-(a) bridge; fixing the values is what makes every downstream
digest consistent and the run reproducible.

- **Package:** `pkg:maven/org.apache.commons/commons-collections`
- **Baseline** `@3.2.1` → **Hardened** `@3.2.1-osera.1` (Maven's suffix form —
  `noteworthy-purl-namespace`; the ordering invariant holds here because Maven's
  version grammar sorts the qualifier above the bare version)
- **lineKey:** `…/commons-collections?osera.line=3`, so `contract.osera.line = "3"`
- **Contract:** `OSERA-2026-0142` v1
- **Governance:** team, trust path `osera-root` (a `delegated:` variant is
  listed in §7 so both paths are exercised and shown to admit identically)
- **In-scope CVE:** `CVE-2025-40142` (synthetic — fixtures use synthetic CVE ids)
- **Out-of-scope CVE:** `CVE-2024-40099`, reason "no upstream fix path"
- **Quorum:** `k=3, n=4` — deliberately not k=n, so the dissent variant can meet
  the threshold (3≥3) yet still fail zero-dissent, isolating the two clauses of
  rule 5'.

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
  gate, quorum, tar export — must preserve those bytes unchanged
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
  `provider`, `verifier-1`…`verifier-4`, `bank`, `osera-root`, `delegated-bank-a`.
- **`osera-root`** is the fixture trust anchor — a static root that certifies the
  functionary keys, standing in for Fulcio; rule 1's "certs chain to a trusted
  root" is checked against it locally.
- **Trust-root snapshot.** A static TUF-shaped metadata file with a `version` and
  an `expires`, pinned into the bundle. Rule 15's 7-day clock is evaluated
  against a fixture-supplied `now`, never wall-clock, so the corpus does not rot.
- **Checkpoint set.** Four synthetic log checkpoints, one per verifier, each a
  `{treeSize, rootHash, timestamp}` triple. In the conforming corpus all four
  agree; the `split-view` variant (§7) makes two disagree.
- Attestations are **DSSE** envelopes over in-toto Statements. **L8 is four
  separate VSA envelopes**, one per verifier key — the quorum is the set.

## 4. The conforming contract (L-1)

Schema from `osera-backpatch-contract.md` §3, filled in. Per
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
      "reproducibility": { "required": true, "level": "digest-identical" },
      "toolchain": { "digest": { "sha256": "<toolchain_digest>" } }   // third pinned material — see §9
    },
    "schedule": {
      "acceptedAt": "2026-07-01T00:00:00Z",
      "deliverBy":  "2026-07-31T00:00:00Z",
      "bridgeExpiry": "2027-06-30T00:00:00Z",
      "forwardTarget": "pkg:maven/org.apache.commons/commons-collections@4.4"
    },
    "verification": { "model": "k-of-n", "k": 3, "n": 4, "dissentPolicy": "disqualifying" },
    "legalTerms": { "warranty": "none", "digest": { "sha256": "<legal_digest>" } }
  }
}
```

`verification.k` is frozen here at issuance (`noteworthy-quorum-parameters`); the
fixture's `k=3` is also the floor, so `max(3, ceil(4/3)) = 3` holds.

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
| L8 ×4 | hardened_digest | verifier-1..4 | rebuild.digestMatch:true, log.checkpoint:{…}, osera.contract.conformance:FULL |
| L9 | hardened_digest | bank | bankTests.pass:true, promotedTo:golden |

**L3 materials are exactly three digests** — source, transformation, toolchain —
which is what rule 6 reads and no more (§9).

## 6. On-disk layout

Two containers, matching `artifact-evidence-bundle` §1: the provider's **delivery
manifest** (L-1 + L0–L7, frozen at hand-off) and the bank-assembled **evidence
bundle** that adds L8, the compiled layout, the policy, and trust material. The
local directory stands in for OCI referrers plus the attestation index.

```
fixtures/conforming/
  artifacts/   baseline.blob  hardened.blob
  contract/    osera-2026-0142.intoto.jsonl
  delivery/    manifest.json                 # L-1 + L0–L7 digests, provider-assembled
               manifest.logentry.json        # synthetic inclusion proof (the freeze)
  chain/       L0.jsonl … L7.jsonl  L8.verifier-{1..4}.jsonl  L9.jsonl
  policy/      layout.json                   # compiled from the contract
               layout.compilerVersion        # rule 14 — bank recompiles and compares
               admission.rego                # semantic pass
               schema-v1.json                # pinned; never fetched at verify
  trust/       osera-root.pub  provider.pub  verifier-{1..4}.pub  bank.pub
               tuf-snapshot.json             # version + expires, rule 15
               checkpoints.json              # four observed log heads
  deps/        resolved-manifest.json        # dependencyLock.digest target
  anchor/      registry/commons-collections-3.2.1.jar   # faked public anchor
               osv/CVE-2025-40142.json       # frozen snapshot — recordDigest is sha256 of THIS FILE
               osv/CVE-2024-40099.json       # out-of-scope advisory (locator only)
  index.json                                 # digest → attestation refs (untrusted lookup)
  manifest.json                              # bundle manifest: digest → path
```

`index.json` exists so the resolver's discovery path is exercised, and is
deliberately **not** consulted by any admission rule
(`noteworthy-attestation-index`). The `anchor/osv/` files are **byte-stable
fixtures**: once generated, they are never reformatted, because their bytes are
what `recordDigest` commits to.

## 7. Known-bad variants — the Phase 0 test matrix

Each = conforming corpus + one surgical change; must REJECT naming its rule.
Stored as overlays (`fixtures/bad/<variant>/`) so the diff documents the test.

| Variant | Mutation | Rule |
|---|---|---|
| `bad-signature` | corrupt one DSSE signature | 1 |
| `split-view` | verifier-2 and verifier-3 report divergent `rootHash` | 1 |
| `missing-vsa` | drop two L8 envelopes, leaving 2 < k | 2' |
| `dissenting-vsa` | flip verifier-4 `digestMatch:false` (3≥k but dissent present) | 5' |
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

Rule 16 gets **two** variants because it has two clauses, and they fail for
different reasons: `cve-record-tampered` breaks the digest (the snapshot was
altered in transit), while `cve-range-mismatch` leaves the digest intact and
breaks the agreement between contract and snapshot (the contract misstates what
the advisory says). A single variant would leave one clause untested.

One **positive** variant, which must still ADMIT:

| Variant | Mutation | Expectation |
|---|---|---|
| `delegated-path` | governance mode `solo`, trustPath `delegated:bank-a`, signed under the delegated namespace | **ADMIT** — identical policy across trust paths (`noteworthy-trust-root-ownership`) |

### Rule coverage

| Rule | Variant(s) |
|---|---|
| 1 signature / log validity | `bad-signature`, `split-view` |
| 2' quorum present | `missing-vsa` |
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
| 13 contract binding | `scope-mismatch`, `trustpath-mismatch` |
| 14 compile agreement | `layout-digest-mismatch` |
| 15 freshness | `stale-trust-root`, `stale-checkpoint` |
| 16 CVE-record integrity | `cve-record-tampered`, `cve-range-mismatch` |

All sixteen rules are now exercised. `corpus-substituted` is the most important
single variant in the corpus: substituting an easier test suite after the fact is
the loophole the commissioned specification exists to close, and before this
revision no variant tested it.

## 8. Fidelity caveats — stated, not hidden

- **The anchor is faked.** Rule 3 wants the baseline re-derivable from the public
  registry for its purl type; the fixture satisfies it against a local `anchor/`
  file. Real anchor re-pull is out of RI v1 scope — this is where that boundary
  bites.
- **Static keys, not keyless.** No Fulcio; `osera-root` stands in for the whole
  trust root (the deferred TUF gap).
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
  clause that previously had no test.
- **japicmp label — decided: keep the tool, and pin its version and digest.**
  The intuitive answer was to genericize, since naming a tool the fixture never
  invokes implies invocation. That is wrong, and the reason is zero dissent: if
  the contract names only a capability, one verifier running japicmp and another
  running revapi can reach different conclusions on the same artifact, and under
  a zero-dissent quorum a spurious disagreement is disqualifying. Reproducible
  verification requires the *check* to be pinned exactly as the toolchain is.
  Genericizing would manufacture dissent. The Phase 0 caveat — that the fixture
  asserts the result rather than running the tool — belongs in §8, not in the
  contract schema.

No open items remain at this level. Live constraints inherited from elsewhere:
the fixture uses Maven precisely because its suffix and anchor semantics are
settled; a semver-ecosystem fixture cannot be written until the coordinate
encoding is resolved (`noteworthy-ecosystem-generalization` §4).
