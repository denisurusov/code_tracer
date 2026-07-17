# OSERA Backpatch Contract — Design Note

**Purpose:** define the binding artifact that scopes a backpatch job *before work
starts* and becomes the root the entire attestation chain is verified against.

**Companion to:** `osera-attestation-chain.md`. This contract is **L-1** — the
layer beneath L0. Every attestation from L0 (baseline) through L8 (VSA) is
checked for *conformance to this contract*, not merely for internal consistency.

**Status:** draft for the FINOS OSERA formation working group.

> **Provenance / recovery note.** Reconstructed on 2026-07-17 from the *FINOS
> OSERA project lookup* conversation (2026-07-15). The original was a
> per-conversation output file, which does not persist. Sections §1–§6 are
> recovered substantially intact; the schema block in §3 is stitched from two
> transcript fragments and may differ in minor field ordering. Re-paste the
> original for a byte-complete copy.

---

## 1. The core move: commissioned spec, not vendor declaration

The contract is **issued** by the alliance (FINOS / verifier quorum) and
**accepted** (signed) by the maker (Moderne). The maker binds itself to a scope
and a test corpus it did **not** author.

This is the whole point. It closes the single most important loophole in
maker-produced evidence:

> If the maker chooses the test corpus *after* seeing what the patch happens to
> pass, "all tests passed" means nothing. If the corpus is fixed and
> countersigned *before* work starts, "all required tests passed" is a
> verifiable claim against a frozen target.

Lifecycle:

```
  PROPOSED     issuer authors contract, defines scope + corpus + baseline + schedule
     │
     ▼  maker signs acceptance  ── corpus is now frozen; deviation requires re-issue
  ACCEPTED
     │
     ▼  maker performs work, emits L0–L7
  DELIVERED
     │
     ▼  quorum verifies output CONFORMS TO THIS CONTRACT, emits VSAs (L8)
  FULFILLED
```

**Freeze semantics:** once `ACCEPTED`, the `scope`, `baseline`, and
`acceptanceCriteria` blocks are immutable. Any change is a new contract version
with a new digest and a fresh acceptance signature. The chain records which
contract version it fulfilled.

---

## 2. What the contract binds together

Five things, each of which is otherwise a place the job can silently drift:

| Bound element | Without it, the failure mode |
|---|---|
| **Scope** — exact CVE set, in/out of scope | Scope creep; or a fix that quietly addresses less than claimed |
| **Baseline** — source ref + artifact digest + dependency versions | "Fixed from *a* version" instead of *the* version the sector runs |
| **Acceptance criteria** — the frozen test corpus + thresholds | Post-hoc corpus selection; "passed" with no fixed referent |
| **Schedule** — deliver-by, embargo, bridge expiry | Open-ended forks; missing the CRA/disclosure clock |
| **Conformance obligations** — what evidence must exist | Evidence gaps discovered at audit, not at ingest |

---

## 3. Machine-readable contract — schema sketch

Signed in-toto statement. `predicateType: osera/backpatch-contract/v1`. Subject
is the **baseline** digest (the thing the work is *about*); the hardened output
does not exist yet at issue time.

