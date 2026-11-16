# Test evidence demo

A small Java product, a reproducible build, tests in every category, and the
full path from "tests ran" to "the bank admits it":

1. **Build.** Maven builds a reproducible jar inside a build image pinned by
   digest, with a version unique to the build. The build service signs SLSA
   provenance for it: this jar digest came from this source digest in this
   image.
2. **Scenarios** say what each test is meant to verify: a catalog keyed by
   stable test IDs, Gherkin features, and per-category config.
3. **Results** are recorded in standard formats: CTRF for pass/fail, SARIF for
   scanner findings, OSV for advisories, plus each tool's native report.
4. **Attestations** bind both to the delivered jar (by purl and digest) and to
   its source: one in-toto
   [test-result](https://github.com/in-toto/attestation/blob/main/spec/predicates/test-result.md)
   statement per category, signed with **cosign** (`cosign attest-blob
   --statement`) into a Sigstore bundle, all carried in one `.intoto.jsonl`
   file with the provenance. In CI the build, tests and load test sign
   **keyless**: each runs in its own reusable workflow, so each gets its own
   Fulcio certificate identity, and every signature is in the public Rekor log.
5. **The record and the sidecar.** [`EVIDENCE.md`](EVIDENCE.md) is a text
   version of the evidence, committed to the repository by CI after every
   build: per category, the format, the result, the signer, and the hash and
   path of every binary and report. The jar is published to GitHub Packages
   (Maven) with the evidence bundle and the record as sidecars under the same
   coordinates.
6. **The gate** verifies every bundle with `cosign verify-blob-attestation`,
   checks the evidence against its own clone, rebuilds the jar itself and
   compares digests, then evaluates the semantic rules in Rego (OPA).
   It refuses with a named rule and signs a SLSA
   [Verification Summary Attestation](https://slsa.dev/spec/v1.0/verification_summary).

In the code_tracer chain, step 1 is the provider's **L3 build provenance**,
steps 2–4 are **L4 test results** split by category, and step 6 is the bank's
**L8 VSA**, including its own rebuild.

## Run it

Needs Java 21, Maven, Node 20+, Google Chrome (both Playwright for Java and
Playwright for JS use `channel: "chrome"`), and `cosign` (3.x), `gitleaks`,
`semgrep` and `opa` on `PATH`. The dependency scan downloads OSV's Maven export, so it needs access
to `osv-vulnerabilities.storage.googleapis.com`.

```sh
cd demo
npm ci
npm run demo     # build -> evidence -> sign-offs -> policy tests -> gate -> record -> negative cases
```

Or step by step:

```sh
npm run build                    # build in the pinned image -> out/artifacts/fx-quote-demo-<version>.jar + signed SLSA provenance
npm run evidence                 # all test categories against that jar; or: node evidence/run.mjs unit load
npm run signoffs                 # the two named human sign-offs (demo reviewers)
npm run policy:test              # opa test over the Rego gate policy
npm run gate                     # verdict + out/vsa.sigstore.json (rebuilds the jar; --no-rebuild to skip)
npm run manifest                 # write EVIDENCE.md from the bundle, the gate report and the VSA
npm run gate:negative            # 23 tampered copies refused by a named rule, 1 VEX case admitted
```

The build runs in Docker (`maven:3.9.16-eclipse-temurin-21`, pinned by digest).
Without Docker, set `DEMO_ALLOW_HOST_BUILD=1` to build on the host; the gate's
G16 then accepts the host build for that run only. The version defaults to
`0.1.0`; `DEMO_REVISION` sets it (CI uses `0.1.0-ci.<run number>`).

Without network access to OSV, the SCA category fails closed ("advisory source
unavailable") and the gate refuses. `DEMO_OSV_SNAPSHOT=<dir of OSV records>`
substitutes a local snapshot; the gate's VEX cases use
`tests/sca/fixtures/osv-snapshot-demo/` that way.

## The product

`product/` is a Maven project (`pkg:maven/demo.codetracer/fx-quote-demo`, version
`${revision}`, set per build):
an FX quote service on the JDK's HTTP server, with a JSON API (`/api/quote`,
`/api/pairs`, `/api/health`) described by `src/main/resources/openapi.json`, one
web page, and a rates table in `src/main/resources/data/rates.json`. Its one
runtime dependency is Jackson, so the dependency and license checks have
something to look at. The build produces one runnable shaded jar.

**Reproducible build.** `project.build.outputTimestamp` in the POM fixes every
archive timestamp, and the build image fixes the JDK and Maven, so the same
source, version and image give the same jar digest. The gate relies on this: it
rebuilds from its clone with the version and image the provenance names and
compares (G15). Without the image, a jar built on a different JDK build differs
even from identical source.

**Versions.** Each build gets its own version, because a Maven repository
accepts a version only once. The version is read back from the jar's own
`pom.properties`, so the catalog and VEX documents name the product by
versionless purl, which in purl and OpenVEX terms covers every version.

## Categories and formats

| Category | Scenario format | Tool | Runs against | Result format | Signer |
|---|---|---|---|---|---|
| build | `product/pom.xml` | Maven in the pinned image | source | SLSA provenance v1 | build-service |
| unit | catalog + JUnit 5 test class | JUnit Jupiter (surefire) | classes | JUnit XML → CTRF | ci-pipeline |
| integration | Gherkin `.feature` + Java steps | Cucumber-JVM | jar | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| contract | Gherkin + `openapi.json` | Cucumber-JVM + json-schema-validator | jar | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| uat (scripted) | Gherkin + Java steps driving a browser | Cucumber-JVM + Playwright for Java | jar | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| e2e | catalog + Playwright spec | Playwright | jar | JUnit XML → CTRF | ci-pipeline |
| accessibility | catalog + Playwright spec (WCAG 2.1 A/AA) | axe-core | jar | JUnit XML → CTRF, axe → SARIF | ci-pipeline |
| load | `profile.yaml` thresholds + env spec | autocannon | jar | CTRF (one test per threshold), autocannon JSON, env spec JSON | perf-env |
| sast | `rules.yml` (Java + JS rules per catalog ID) | semgrep | source | SARIF → CTRF per rule | ci-pipeline |
| secrets | `gitleaks.toml` | gitleaks | source | SARIF → CTRF | ci-pipeline |
| sca | `policy.json` + OpenVEX document | CycloneDX SBOM × OSV Maven snapshot | SBOM | OSV record per match, SARIF (with VEX suppressions) → CTRF | ci-pipeline |
| license | `allowlist.json` (SPDX IDs) | cyclonedx-maven-plugin + `dependency:list` | SBOM | SARIF, CycloneDX SBOM → CTRF | ci-pipeline |
| data-quality | `rates.rules.mjs` | node:test | rates table | JUnit XML → CTRF | ci-pipeline |
| ux-signoff | `tests/ux/protocol.md` | named reviewer | — | signed record + findings document | alice.chen |
| uat-signoff | UAT feature + notes | named reviewer | — | signed record + notes document | raj.patel |

The Cucumber suites and the JS Playwright tests start `java -jar` on the
delivered jar in `out/artifacts/`, so a resource the jar is missing shows up as
a failure rather than being covered by the test classpath.

## Standards used, against the architecture's register

The architecture's standards register (§7 of `artifact-architecture`, at
[commit `9217e03`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c/.konspekt/instance/artifacts/artifact-architecture.md))
maps each standard to the part of the chain that consumes it. This is how the
demo uses the ones that apply:

| Standard | In the register | In this demo |
|---|---|---|
| **purl** | subject identity for all attestations | The jar is `pkg:maven/demo.codetracer/fx-quote-demo@<version>?type=jar` in the provenance, every test attestation and the VSA. The gate checks the catalog purl against the POM coordinates (G05); LIC-002 checks the SBOM names the same purl; SARIF findings and VEX statements identify dependencies by purl. |
| **SLSA provenance** | L3 build | `out/attestations/build.sigstore.json`: jar digest from source digest, build command, toolchain, builder identity. |
| **Reproducible Builds** | L8 rebuild, digest equality | Fixed `outputTimestamp` and a build image pinned by digest; the gate rebuilds in that image and compares (G15), and refuses builds from other images (G16). |
| **in-toto** Attestation Framework | the framework the chain compiles to | One test-result statement per category. |
| **DSSE** | the signing envelope | Inside every Sigstore bundle: attestations, sign-offs and the VSA. |
| **SLSA VSA** | L8, the verifier's attestation | The gate's signed output, with the bundle and policy digests as inputs. |
| **Rego / OPA** | the semantic gate | `gate/policy/gate.rego` holds G09–G13; `gate_test.rego` tests it with `opa test`. Structural checks, provenance and the rebuild (G01–G08, G14, G15) stay in JavaScript, as the architecture splits them. |
| **CycloneDX** (authoritative) / **SPDX** | L6 SBOM; SPDX license IDs inside CycloneDX | CycloneDX SBOM for runtime dependencies from `cyclonedx-maven-plugin`; licenses are SPDX IDs. No SPDX projection is emitted. |
| **OSV schema** | vuln records keyed by purl; pinned snapshot | SCA matches SBOM components against OSV's Maven export. The snapshot is recorded by its sha256 and URL only (not retained); each matched record is kept by digest. VEX names vulnerabilities by OSV ID. |
| **OpenVEX** | L7 exploitability, must reference proof | `tests/sca/vex.openvex.json`. A statement can suppress a finding (SARIF `suppressions`), but the gate admits it only if it cites a proof test from the catalog that passed (G13). The citation is an `x-code-tracer-proof` field on the statement. |
| **`.intoto.jsonl` sidecar** | distribution where OCI referrers aren't available | `out/evidence.intoto.jsonl` is what the gate reads, and is published to GitHub Packages next to the jar as `<artifactId>-<version>-evidence.intoto.jsonl`. |
| **Sigstore** (cosign) | keyless signing, transparency log | cosign 3.x signs every statement into a Sigstore bundle (v0.3) and the gate verifies with cosign. In CI the workflow identities sign keyless (Fulcio certificate, Rekor entry); locally, and for named sign-offs, signing uses cosign keys. |

Not used here: **CSAF** (the regulator-facing VEX variant), **TUF** (trust root;
`.keys/trust.json` stands in for it), **OCI Referrers**, and **CPE**, which the
register lists as a trap.

### VEX and proof

`tests/sca/fixtures/osv-snapshot-demo/` holds two **fictional** OSV records: a
high-severity polymorphic-deserialization advisory on `jackson-databind`
(`DEMO-2026-0001`), and a critical one on `jackson-core` fixed in 2.15.0, which
must not match the version in use. The gate's VEX cases re-run SCA against it:

| Evidence | Gate |
|---|---|
| advisory, no VEX | refuse, G10 (SCA-001 failed) |
| advisory + `not_affected` statement with no proof | refuse, G13 |
| advisory + statement citing UNIT-007, but UNIT-007 failed | refuse, G13 |
| advisory + statement citing UNIT-007, which passed | admit |

UNIT-007 checks that the ObjectMapper has no default typing and that a POST
with a typed payload is refused (405) on every path before any body is read,
which is what makes "the polymorphic deserialization path is never executed"
true.

## How a result is linked to its intent

Every test has an entry in [`tests/catalog.yaml`](tests/catalog.yaml) with the
ISO/IEC/IEEE 29119-3 test case fields: `id`, `objective`, `requirement`,
`preconditions`, `expected`, `scenario`. Each test's name in its result file
starts with that ID (`@DisplayName("UNIT-005 …")`, `Scenario: INT-003 …`), and
the pipeline groups results by ID, so a Scenario Outline with five examples
counts as one test that fails if any example fails.

The catalog's digest is in every attestation. If someone rewrites a test's
objective after the run, the gate refuses (G06).

## What an attestation contains

```jsonc
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    { "name": "pkg:maven/demo.codetracer/fx-quote-demo@0.1.0-ci.42?type=jar", "digest": { "sha256": "<jar>" } },
    { "name": "git+https://github.com/denisurusov/code_tracer#demo/product",
      "digest": { "sha256": "<source manifest>", "gitCommit": "<sha, when product/ is clean>" } }
  ],
  "predicateType": "https://in-toto.io/attestation/test-result/v0.1",
  "predicate": {
    "result": "PASSED",                         // PASSED | WARNED | FAILED
    "configuration": [                          // everything the result depends on, by digest
      { "name": "tests/catalog.yaml",              "digest": {...}, "annotations": { "role": "catalog" } },
      { "name": "tests/load/profile.yaml",         "digest": {...}, "annotations": { "role": "scenario" } },
      { "name": "out/results/load/env-spec.json",  "digest": {...}, "annotations": { "role": "environment-spec" } },
      { "name": "out/results/load/ctrf.json",      "digest": {...}, "annotations": { "role": "report", "format": "CTRF" } }
    ],
    "url": "<CI run URL>",
    "passedTests": ["LOAD-001", "LOAD-002", "LOAD-003"],
    "warnedTests": [],
    "failedTests": [],
    "x-code-tracer": { "category": "load", "startedOn": "...", "finishedOn": "...", "tool": {...},
                       "vexApplied": [] }        // SCA only: VEX statements that suppressed findings
  }
}
```

**Source subject.** The source digest is sha256 over the sorted
`"<sha256>  <path>"` lines for every file under `product/` except `target/`. The
gate recomputes it from its own clone. The git commit is added as a second
digest when `product/` is clean.

**Demo conventions.** The `role` annotations on `configuration` entries (catalog,
scenario, vex, advisory-snapshot, environment-spec, report), the predicate's
`x-code-tracer` field and the VEX statement's `x-code-tracer-proof` field are
additions. in-toto and OpenVEX consumers ignore fields they don't recognize.

## The gate's rules

| Rule | Layer | Name | Refuses when |
|---|---|---|---|
| G01 | cosign | signature-valid | `cosign verify-blob-attestation` rejects the bundle (bad signature, certificate or Rekor entry, wrong predicate type, or the jar is not a subject) |
| G02 | JS | signer-trusted | a keyless bundle's certificate identity matches no trusted workflow, or a key-signed bundle's key hint is not in the trust store |
| G03 | JS | signer-authorized-for-category | the signer is trusted but not allowed for that category (e.g. CI signing the provenance or the load results, the wrong person signing UX) |
| G04 | JS | statement-is-test-result | the statement's predicate type is not the one the category requires |
| G05 | JS | subject-matches-source | a subject's jar or source digest differs from the delivered jar or the clone, or the catalog purl doesn't match the POM |
| G06 | JS | catalog-matches | the catalog changed after the run |
| G07 | JS | scenarios-match | a scenario, config or VEX file changed after the run |
| G08 | JS | reports-match | a result file is missing or differs from its digest |
| G09 | Rego | coverage-complete | a catalog test for the category is absent from the results |
| G10 | Rego | result-acceptable | a test failed, or warned where the policy does not allow warnings |
| G11 | Rego | environment-spec-complete | the load environment spec lacks a required field or describes another jar or source |
| G12 | Rego | required-categories-present | a category the product type requires (including `build`) has no valid attestation |
| G13 | Rego | vex-backed-by-proof | a VEX statement suppressed a finding without a valid justification and a passed proof test |
| G14 | JS | provenance-consistent | the provenance's source or jar differs from the clone or the delivered jar, or a test attestation names a different jar |
| G15 | JS | rebuild-matches | the gate's own rebuild of the clone (same version, same image) does not produce the jar the provenance names |
| G16 | JS | toolchain-pinned | the provenance names a build image that is not in the policy's `allowed_images`, or a host build |

Required categories per product type, the allowed signers per category and the
environment spec's required fields are in [`gate/policy.yaml`](gate/policy.yaml).

## What is simulated

- **Identities.** In CI, `build-service`, `ci-pipeline` and `perf-env` are
  real keyless identities: the reusable workflows `demo-build.yml`,
  `demo-tests.yml` and `demo-load.yml`, matched by certificate identity and
  the GitHub Actions OIDC issuer (`IDENTITIES` in `evidence/lib/keys.mjs`).
  Locally they sign with cosign keys in `.keys/` (gitignored) and an offline
  signing config. `alice.chen` / `raj.patel` (named reviewers) and `bank-gate`
  always sign with keys; in production they would sign keyless with their own
  corporate identity. `perf-env` runs on the same kind of hosted runner as the
  tests; it stands for a separate performance environment.
- **Negative cases.** `npm run gate:negative` re-signs a copy of the run's
  evidence with keys before tampering with it, so the cases test the gate's
  rules, not Sigstore.
- **Human sign-offs.** The UX findings and UAT notes are sample documents; no
  study was run.
- **Load environment.** The load test runs on the same host as everything else.
  The environment spec records that, and the gate checks the spec is complete
  and describes the delivered jar and its source.
- **The bank's rebuild** runs in the same pinned image the provenance names.
  Locally it runs offline against the local Maven repository (standing in for
  the bank's mirror); in CI it fetches from Maven Central
  (`DEMO_REBUILD_OFFLINE=0`).

## The evidence record

[`EVIDENCE.md`](EVIDENCE.md) is generated by `npm run manifest` and committed to
the branch by CI after each run. It has:

- the product: purl, delivered jar hash, source digest and git commit, run
  URL, where the binaries are stored, the gate verdict, the rebuild digest and
  the VSA hash;
- one row per **evidence category | format | evidence**, where the evidence is
  the result, the signer, the bundle's path and hash, the tested jar and
  source, and the path and hash of each report;
- every file the attestations reference, with its hash and role;
- the signers' key hints and public keys, so the record can be checked with
  plain `cosign verify-blob-attestation` against the binaries.

The binaries themselves (jar, bundles, reports) are not committed. Each build
publishes them to GitHub Packages:

```
demo.codetracer:fx-quote-demo:0.1.0-ci.<n>
  fx-quote-demo-0.1.0-ci.<n>.jar                       the jar
  fx-quote-demo-0.1.0-ci.<n>-evidence.intoto.jsonl     classifier evidence: every Sigstore bundle
  fx-quote-demo-0.1.0-ci.<n>-evidence-record.md        classifier evidence-record: EVIDENCE.md
```

GitHub Packages requires a token with `read:packages` to download, even from a
public repository. The full `out/` directory is also kept as the run artifact
`test-evidence` for 90 days.

## CI

[`demo-test-evidence.yml`](../.github/workflows/demo-test-evidence.yml) runs on
pull requests that touch the demo and on manual dispatch. One run is one build:

| Job | Workflow | Signs as | Does |
|---|---|---|---|
| build | `demo-build.yml` | build-service (keyless) | builds in the pinned image, signs provenance |
| tests | `demo-tests.yml` | ci-pipeline (keyless) | every automated category except load, against the jar |
| load | `demo-load.yml` | perf-env (keyless) | load test against the jar |
| gate | `demo-test-evidence.yml` | reviewers, bank-gate (keys) | sign-offs, policy tests, gate, record, negative cases, publish to GitHub Packages, commit `EVIDENCE.md` |

Commits made with the workflow token do not start another run.

## Layout

```
product/            the product under test (Maven): src/main, src/test (JUnit, Cucumber steps, suites)
tests/catalog.yaml  scenario catalog: what each test is meant to verify
tests/<category>/   Gherkin features, scenarios and config per category
evidence/           build + provenance, runner, converters, OSV matcher, cosign signing, sign-off tool, record generator
gate/               policy.yaml, verifier (structural + rebuild), policy/*.rego (semantic), negative cases
EVIDENCE.md         text evidence record of the latest CI run (committed by CI)
out/                generated: artifacts/, raw/, results/, attestations/*.sigstore.json, evidence.intoto.jsonl, vsa.sigstore.json (gitignored)
```
