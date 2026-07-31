# OSERA → Bank Ingestion — Standards, Formats & Protocols Register

**Scope:** the standards, formats and protocols relevant to consuming
OSERA-backpatched artifacts and FINOS-native projects into a regulated bank,
across the full lifecycle (identity → provenance → SBOM/VEX → policy →
distribution → evidence).

**★ = load-bearing for the attestation-chain design** (the ones the chain L0–L9,
the contract-to-layout compiler, and the bank verification gate actually stand
on). Everything else is context you integrate with or map against.

**Status: historical.** This is a **survey**, not a decision record — it lists
options and marks which are load-bearing, and every choice it left open has since
been made elsewhere. See the supersession note.

> **Provenance / recovery note.** Reconstructed on 2026-07-17 from the *Relevant
> standards, formats and protocols* conversation (2026-07-16). The original was
> a per-conversation output file, which does not persist. Categories §1–§5 and
> §10–§11 plus the minimum-viable stack are recovered in full; §6–§9 tables were
> not fully preserved — their headers and the standards *referenced elsewhere in
> the source conversations* are listed, but treat those four as partial. Re-paste
> the original for the complete tables.

> **Superseded, 2026-07-30 — by decisions rather than by corrections.** The
> survey is still an accurate survey; what it does not tell you is which way each
> choice went.
>
> - **§4 lists CycloneDX and SPDX side by side, both starred.** They are not
>   equals: **CycloneDX is authoritative** and an SPDX projection is emitted on
>   demand, with SPDX licence identifiers embedded inside the CycloneDX document
>   (`noteworthy-sbom-format`).
> - **§5 lists CycloneDX VEX as an option.** Not adopted — VEX stays **OpenVEX at
>   L7**, separate from the SBOM, so there is no format-family clash.
> - **§3 files TUF under "answers the question".** It is now built: a **k-of-m
>   co-signed root** with delegated namespaces for bilateral work
>   (`noteworthy-trust-root-ownership`). What remains is which organisations sit
>   in the threshold, which is policy.
> - **§1 and §10 are Maven-specific throughout.** The design is
>   ecosystem-agnostic by purl type; anchor strength and coordinate encoding vary
>   by ecosystem, and semver has no valid hardened-coordinate encoding yet
>   (`noteworthy-ecosystem-generalization`).
> - **§2's "thresholds = your k-of-n quorum"** — the in-toto mechanism is exactly
>   right and unchanged, but the threshold is now the contract's **signatory
>   set** rather than a computed number (`noteworthy-signer-verification`).
> - **OSV appears in §4 and §6 as a vuln-record source.** It is now load-bearing:
>   each in-scope CVE carries a **pinned OSV snapshot** in the evidence core, and
>   rule 16 digests it as carried (`noteworthy-record-digest`).
>
> One thing the survey missed entirely, and it is the largest single gap:
> **nothing here covers the reference implementation's own stack** — what the RI
> is written in, or how it is tested. That lives in `noteworthy-ri-stack`.
>
> Current register: `artifact-architecture` §7, which maps each standard to the
> level or component that consumes it. The stance on adjacent and competing
> tooling is `noteworthy-interop-stance`.

---

## 1. Package identity & coordinates

| Standard | What it is | Role here |
|---|---|---|
| ★ **purl** (Package URL) | Ecosystem-agnostic package identifier (`pkg:maven/…`) | Attestation subjects are `purl` + digest; drives the `1.2.3` vs `1.2.3-osera.1` namespace decision |
| **Maven GAV** | `group:artifact:version` coordinates + repository layout | Native identity for the Java estate OSERA targets; dependency-confusion surface |
| **CPE** (Common Platform Enumeration, NIST) | Product-matching string used in CVE/NVD feeds | Why scanners still fire on a backpatched artifact — CPE match ignores your patch |
| ★ **OCI Image / Artifact Spec** (Open Container Initiative) | Content-addressed artifact + manifest model | Digest-binding; carrier for attestations as referrers |

## 2. Provenance & attestation ★

| Standard | Steward | Role here |
|---|---|---|
| ★ **in-toto** | CNCF (graduated) | The framework the whole chain compiles to: layout + links + `in-toto-verify`; thresholds = your k-of-n quorum; inspections = bank acceptance inside the gate |
| ★ **in-toto Attestation Framework** | in-toto | Statement/predicate/subject model; predicate types incl. `test-result`, provenance, SBOM, VEX |
| ★ **SLSA** (Supply-chain Levels for Software Artifacts) | OpenSSF | Build-provenance predicate + levels (L3 build claim); the vocabulary your risk function already knows |
| ★ **VSA** (Verification Summary Attestation) | SLSA | Exactly your L8 — a verifier records the result of checking someone else's artifact |
| ★ **DSSE** (Dead Simple Signing Envelope) | Secure Systems Lab / Sigstore | The signing envelope in-toto/Sigstore attestations ride in |
| **Reproducible Builds** | reproducible-builds.org | Bit-for-bit rebuild → digest equality; the Schelling point that makes independent verifiers converge without coordination |