```jsonc
{
  "_type": "https://in-toto.io/Statement/v1",

  // subject = what the work starts FROM. hardened artifact is not yet minted.
  "subject": [{
    "name": "pkg:maven/org.example/commons-x@1.2.3",
    "digest": { "sha256": "<baseline_digest>" }
  }],

  "predicateType": "osera/backpatch-contract/v1",
  "predicate": {

    "contractId": "OSERA-2026-0142",
    "version": 1,
    "status": "ACCEPTED",

    "issuer":   { "id": "https://osera.finos.org", "role": "commissioner" },
    "maker":    { "id": "https://moderne.io",       "role": "producer/tester" },

    // ── SCOPE ─────────────────────────────────────────────
    "scope": {
      "cvesInScope": [
        { "id": "CVE-2025-XXXXX",
          "affectedComponent": "pkg:maven/org.example/commons-x",
          "affectedRange": ">=1.0.0,<1.2.4",
          "source": "https://osv.dev/vulnerability/CVE-2025-XXXXX" }  // publicly re-derivable
      ],
      "explicitlyOutOfScope": [
        // CVEs present in the baseline but NOT being fixed — stated, not silent
        { "id": "CVE-2024-YYYYY", "reason": "no available upstream fix path" }
      ],
      "noNewFeatures": true,          // backpatch discipline: fix only, no drift
      "apiAbiStability": "required"   // must not break the version already deployed
    },

    // ── BASELINE ──────────────────────────────────────────
    "baseline": {
      "purl": "pkg:maven/org.example/commons-x@1.2.3",
      "digest": { "sha256": "<baseline_digest>" },
      "sourceRef": "git+https://github.com/example/commons-x@<commit-sha>",
      "anchorPublic": true,           // digest re-pullable from Maven Central
      "dependencyLock": { "digest": {"sha256": "<resolved-deps-manifest-digest>"} }
      // freezes the transitive dependency set the fix is built against
    },

    // ── ACCEPTANCE CRITERIA (the frozen corpus) ───────────
    "acceptanceCriteria": {
      "testCorpus": {
        // the corpus is content-addressed and named BEFORE work starts
        "upstreamSuite": { "ref": "<commit-sha>", "digest": {"sha256":"<suite-digest>"} },
        "requiredResult": "identical-to-baseline",   // 0 regressions vs unpatched
        "supplementalTests": {                        // added specifically for this contract
          "digest": {"sha256": "<supplemental-suite-digest>"}
        }
      },
      "vulnProofRequired": {
        // per in-scope CVE: a test that FAILS on baseline, PASSES on hardened
        "perCve": true,
        "mustFailOnBaseline": true,
        "mustPassOnHardened": true
      },
      "apiAbi": { "tool": "japicmp|revapi", "breakingChangesAllowed": 0 },
      "patchedPathCoverage": { "min": 0.90 },   // coverage of the CHANGED code, not overall
      "reproducibility": { "required": true, "level": "digest-identical" }
    },

    // ── SCHEDULE ──────────────────────────────────────────
    "schedule": {
      "acceptedAt":   "2026-07-01T00:00:00Z",
      "deliverBy":    "2026-07-31T00:00:00Z",
      "embargoUntil": "2026-07-15T00:00:00Z",   // no publication before disclosure
      "bridgeExpiry": "2027-06-30T00:00:00Z",   // debt clock — carried into the VSA
      "forwardTarget": "pkg:maven/org.example/commons-x@2.4.0"
    },

    // ── CONFORMANCE OBLIGATIONS ───────────────────────────
    // the exact attestation set that must exist for the chain to be FULFILLED
    "requiredAttestations": [
      "osera/baseline/v1", "osera/vuln-assessment/v1", "osera/transformation/v1",
      "https://slsa.dev/provenance/v1", "osera/test-results/v1",
      "osera/vuln-proof/v1", "https://cyclonedx.org/bom", "https://openvex.dev/ns/v0.2.0"
    ],
    "verification": {
      "model": "k-of-n",
      "k": 3,
      "dissentPolicy": "disqualifying"   // see attestation-chain §8.3
    },

    // ── LEGAL BINDING (pointer, not the terms themselves) ─
    "legalTerms": {
      "agreementRef": "https://osera.finos.org/legal/participation-v1",
      "warranty": "none",               // consumed as-is; see §5
      "digest": { "sha256": "<legal-doc-digest>" }
    }
  }
}
```

---

## 4. How the contract binds the chain

The contract is not a document that sits beside the chain — it is the
**referent** every link points back to:

- **L0 Baseline** must equal `contract.baseline.digest`. Mismatch ⇒ wrong
  starting point ⇒ reject.
- **L1 Vuln Assessment** must cover *exactly* `contract.scope.cvesInScope` — no
  more (silent scope creep), no fewer (under-delivery). Out-of-scope CVEs must
  match `explicitlyOutOfScope`.
