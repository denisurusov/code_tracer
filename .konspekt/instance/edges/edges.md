```yaml
provenance:
  conversationId: finos-osera-project-lookup
  timestamp: 2026-07-16T00:00:00Z
review: accepted
```
# Edges

Single typed edge table (konspekt serialization v1). `from` / `to` are
`type:id`. `provenance` and `review` are the file-level defaults above.
`weight` is meaningful only for `relates`. Edge kinds: `decomposes`,
`mentions`, `relates`, `produces`, `notes`, `marks`, `supersedes`.

| id | kind | from | to | weight |
|----|------|------|----|--------|
| e-dec-gate-ingest | decomposes | node:goal-admission-gate | node:investigation-ingest-classes | |
| e-dec-gate-thegate | decomposes | node:goal-admission-gate | node:goal-the-gate | |
| e-dec-gate-domains | decomposes | node:goal-admission-gate | node:investigation-domain-map | |
| e-dec-thegate-compiler | decomposes | node:goal-the-gate | node:task-layout-compiler | |
| e-dec-thegate-rego | decomposes | node:goal-the-gate | node:task-rego-policy | |
| e-dec-thegate-resolver | decomposes | node:goal-the-gate | node:task-attestation-resolver | |
| e-dec-thegate-harness | decomposes | node:goal-the-gate | node:task-acceptance-harness | |
| e-dec-thegate-tracker | decomposes | node:goal-the-gate | node:task-exposure-tracker | |
| e-prod-gate-arch | produces | node:goal-admission-gate | artifact:artifact-architecture | |
| e-mark-kickoff-gate | marks | waypoint:waypoint-kickoff | node:goal-admission-gate | |
| e-mark-kickoff-arch | marks | waypoint:waypoint-kickoff | artifact:artifact-architecture | |
| e-prod-gate-lifecycle | produces | node:goal-admission-gate | artifact:artifact-product-lifecycle | |
| e-rel-arch-lifecycle | relates | artifact:artifact-architecture | artifact:artifact-product-lifecycle | 0.9 |
| e-prod-gate-datamodel | produces | node:goal-admission-gate | artifact:artifact-data-model | |
| e-rel-lifecycle-datamodel | relates | artifact:artifact-product-lifecycle | artifact:artifact-data-model | 0.95 |
| e-rel-arch-datamodel | relates | artifact:artifact-architecture | artifact:artifact-data-model | 0.85 |
| e-prod-gate-purl | produces | node:goal-admission-gate | noteworthy:noteworthy-purl-namespace | |
| e-notes-purl-datamodel | notes | noteworthy:noteworthy-purl-namespace | artifact:artifact-data-model | |
| e-notes-purl-arch | notes | noteworthy:noteworthy-purl-namespace | artifact:artifact-architecture | |
| e-prod-gate-sbom | produces | node:goal-admission-gate | noteworthy:noteworthy-sbom-format | |
| e-notes-sbom-datamodel | notes | noteworthy:noteworthy-sbom-format | artifact:artifact-data-model | |
| e-notes-sbom-arch | notes | noteworthy:noteworthy-sbom-format | artifact:artifact-architecture | |
| e-prod-gate-candkey | produces | node:goal-admission-gate | noteworthy:noteworthy-candidate-key | |
| e-notes-candkey-datamodel | notes | noteworthy:noteworthy-candidate-key | artifact:artifact-data-model | |
| e-prod-gate-ledger | produces | node:goal-admission-gate | noteworthy:noteworthy-ledger-substrate | |
| e-notes-ledger-datamodel | notes | noteworthy:noteworthy-ledger-substrate | artifact:artifact-data-model | |
| e-notes-ledger-arch | notes | noteworthy:noteworthy-ledger-substrate | artifact:artifact-architecture | |
| e-dec-gate-ri | decomposes | node:goal-admission-gate | node:goal-reference-implementation | |
| e-dec-ri-fixtures | decomposes | node:goal-reference-implementation | node:task-fixtures | |
| e-dec-ri-ui | decomposes | node:goal-reference-implementation | node:task-lifecycle-ui | |
| e-rel-ri-thegate | relates | node:goal-reference-implementation | node:goal-the-gate | 0.9 |
| e-prod-ri-artifact | produces | node:goal-reference-implementation | artifact:artifact-reference-implementation | |
| e-prod-ri-stack | produces | node:goal-reference-implementation | noteworthy:noteworthy-ri-stack | |
| e-rel-riart-arch | relates | artifact:artifact-reference-implementation | artifact:artifact-architecture | 0.85 |
| e-notes-ristack-arch | notes | noteworthy:noteworthy-ri-stack | artifact:artifact-architecture | |
| e-notes-ristack-riart | notes | noteworthy:noteworthy-ri-stack | artifact:artifact-reference-implementation | |
| e-rel-fixspec-fixtures | relates | artifact:artifact-ri-fixtures-spec | node:task-fixtures | 0.95 |
| e-rel-fixspec-riart | relates | artifact:artifact-ri-fixtures-spec | artifact:artifact-reference-implementation | 0.85 |
| e-prod-gate-referent | produces | node:goal-admission-gate | noteworthy:noteworthy-referent-binding | |
| e-notes-referent-fixspec | notes | noteworthy:noteworthy-referent-binding | artifact:artifact-ri-fixtures-spec | |
| e-notes-referent-arch | notes | noteworthy:noteworthy-referent-binding | artifact:artifact-architecture | |
| e-dec-ri-mockup | decomposes | node:goal-reference-implementation | node:task-lifecycle-mockup | |
| e-prod-gate-conformance | produces | node:goal-admission-gate | noteworthy:noteworthy-conformance-binary | |
| e-notes-conformance-arch | notes | noteworthy:noteworthy-conformance-binary | artifact:artifact-architecture | |
| e-dec-gate-issuer | decomposes | node:goal-admission-gate | node:goal-issuer-side | |
| e-dec-issuer-authoring | decomposes | node:goal-issuer-side | node:task-contract-authoring | |
| e-dec-issuer-issuance | decomposes | node:goal-issuer-side | node:task-contract-issuance | |
| e-dec-issuer-registry | decomposes | node:goal-issuer-side | node:task-verifier-registry | |
| e-rel-issuer-compiler | relates | node:goal-issuer-side | node:task-layout-compiler | 0.9 |
| e-prod-issuer-contractlc | produces | node:goal-issuer-side | artifact:artifact-contract-lifecycle | |
| e-rel-contractlc-lifecycle | relates | artifact:artifact-contract-lifecycle | artifact:artifact-product-lifecycle | 0.95 |
| e-rel-contractlc-arch | relates | artifact:artifact-contract-lifecycle | artifact:artifact-architecture | 0.85 |
| e-rel-contractlc-datamodel | relates | artifact:artifact-contract-lifecycle | artifact:artifact-data-model | 0.8 |
| e-rel-contractlc-issuance | relates | artifact:artifact-contract-lifecycle | node:task-contract-issuance | 0.9 |
| e-prod-issuer-twosited | produces | node:goal-issuer-side | noteworthy:noteworthy-two-sited-scope | |
| e-notes-twosited-arch | notes | noteworthy:noteworthy-two-sited-scope | artifact:artifact-architecture | |
| e-prod-issuer-compiler | produces | node:goal-issuer-side | noteworthy:noteworthy-compiler-siting | |
| e-notes-compiler-arch | notes | noteworthy:noteworthy-compiler-siting | artifact:artifact-architecture | |
| e-notes-compiler-task | notes | noteworthy:noteworthy-compiler-siting | node:task-layout-compiler | |
| e-prod-issuer-trustroot | produces | node:goal-issuer-side | noteworthy:noteworthy-trust-root-ownership | |
| e-notes-trustroot-arch | notes | noteworthy:noteworthy-trust-root-ownership | artifact:artifact-architecture | |
| e-notes-trustroot-datamodel | notes | noteworthy:noteworthy-trust-root-ownership | artifact:artifact-data-model | |
| e-notes-trustroot-registry | notes | noteworthy:noteworthy-trust-root-ownership | node:task-verifier-registry | |
| e-prod-issuer-threshold | produces | node:goal-issuer-side | noteworthy:noteworthy-threshold-everywhere | |
| e-notes-threshold-arch | notes | noteworthy:noteworthy-threshold-everywhere | artifact:artifact-architecture | |
| e-rel-threshold-ledger | relates | noteworthy:noteworthy-threshold-everywhere | noteworthy:noteworthy-ledger-substrate | 0.8 |
| e-notes-conformance-contractlc | notes | noteworthy:noteworthy-conformance-binary | artifact:artifact-contract-lifecycle | |
| e-notes-conformance-authoring | notes | noteworthy:noteworthy-conformance-binary | node:task-contract-authoring | |
| e-prod-gate-bundle | produces | node:goal-admission-gate | artifact:artifact-evidence-bundle | |
| e-rel-bundle-arch | relates | artifact:artifact-evidence-bundle | artifact:artifact-architecture | 0.9 |
| e-rel-bundle-datamodel | relates | artifact:artifact-evidence-bundle | artifact:artifact-data-model | 0.85 |
| e-rel-bundle-lifecycle | relates | artifact:artifact-evidence-bundle | artifact:artifact-product-lifecycle | 0.8 |
| e-rel-bundle-resolver | relates | artifact:artifact-evidence-bundle | node:task-attestation-resolver | 0.9 |
| e-notes-twosited-bundle | notes | noteworthy:noteworthy-two-sited-scope | artifact:artifact-evidence-bundle | |
| e-notes-trustroot-bundle | notes | noteworthy:noteworthy-trust-root-ownership | artifact:artifact-evidence-bundle | |
