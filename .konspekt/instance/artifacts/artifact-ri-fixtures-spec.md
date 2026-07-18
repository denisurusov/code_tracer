```yaml
id: artifact-ri-fixtures-spec
type: artifact
title: code_tracer — RI Phase 0 fixture spec
status: active
review: proposed
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-17T21:00:00Z
provenance:
  conversationId: konspekt-ri-scoping
  timestamp: 2026-07-17T21:00:00Z
createdAt: 2026-07-17T21:00:00Z
updatedAt: 2026-07-17T21:00:00Z
```
# code_tracer — RI Phase 0 fixture spec

**Status:** proposed, un-pinned — a living draft being iterated on (currently the
baseline/CVE referent question, §9). Details the corpus `task-fixtures` emits and
the target the Phase 1 ADMIT path is built against. Exit criteria for
`waypoint-ri-fixtures`: the conforming bundle verifies to ADMIT under a stock
verifier, and each known-bad variant (§7) drives REJECT naming its rule.

## 1. Scenario — one backpatch, every value fixed

A single class-(a) bridge; fixing the values is what makes every downstream
digest consistent and the run reproducible.

- **Package:** `pkg:maven/org.apache.commons/commons-collections`
- **Baseline** `@3.2.1` → **Hardened** `@3.2.1-osera.1` (the `-osera.N` purl,
  `noteworthy-purl-namespace`)
- **candidateKey:** `…/commons-collections?osera.line=3`, so `contract.osera.line = "3"`
- **Contract:** `OSERA-2026-0142` v1
- **In-scope CVE:** `CVE-2025-40142` (synthetic — fixtures use synthetic CVE ids)
- **Out-of-scope CVE:** `CVE-2024-40099`, reason "no upstream fix path"
- **Quorum:** `k=3, n=4` — deliberately not k=n, so the dissent variant can meet
  the threshold (3≥3) yet still fail zero-dissent, isolating the two clauses of
  rule 5'.

## 2. Digest & content-addressing scheme

Same `git hash-object` discipline as the `sources/` store, because
reproducibility *is* the replay property.

- Canonicalize every JSON object (sorted keys, no insignificant whitespace,
  UTF-8) → `sha256` → `sha256:<hex>`.
