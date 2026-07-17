# OSERA Attestation Chain (L0–L9)

**Status:** draft for the FINOS OSERA formation working group.

> **Provenance / recovery note.** This document was reconstructed on 2026-07-17
> from the *FINOS OSERA project lookup* design conversation (2026-07-15/16). The
> original was a per-conversation output file, which does not persist. Sections
> §1–§2 are recovered in full; §3, §6, §8, §9 are partially preserved and are
> marked inline. Re-paste the original to complete the marked sections.

---

## 1. Core principles

1. **Everything is digest-bound.** No attestation refers to a version string.
   Subjects are `sha256` digests plus a `purl`. Version strings are metadata,
   never identity.
2. **Two artifacts, always named.** Every link in the chain carries both
   `baseline_digest` (the vulnerable upstream artifact) and `hardened_digest`
   (the OSERA output). A claim that names only one is unverifiable and MUST be
   rejected.
3. **The chain is a DAG, not a list.** Each attestation references its inputs by
   attestation digest. The graph is traversable from the deployed artifact back
   to the upstream commit.
4. **The anchor must be independently observable.** See §3 — this is the single
   most important property and the easiest to get wrong.
5. **Attestations are OCI referrers / sigstore bundles resolvable from the
   artifact digest.** Not links in release notes. Not rows in a portal.

---

## 2. The chain

| #  | Attestation | Signer | Asserts | Subject |
|----|-------------|--------|---------|---------|
| L0 | **Baseline** | Moderne | This is the upstream artifact and source commit we started from | baseline_digest |
| L1 | **Vulnerability Assessment** | Moderne | These CVEs affect these components in the baseline SBOM | baseline_digest |
| L2 | **Transformation** | Moderne | This content-addressed recipe set / source patch was applied | baseline → hardened |
| L3 | **Build Provenance** (SLSA v1) | Moderne | Hardened artifact was built from L0 source + L2 patch on pinned toolchain | hardened_digest |
| L4 | **Test Results** | Moderne | Upstream suite result set vs baseline; API/ABI compat; patched-path coverage | hardened_digest |
| L5 | **Vulnerability Proof** | Moderne | Per CVE: PoC fails on baseline_digest, passes on hardened_digest | both |
| L6 | **SBOM (out)** + diff | Moderne | Composition of hardened artifact, and delta vs L0 SBOM | hardened_digest |
| L7 | **VEX** (OpenVEX/CSAF) | Moderne | Per CVE: `fixed`, justified by reference to L5 | hardened_digest |
| L8 | **VSA** | **FINOS** | Independently rebuilt → digest match; re-ran L4/L5 → result match; policy vX passed | hardened_digest |
| L9 | **Acceptance** | **Bank** | Internal contract/integration tests passed; promoted to golden repo | hardened_digest |

L0–L7 are the maker's claims. **L8 is the only attestation that converts claims
into evidence.** L9 is the bank's own control and never leaves the bank.

---

## 3. The anchor problem (read this one twice)

L0 is a *self-claim*. If Moderne merely asserts "we started from
`commons-x:1.2.3`", the entire chain is a self-claim with eight extra steps.

L0 is only load-bearing if it is **independently re-derivable from public data**:

- `baseline_digest` MUST match the artifact publicly retrievable from Maven
  Central at the stated coordinates. FINOS re-pulls and compares. No trust
  required.
- `source_ref` MUST be a git commit SHA in the public upstream repository.

> **[Recovery note — §3 continues in the original beyond this point; remainder
> not preserved in the transcript.]**

---

## 4. Admission policy (the gate rules)

The bank's gate enforces an ordered set of admission rules (referred to across
the design as rules 1–13). Only the final, contract-conformance rule was
preserved verbatim:

```
 13. resolve contract C = V.osera.contract.digest
     AND C.status == ACCEPTED, signed by maker trust-anchor
     AND V.osera.contract.conformance == "FULL"
     AND C.scope.cvesInScope ⊆ (CVEs marked fixed in L7 VEX)
     → otherwise: DO NOT PROMOTE
```

> **[Recovery note — rules 1–12 were not preserved in the transcript. See the
> companion `osera-bank-verification.md` and the contract doc for how these map
> onto the in-toto layout + Rego policy split.]**

---

## 8. Quorum verification (k-of-n)

**8.3 — Dissent is disqualifying, not outvoted.** A dissenting VSA must be
*disqualifying*, not merely outvoted — `k-of-n` with **zero dissent**, not
simple majority. Dissent triggers investigation, not arithmetic. This is a
signal no single-checker design can produce, and it is the strongest argument
for the model.

**8.4 — Why push this at formation stage.**
- Strictly stronger than a single-verifier model: resistant to *checker*
  compromise, not just maker compromise.
- Turns verification from a FINOS cost centre into a **mutualised** one — fits
  OSERA's per-project pooled funding model.
- Gives participating firms a reason to run verification infrastructure they
  already own, and a governance stake proportional to contribution.
- **"k-of-n independent reproduction by named institutions" lands very
  differently with a regulator than "our vendor's verifier said yes."**

*Residual:* quorum defends against a corrupted *build*. It does not defend
against a *correct build of a malicious patch* — every verifier would faithfully
reproduce it. Source review remains an independent control.

> **[Recovery note — §5–§7 (and the earlier parts of §8) were not preserved in
> the transcript.]**

---

## 9. Open questions for the working group

Partially recovered — the following items were preserved:

1. Does the VSA sign **per-artifact** or **per-release-set**?
5. **Attestation for the recipe set itself** — should OpenRewrite recipes carry
   their own provenance? (Recommend yes; they are executable code entering the
   trust boundary.)
6. **What is `k`, and what is `n`?** Who sits in the verifier registry, what are
   the entry criteria, and is verification a *duty* of participation or a
   *credit* against funding contribution? (Recommend the latter.)
7. **Does a dissenting VSA block globally or per-firm?** (Recommend globally: a
   single unexplained digest mismatch quarantines the release for all
   participants pending investigation.)
8. **Transparency log:** shared FINOS-operated Rekor instance, or the public one?

> **[Recovery note — items 2–4 were not preserved in the transcript.]**
