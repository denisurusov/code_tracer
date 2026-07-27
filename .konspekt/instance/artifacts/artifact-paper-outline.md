```yaml
id: artifact-paper-outline
type: artifact
title: Paper — Contract-Bound Evidence (accepted outline)
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-27T00:00:00Z
provenance:
  conversationId: konspekt-architecture-tooling
  timestamp: 2026-07-21T23:10:00Z
createdAt: 2026-07-21T23:10:00Z
updatedAt: 2026-07-27T00:00:00Z
```
# Paper — Contract-Bound Evidence

**Working title:** *Contract-Bound Evidence: Admitting Externally-Patched Open
Source into a Regulated Estate*

**Thesis.** If the specification is commissioned and countersigned before work
starts, and k independent parties re-derive the result with zero dissent, then
admitting externally-patched open source becomes a mechanical control statement
rather than an act of vendor trust.

**Model name:** *contract-bound evidence*. Chosen because **bind** is already the
design's own verb — the contract binds the chain, subjects are digest-bound, every
decision record ends in a `Binds:` line. The paper and the graph share vocabulary.

## Framing decisions (settled)

- **Audience:** FINOS working group + bank OSPO/platform engineering. Both
  technical, but they ask different questions — the WG asks *should the alliance
  work this way?*, the OSPO asks *what do I run and what does it cost me?* Hence
  the four-part split rather than a flat section list.
- **Scope:** the model is **general**; **OSERA is kept as the worked instance**
  and supplies the vocabulary. Genericizing the artifacts is not worth the churn.
  Cost of this choice: two explicit paragraphs — one early stating that nothing
  depends on OSERA existing, one late in *what generalizes*. Without them readers
  will take it as an alliance-specific proposal and the transportable idea (§5)
  gets undersold.
- **Product:** `code_tracer` is named as the **reference implementation** of the
  model, not as the subject.
- **Length:** full treatment, ~8,000 words.

## Structure

| Part | Sections | Words | Audience weight |
|---|---|---|---|
| Front matter | thesis, generality caveat, worked example introduced | 700 | both |
| **I — The model** | 1 the bind · 2 why provider-produced evidence isn't evidence · 3 commissioned specification · 4 the chain and the anchor · 5 **verification does not compress** | 2,200 | both; §5 is the centrepiece |
| **II — Commissioning & trust** | 6 issuance, amendment, binary conformance · 7 trust root without a weaker tier · 8 verification as duty, and what k should be | 1,600 | FINOS WG |
| **III — Admission & afterlife** | 9 contract compiles to layout · 10 the perimeter and the evidence bundle · **what you actually deploy** · 11 bridges expire · 12 ecosystem support | 2,400 | bank OSPO |
| **IV — Limits** | 13 malicious-but-reproducible patch · semver · schema compatibility · n < 3 | 900 | both |
| Close | the control statement | 200 | both |

**Appendices:** the 16 admission rules · the diagram set (`docs/resource/`) · the
worked example end to end · `code_tracer` component register.

## The worked example — jackson-databind

One contract runs the whole paper rather than sitting in an appendix: a
deserialization CVE in a `jackson-databind` version pinned by a framework BOM.

Chosen because it is the honest shape of the problem:

- **Nobody adopts it deliberately** — it arrives transitively, several levels
  down, in hundreds of applications.
- **The upgrade is blocked by coupling, not effort** — moving it means moving the
  framework BOM, which means a release train the app team does not control.
- **Deserialization CVEs recur**, so the renewal loop is demonstrated rather than
  asserted: bridge one closes a set, a new set surfaces, bridge two is
  commissioned under its own contract and baseline.
- **API/ABI stability genuinely matters**, so `apiAbiStability: required` and the
  compatibility threshold carry weight instead of reading as boilerplate.
- **The Maven anchor is strong**, which sets up §12 by contrast: the same example
  in npm would be materially harder.

> **Drafting note.** Exact CVE identifiers and fixed-in versions MUST be verified
> against a live source at drafting time, never asserted from memory. A wrong CVE
> number in a working-group paper undermines everything around it, and the check
> is cheap.

## Drafting order

Part I first for voice-check, then III (the most weight and the least existing
prose — the deployment story is written fresh and is what OSPO readers will judge
the paper on), then II, then IV.

**Sources:** Parts I and II assemble largely from accepted records
(`artifact-architecture` §3, the noteworthy set). Part III draws on
`artifact-deployment-topology`, `artifact-evidence-bundle`, and
`docs/osera-bank-verification.md`. Part IV is the open-items list across
`artifact-architecture` §9 and the ecosystem record.