- The two artifacts are tiny synthetic blobs, distinct by construction:
  - baseline  = `commons-collections-3.2.1\nUNPATCHED\n`
  - hardened  = `commons-collections-3.2.1-osera.1\nPATCHED:CVE-2025-40142\n`
  - different bytes → `baseline_digest ≠ hardened_digest` (chain principle #2).
- Deterministic generation from a fixed seed → byte-identical output every run,
  so `gate verify` twice → identical verdict, no network.

## 3. Keys & trust root

Offline/hermetic, so Sigstore's keyless path is faked with static keys — the RI
needs *a* trust root, not the *right* one (the deferred TUF gap).

- **ed25519** keypairs, each derived deterministically from a fixed seed:
  `moderne`, `verifier-1`…`verifier-4`, `bank`, `osera-root`.
- **`osera-root`** is the fixture trust anchor — a static root that certifies the
  functionary keys, standing in for Fulcio; rule 1's "certs chain to a trusted
  root" is checked against it locally.
- Attestations are **DSSE** envelopes over in-toto Statements. **L8 is four
  separate VSA envelopes**, one per verifier key — the quorum is the set.

## 4. The conforming contract (L-1)

Schema from `osera-backpatch-contract.md` §3, filled in. `source` URIs on the
CVEs are the live, publicly re-derivable locators; `recordDigest` is the open
extension under discussion (§9).

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
    "status": "ACCEPTED",
    "osera": { "line": "3" },
    "issuer": { "id": "https://osera.finos.org", "role": "commissioner" },
    "maker":  { "id": "https://moderne.io",       "role": "producer/tester" },
    "scope": {
      "cvesInScope": [
        { "id": "CVE-2025-40142",
          "affectedComponent": "pkg:maven/org.apache.commons/commons-collections",
          "affectedRange": ">=3.0,<3.2.2",
          "source": "https://osv.dev/vulnerability/CVE-2025-40142",  // live locator
          "recordDigest": { "sha256": "<osv_record_digest>" }         // OPEN — see §9
        }
      ],
      "explicitlyOutOfScope": [
        { "id": "CVE-2024-40099",
          "affectedComponent": "pkg:maven/org.apache.commons/commons-collections",
          "reason": "no upstream fix path",
          "source": "https://osv.dev/vulnerability/CVE-2024-40099" }
      ],
      "noNewFeatures": true,
      "apiAbiStability": "required"
    },
    "baseline": {
      "purl": "pkg:maven/org.apache.commons/commons-collections@3.2.1",
      "digest": { "sha256": "<baseline_digest>" },
      "sourceRef": "git+https://github.com/apache/commons-collections@<synthetic-sha>",
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
      "apiAbi": { "tool": "japicmp", "breakingChangesAllowed": 0 },
      "patchedPathCoverage": { "min": 0.90 },
      "reproducibility": { "required": true, "level": "digest-identical" }
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

## 5. The L0–L9 set

Each a DSSE envelope; `asserts` follows data-model §4.

| Lvl | Subject | Signer | Key `asserts` (fixture values) |
|---|---|---|---|
| L0 | baseline_digest | moderne | sourceRef, coordinates == contract.baseline |
| L1 | baseline_digest | moderne | cves:[CVE-2025-40142], baselineSbomRef |
| L2 | baseline→hardened | moderne | patch.digest (the PATCHED delta) |
| L3 | hardened_digest | moderne | builder, pinned toolchain, materials=[L0,L2] |
| L4 | hardened_digest | moderne | corpus.digest == contract corpus, patchedPathCoverage:0.95 |
| L5 | hardened_digest | moderne | per cve: failsOnBaseline:true, passesOnHardened:true |
| L6 | hardened_digest | moderne | CycloneDX sbom.digest, diffVsL0 (declared only) |
| L7 | hardened_digest | moderne | per cve: status:fixed, justifiedBy:<L5 id> |
| L8 ×4 | hardened_digest | verifier-1..4 | rebuild.digestMatch:true, osera.contract.conformance:FULL |
| L9 | hardened_digest | bank | bankTests.pass:true, promotedTo:golden |

## 6. Bundle layout on disk

Local-dir stand-in for OCI referrers / Archivista, read by resolver ③.

```
fixtures/conforming/
  artifacts/  baseline.blob  hardened.blob
  contract/   osera-2026-0142.intoto.jsonl
  chain/      L0.jsonl … L7.jsonl  L8.verifier-{1..4}.jsonl  L9.jsonl
  keys/       osera-root.pub  moderne.pub  verifier-{1..4}.pub  bank.pub
  anchor/     maven-central/commons-collections-3.2.1.jar   # faked public anchor
              osv/CVE-2025-40142.json  osv/CVE-2024-40099.json  # faked advisory records
  manifest.json                                   # digest → path index
```

## 7. Known-bad variants — the Phase 0 test matrix

Each = conforming corpus + one surgical change; must REJECT naming its rule.
Stored as overlays (`fixtures/bad/<variant>/`) so the diff documents the test.

| Variant | Mutation | Expected reject | Rule |
|---|---|---|---|
| `wrong-baseline` | L0 baseline_digest ≠ contract & anchor | anchor mismatch | 3 / §3.5 |
| `scope-mismatch` | L7 marks a CVE not in cvesInScope | scope ⊄ | 13 |
| `dissenting-vsa` | flip verifier-4 digestMatch:false | zero-dissent (3≥k but dissent present) | 5' |
| `expired-layout` | bridgeExpiry in the past | layout expired | expiry |
| `missing-l5` | drop L5 for the in-scope CVE | vuln-proof incomplete | 9 |
| `undeclared-sbom` | L6 lists a component absent from the diff | SBOM integrity | 11 |

## 8. Fidelity caveats — stated, not hidden

- **The anchor is faked.** Rule 3 wants the baseline re-derivable from public
  Maven Central; the fixture satisfies it against a local `anchor/` file. Real
  anchor re-pull is out of RI v1 scope — this is where that boundary bites.
- **Static keys, not keyless.** No Fulcio/Rekor; `osera-root` stands in for the
  whole trust root (the deferred TUF gap).

## 9. Open items

- **Baseline / CVE referents (active).** Baseline already carries identity
  (digest) + re-derivable locators (purl, sourceRef, dependencyLock.digest). For
  CVEs: `source` URI restored (canonical, live-re-derivable). Undecided whether
  each in-scope CVE also carries a `recordDigest` freezing the advisory snapshot
  the scope was written against — the freeze-discipline the contract applies to
  baseline/corpus, extended to the vuln definition. If adopted, adds a seventh
  bad variant (`cve-record-tampered`).
- **SLSA materials depth (L3).** Reference the blobs by digest only, or carry a
  synthetic provenance graph deep enough to actually exercise rule 6?
- **japicmp label.** Keep the real tool name the fixture never runs, or
  genericize so Phase 0 doesn't imply invocation.
```