## 3. Signing, keys & transparency ★

| Standard / Tool | Steward | Role here |
|---|---|---|
| ★ **Sigstore** (Cosign / Fulcio / Rekor) | OpenSSF | Keyless signing, cert authority, transparency log; `cosign download attestation <digest>` is the referrer-resolution path |
| ★ **OCI Referrers API** (Distribution Spec 1.1) | OCI | "Attached = referrer, not a link" — subject digest → attestation set with zero out-of-band lookup |
| **TUF** (The Update Framework) | CNCF (graduated) | Trust-root definition, key rotation, compromise recovery — answers the "who rotates keys / what happens on compromise" question |

## 4. SBOM formats

| Standard | Steward | Role here |
|---|---|---|
| ★ **CycloneDX** | OWASP / ECMA-424 | SBOM + can carry VEX inline; strong for the ingest → generate → diff flow |
| ★ **SPDX** | Linux Foundation / ISO/IEC 5962:2021 | SBOM interchange + SPDX license identifiers for the licence screen |
| **OSV schema** | OpenSSF / Google | Machine-readable vuln records keyed by `purl` — cleaner than CPE for the exposure graph |

## 5. VEX — exploitability suppression ★ *(the crux domain)*

| Standard | Steward | Role here |
|---|---|---|
| ★ **OpenVEX** | OpenSSF | Minimal VEX; the "fixed, not exploitable, here's the evidence" statement that stops every scanner in the bank firing |
| ★ **CSAF 2.0** (Common Security Advisory Framework) + VEX profile | OASIS | Richer advisory-grade VEX; regulator-facing |
| **CycloneDX VEX** | OWASP | VEX carried inside the CycloneDX SBOM |
| **VEX (concept)** | CISA | Origin of the exploitability-status model; must reference the vuln-proof (L5) to be evidence, not a claim |

## 6. Vulnerability identification & scoring *(partial — see recovery note)*

Original table not fully preserved. Standards referenced for this category in
the source conversations: **CVE / NVD**, **CVSS**, **KEV** (CISA), **EPSS** (the
three that feed the Risk Navigator's backpatch-candidate ranking), **OSV**
(purl-keyed, cleaner than CPE for the exposure graph), and **GHSA**.

## 7. Policy & gating *(partial — see recovery note)*

Original table not fully preserved. Standards/tools referenced: **OPA / Rego**
(the semantic policy the bare in-toto layout can't express) and **Witness**
(carries the OPA/Rego policy engine alongside in-toto attestations in CI/CD).

## 8. Test & compatibility attestations *(partial — see recovery note)*

Original table not fully preserved. Referenced: the in-toto **`test-result`
predicate**, **japicmp / revapi** (API/ABI compatibility), and patched-path
**coverage** thresholds.

## 9. Project health & licensing *(partial — see recovery note)*

Original table not fully preserved. Referenced: **SPDX license identifiers** for
the licence screen; upstream-licence inheritance for backpatches. (Other rows —
e.g. project-health signals — were not preserved.)

## 10. Distribution & consumption protocols

| Standard | Role here |
|---|---|
| **Maven Repository Layout / metadata** | Native distribution; repo-manager routing so Central never shadows the hardened artifact |
| **OCI Distribution Spec** | Digest-addressed pull; referrer resolution for attestations |
| **`.intoto.jsonl` sidecar** | Nexus/Maven case where OCI referrers aren't available |

## 11. Regulatory frameworks *(adjacent — drive the evidence model, not formats)*

| Framework | Jurisdiction | Hook |
|---|---|---|
| **EU CRA** (Cyber Resilience Act) | EU | Reporting 2026, full obligations 2027; SBOM + vuln handling expectations |
| **DORA** + Register of Information (ESA ITS templates) | EU | ICT third-party register; OSERA/FINOS classification lands here |
| **NIS2** | EU | Supply-chain security obligations |
| **NIST SSDF** (SP 800-218) | US | Secure-dev attestation; ties to EO 14028 self-attestation |
| **NIST SP 800-161** | US | C-SCRM control baseline |
| **Interagency Guidance on Third-Party Relationships** (SR 23-4) | US (Fed/OCC/FDIC) | Operational-resilience / TPRM regime the risk function applies first |

---

### The minimum viable stack for v1

If you strip to what the chain **cannot** exist without:
**purl + OCI digests** (identity) → **in-toto + SLSA/VSA + DSSE** (attestation) →
**Sigstore + referrers** (resolution) → **CycloneDX/SPDX + OpenVEX** (SBOM/VEX) →
**Rego/Witness** (semantic gate). Everything else in this register is either an
integration point or a regulatory target you map onto that spine.

> **Still accurate as a spine, with two refinements.** CycloneDX is
> authoritative and SPDX is a projection over it rather than an alternative; and
> **TUF belongs in the minimum stack**, not outside it — without a trust root the
> gate has no way to decide which signatures count, which is why the design now
> pins a TUF snapshot inside every ingest envelope.
