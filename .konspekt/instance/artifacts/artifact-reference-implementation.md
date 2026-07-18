```yaml
id: artifact-reference-implementation
type: artifact
title: code_tracer — Reference implementation scope
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-17T20:45:00Z
provenance:
  conversationId: konspekt-ri-scoping
  timestamp: 2026-07-17T20:45:00Z
createdAt: 2026-07-17T20:45:00Z
updatedAt: 2026-07-17T20:45:00Z
```
# code_tracer — Reference implementation scope

**Status:** accepted (`review: accepted`). Scopes the walking-skeleton
implementation of code_tracer. Sits on `artifact-architecture` (the design it
realizes), `artifact-product-lifecycle` (the state machine the console renders),
and `artifact-data-model` (the records and projections it reads/writes). The
work goal is `goal-reference-implementation`.

## 1. The thesis — what the RI must prove

The RI is not "build code_tracer." It is a **walking skeleton** that makes one
sentence executable and falsifiable — the single most load-bearing claim in the
design (`osera-bank-verification.md`): *the bank needs no new verification
mechanism, because the L-1 contract compiles to an in-toto/Witness layout a stock
verifier already enforces.* The RI demonstrates that end-to-end on one synthetic
backpatch, **offline**, producing a promote/reject verdict a regulator could
re-run to the same answer.

## 2. In / out — the boundary is the discipline

The RI is the **consumption half only** — which is exactly what code_tracer is
(architecture §1, "Inside"). The production side is faked with fixtures.

**In (v1):**
- The five gate components ①–⑤ wired into one offline `gate` CLI:
  `gate verify --candidate <digest> --bundle <dir> --layout <compiled>` → a
  signed `verdict` + a `ledger-event`.
- The lifecycle console ⑥ (`task-lifecycle-ui`), dashboard + gate-trigger.
- Class (a) OSERA-backpatched OSS only.

**Out, named so nobody drifts into them:**
- Production side (L0–L7, real quorum rebuilds) → **fixtures**
  (`task-fixtures`). No real reproducible rebuild.
- Trust-root governance / TUF key rotation → **static throwaway keys**. The RI
  needs *a* trust root, not the *right* one; the §9 gap stays a gap.
- Real CMDB → a JSON file backs the `application` record.
- Archivista → resolver v1 reads a **local directory**, behind an interface
  Archivista can later replace (keeps the Archivista decision deferrable).
- Class (b) FINOS-native → a later parameterization; its depth is itself open.

## 3. Components across the phases

Build the spine first, then breadth. Each phase is demoable on its own.

| Phase | Delivers | Components | Proves |
|---|---|---|---|
| 0 | Fixtures + known-bad variants | `task-fixtures` | there is something to verify; the bad variants are the test suite |
| 1 | Spine / happy path: contract→layout, resolve, structural verify → ADMIT | ① ③ + `witness verify` (structural) | **the de-risking claim** — a stock verifier enforces the compiled contract |
| 2 | Semantics: rules 1–13 as Rego in the Witness policy → single verdict | ② | the meaning in-toto can't read (CVEs-fixed ⊇ scope, coverage ≥ thr, conformance==FULL) |
| 3 | Quorum: `threshold: k` + zero-dissent | ② over the L8 set | dissent is **disqualifying, not outvoted** (§3.6) — the dissenting fixture REJECTs |
| 4 | Acceptance harness: L9 in-toto inspection | ④ | the bank check is *inside* the gate; the layout requires `bank-acceptance` but never supplies its command |
| 5 | Ledger + renewal; console over projections | ⑤ ⑥ | append-only replay; osera.1→osera.2 supersede; "what was in force in March?" |

Per `noteworthy-ri-stack`, ① and ② are not two tools: the contract compiles to a
Witness policy and structural + semantic run as one `witness verify` pass.

## 4. Stack

Tiered-A, fixed in `noteworthy-ri-stack`: **Witness** verification engine (a Go
binary, invoked as a subprocess); **TypeScript** (Node + React) app/orchestration
+ console tier; an independent fixtures generator. The UI reads the data model's
mutable projections and never writes state directly.

## 5. Acceptance criteria

- **The replay property is first-class, from Phase 1 on.** Run the gate twice
  from stored inputs → **byte-identical verdict, no network**. This is the
  property architecture §1 leans on, not a nicety bolted on at the end.
- **The done demo:** one offline command turns the conforming fixture into ADMIT
  with a signed `verdict` + `ledger-event`; flipping any single fixture to its
  bad variant yields **REJECT naming the failing rule**; two runs → identical
  verdict.
- **Zero-dissent quorum** (Phase 3) and **inspection-command-not-in-layout**
  (Phase 4) are explicit named tests, being the design's most distinctive
  behaviors.

## 6. Open items

- **UI v1 scope** — v1 is dashboard + gate-trigger; console write-paths
  (risk-acceptance sign-off for the §3.8 `warranty: none` finding,
  retire-vs-renew at sunset) are deferred to v2 and must each land as an event
  or a signed attestation, never a direct write.
- **Class (b) depth** — how far the gate collapses L0–L7 for FINOS-native
  projects before the RI parameterizes for it (inherits architecture §9).
- **Archivista swap** — when resolver ③ graduates from local-dir to Archivista.
- **Quorum parameters** — concrete `k`/`n` for the fixture set (inherits §9).