- **L4 Test Results** must be results *of the corpus named in*
  `contract.acceptanceCriteria.testCorpus` — verified by digest, so the maker
  cannot substitute an easier suite.
- **L5 Vuln Proof** must exist for each `cvesInScope` entry, satisfying the
  fail-on-baseline / pass-on-hardened obligation the contract fixed in advance.
- **L8 VSA** gains one field: `contractConformance`. The verifier asserts not
  just "digest matched, tests passed" but **"output conforms to contract
  OSERA-2026-0142 v1."**

New VSA field:

```jsonc
"osera": {
  "contract": {
    "id": "OSERA-2026-0142",
    "version": 1,
    "digest": { "sha256": "<contract_digest>" },
    "conformance": "FULL",          // FULL | PARTIAL | BREACH
    "corpusMatchedContract": true,  // the tests run == the tests promised
    "scopeMatchedContract": true,   // CVEs fixed == CVEs commissioned
    "deliveredWithinSchedule": true
  }
}
```

New admission-policy rule (append to attestation-chain §6):

```
 13. resolve contract C = V.osera.contract.digest
     AND C.status == ACCEPTED, signed by maker trust-anchor
     AND V.osera.contract.conformance == "FULL"
     AND C.scope.cvesInScope ⊆ (CVEs marked fixed in L7 VEX)
     → otherwise: DO NOT PROMOTE
```

**Net effect:** the bank's gate no longer asks "did the maker do good work?" It
asks "did the output conform to a scope the maker committed to *before
starting*, independently verified?" That is a categorically stronger control
statement, and it is the sentence that belongs in the DORA/CRA narrative.

---

## 5. The legal stub (Reading B — deliberately short)

The machine-readable contract is the load-bearing artifact. The legal layer
exists only to make it *mean* something and to answer the questions the schema
deliberately does not:

- **Warranty:** almost certainly `none` — a neutral non-profit venue
  distributing hardened OSS will not warrant fitness. This is not a gap to fix;
  it is a **finding the bank's risk function must formally accept in writing.**
  The machine-readable contract is what *bounds* that acceptance: "as-is, but
  provably conforming to a committed scope and corpus" is a far more acceptable
  as-is than "as-is, trust us."
- **Liability / indemnity:** who is answerable when a conforming backpatch
  nonetheless breaks production? Likely no one contractually — which is exactly
  why the bank's own L9 acceptance testing is non-optional, not a nicety.
- **IP / licence:** the backpatch inherits the upstream licence; the recipe set
  and supplemental tests need their own licence grant to the alliance.
- **Data / embargo:** pre-disclosure CVE handling obligations bind the maker
  before `embargoUntil`.

The legal terms are referenced from the contract by digest (`legalTerms`), so
the exact version of the terms in force is itself part of the immutable, signed
record. When the terms change, the digest changes, and every contract accepted
under the old terms remains provably bound to the old terms.

---

## 6. Open questions for the working group

1. **Amendment vs re-issue:** if scope changes mid-flight, is that a version
   bump (new acceptance signature) or a fresh contract? Recommend version bump
   with explicit supersession pointer — preserves the audit trail of what
   changed and when.
2. **Partial fulfilment:** if the maker fixes 4 of 5 in-scope CVEs, is that
   `PARTIAL` conformance that still promotes (with the 5th tracked as open), or a
   breach that blocks the whole release? Recommend PARTIAL-promotable with the
   shortfall carried as an explicit open exposure — blocking punishes honest
   partial delivery.
3. **Who can issue a contract?** Any participant, or only the alliance
   governance body? Ties to the Risk Navigator: contracts should be issued off
   the ranked backpatch-candidate list, not ad hoc.
4. **Corpus provenance:** the supplemental test suite is executable code the
   maker is bound to. Should it carry its own attestation (who wrote it, is it
   adversarial enough)? Recommend yes — same argument as attesting the recipe set.
5. **Schedule breach:** is late delivery a conformance failure or just a flag?
   Recommend flag-not-fail — a late but correct backpatch is still valuable; the
   schedule is for planning, not for gating security outcomes.
