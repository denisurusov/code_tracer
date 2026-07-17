```yaml
id: noteworthy-sbom-format
type: noteworthy
title: Decision — SBOM format (CycloneDX authoritative)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T19:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: 5a7720104b12a04ee5330af98d898a65d3770b6f
  contentHash: 5a7720104b12a04ee5330af98d898a65d3770b6f
  timestamp: 2026-07-17T19:00:00Z
createdAt: 2026-07-17T19:00:00Z
updatedAt: 2026-07-17T19:00:00Z
```
# Decision: SBOM format (CycloneDX authoritative)

**Decision.** The L6 SBOM (composition + diff-vs-baseline) is **CycloneDX**, and
it is the authoritative source of truth. **SPDX license identifiers are embedded**
inside it (CycloneDX carries `licenses` as SPDX license expressions). An **SPDX
projection is emitted on demand** when a downstream consumer or regulator
requires that format — an export view, never a second authority. VEX is
unaffected: it stays **OpenVEX/CSAF at L7** (we are not adopting CycloneDX-VEX).

**Why CycloneDX.**
- Security/backpatch-native, and our use is exactly that: its `pedigree`
  (ancestors, variants, commits, patches) models "this is a hardened variant of
  `3.2.1`" directly — the same is-hardening-of relationship fixed in
  `noteworthy-purl-namespace`. SPDX can express lineage (`VARIANT_OF`,
  `PATCH_FOR`) but bolts it on rather than centering it.
- purl-first, aligning with chain principle #1 and the `-osera.N` purl. SPDX
  carries purl only via external refs.
- Picking it costs little of SPDX's value: SPDX license IDs live *inside*
  CycloneDX, so the main reason to choose SPDX (license/compliance expression) is
  retained.
- No format-family conflict: L7 VEX stays OpenVEX, so there is no CycloneDX-VEX
  vs OpenVEX clash.

**Cost & mitigation.** SPDX is the ISO standard (5962) and some consumers/
regulators may specifically require it. Mitigation: CycloneDX is the source of
truth; emit an SPDX projection on demand. Conversion is lossy on
pedigree/patch detail, so SPDX stays an export view rather than a co-authority,
and dual-format is deliberately *not* baked into the schema now.

**Binds:** L6 `sbom` sub-schema in `artifact-data-model` §4. **Resolves:** the
CycloneDX-vs-SPDX open item in `artifact-data-model` §6 and `artifact-architecture`
§7/§9.
