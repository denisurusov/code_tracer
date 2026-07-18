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
