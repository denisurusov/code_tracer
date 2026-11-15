# Test evidence demo

A small product, tests in every category, and the full path from "tests ran" to
"the bank admits it":

1. **Scenarios** say what each test is meant to verify: a catalog keyed by
   stable test IDs, Gherkin features, and per-category config.
2. **Results** are recorded in standard formats: CTRF for pass/fail, SARIF for
   scanner findings, plus each tool's native report.
3. **Attestations** bind both to the product source: one signed in-toto
   [test-result](https://github.com/in-toto/attestation/blob/main/spec/predicates/test-result.md)
   statement per category, in a DSSE envelope.
4. **The gate** checks the evidence offline against its own clone and a
   policy, refuses with a named rule, and signs a SLSA
   [Verification Summary Attestation](https://slsa.dev/spec/v1.0/verification_summary).

In the code_tracer chain, steps 1–3 are the provider's **L4 Test Results**,
split by category, and step 4 is the bank's **L8 VSA**.

## Run it

Needs Node 20+, Google Chrome (Playwright uses `channel: "chrome"`), and the
`gitleaks` and `semgrep` binaries on `PATH`.

```sh
cd demo
npm ci
npm run demo          # evidence -> sign-offs -> gate -> negative cases
```

Or step by step:

```sh
npm run evidence                 # all automated categories; or: node evidence/run.mjs unit load
npm run signoffs                 # the two named human sign-offs (demo reviewers)
npm run gate                     # verdict + out/vsa.dsse.json
npm run gate:negative            # 12 tampered copies, each refused by a named rule
```

## The product

`product/` is an FX quote service: a JSON API (`/api/quote`, `/api/pairs`,
`/api/health`) described by `product/openapi.json`, one web page, and a rates
table in `product/data/rates.json`. It has one runtime dependency (`ajv`), so
the dependency and license checks have something to look at.

## Categories and formats

| Category | Scenario format | Tool | Result format | Signer |
|---|---|---|---|---|
| unit | catalog + `node:test` file | node:test | JUnit XML → CTRF | ci-pipeline |
| integration | Gherkin `.feature` | cucumber-js | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| contract | Gherkin + `product/openapi.json` | cucumber-js + ajv | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| e2e | catalog + Playwright spec | Playwright | JUnit XML → CTRF | ci-pipeline |
| uat (scripted) | Gherkin, driving a real browser | cucumber-js + Playwright | JUnit XML → CTRF, Cucumber Messages | ci-pipeline |
| accessibility | catalog + Playwright spec (WCAG 2.1 A/AA) | axe-core | JUnit XML → CTRF, axe → SARIF | ci-pipeline |
| load | `profile.yaml` thresholds + env spec | autocannon | CTRF (one test per threshold), autocannon JSON, env spec JSON | perf-env |
| sast | `rules.yml` (rule ID = test ID) | semgrep | SARIF → CTRF per rule | ci-pipeline |
| secrets | `gitleaks.toml` | gitleaks | SARIF → CTRF | ci-pipeline |
| sca | `policy.json` (runtime deps) | npm audit | npm audit JSON → SARIF → CTRF | ci-pipeline |
| license | `allowlist.json` | cyclonedx-npm + allowlist | SARIF, CycloneDX SBOM → CTRF | ci-pipeline |
| data-quality | `rates.rules.mjs` | node:test | JUnit XML → CTRF | ci-pipeline |
| ux-signoff | `tests/ux/protocol.md` | named reviewer | signed record + findings document | alice.chen |
| uat-signoff | UAT feature + notes | named reviewer | signed record + notes document | raj.patel |

## How a result is linked to its intent

Every test has an entry in [`tests/catalog.yaml`](tests/catalog.yaml) with the
ISO/IEC/IEEE 29119-3 test case fields: `id`, `objective`, `requirement`,
`preconditions`, `expected`, `scenario`. Each test's name in its result file
starts with that ID (`UNIT-005 …`, `Scenario: INT-003 …`), and the pipeline
groups results by ID, so a Scenario Outline with five examples counts as one
test that fails if any example fails.

The catalog's digest is in every attestation. If someone rewrites a test's
objective after the run, the gate refuses (G06).

## What an attestation contains

```jsonc
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [{ "name": "fx-quote-demo/source",
                "digest": { "sha256": "<source manifest digest>", "gitCommit": "<sha, when the tree is clean>" } }],
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
    "x-code-tracer": { "category": "load", "startedOn": "...", "finishedOn": "...", "tool": {...} }
  }
}
```

**Subject.** `actions/attest` accepts only sha256 subjects, and git commit IDs
are sha1 in almost all repositories, so the subject is a source manifest digest: sha256 over the sorted `"<sha256>  <path>"` lines for
`product/`, `package.json` and `package-lock.json`. The gate recomputes it from
its own clone. The commit SHA is added as a second digest when the working tree
is clean.

**Demo conventions.** The `role` annotations on `configuration` entries and the
`x-code-tracer` field are additions within the predicate. in-toto consumers
ignore fields they don't recognize.

## The gate's rules

| Rule | Name | Refuses when |
|---|---|---|
| G01 | signature-valid | the DSSE signature does not verify |
| G02 | signer-trusted | the key is not in the trust store |
| G03 | signer-authorized-for-category | the signer is trusted but not allowed for that category (e.g. CI signing load results, the wrong person signing UX) |
| G04 | statement-is-test-result | the statement is not an in-toto test-result statement |
| G05 | subject-matches-source | the attested source digest differs from the clone |
| G06 | catalog-matches | the catalog changed after the run |
| G07 | scenarios-match | a scenario or config file changed after the run |
| G08 | reports-match | a result file is missing or differs from its digest |
| G09 | coverage-complete | a catalog test for the category is absent from the results |
| G10 | result-acceptable | a test failed, or warned where the policy does not allow warnings |
| G11 | environment-spec-complete | the load environment spec lacks a required field or describes other source |
| G12 | required-categories-present | a category the product type requires has no valid attestation |

Required categories per product type, the allowed signers per category and the
environment spec's required fields are in [`gate/policy.yaml`](gate/policy.yaml).

## What is simulated

- **Signing.** Local Ed25519 keys in `.keys/` (gitignored), generated on first
  run. They stand in for Sigstore keyless signing: `ci-pipeline` for the
  central reusable workflow's identity, `perf-env` for the performance
  environment, and `alice.chen` / `raj.patel` for named reviewers' corporate
  identities. The trust store maps key IDs to identities the way the gate
  would map certificate identities.
- **Human sign-offs.** The UX findings and UAT notes are sample documents; no
  study was run.
- **Load environment.** The load test runs on the same host as everything else.
  The environment spec records that, and the gate only checks the spec is
  complete and describes the attested source.

## CI

[`.github/workflows/demo-test-evidence.yml`](../.github/workflows/demo-test-evidence.yml)
runs `npm run demo` on pull requests that touch `demo/` and on manual dispatch,
writes a results table to the run summary, and uploads the evidence. Its
optional `github-attest` job publishes each predicate through `actions/attest`
(Sigstore keyless, identity = the workflow); that needs a public repository or
GitHub Enterprise Cloud.

## Layout

```
product/            the product under test
tests/catalog.yaml  scenario catalog: what each test is meant to verify
tests/<category>/   scenarios and config per category
evidence/           runner, converters, statement builder, DSSE signing, sign-off tool
gate/               policy, verifier, negative cases
out/                generated: raw/, results/, attestations/, vsa.dsse.json (gitignored)
```
