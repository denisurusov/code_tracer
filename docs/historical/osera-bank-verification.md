# Bank-Side Fulfilment Verification — Design Note

**Question this answers:** how does a regulated bank verify that a backpatch
contract was *fulfilled* — before ingesting the code?

**Companion to:** `osera-attestation-chain.md` (the evidence) and
`osera-backpatch-contract.md` (the commitment).

**Key finding:** the bank does **not** need new verification infrastructure. The
contract compiles to an **in-toto layout**, and in-toto verification is already
deployed in the bank. Fulfilment verification is *running the tool the bank
already runs* against the layout plus the collected attestations. This is the
single most important de-risking fact in the whole design: adoption does not
require the bank to trust a new mechanism, only to point an existing one at a
new layout.

> **Provenance / recovery note.** Reconstructed on 2026-07-17 from the *FINOS
> OSERA project lookup* conversation (2026-07-15). The original was a
> per-conversation output file, which does not persist. Sections §1–§6 are
> recovered substantially intact; §7 (open questions) is partial — only items
> 4–5 were preserved. Re-paste the original for a byte-complete copy.

---

## 1. The mapping: our design is already in-toto

in-toto (CNCF graduated; the framework SLSA provenance is built on) has exactly
the primitives we invented, under standard names:

| OSERA design element | in-toto primitive | What it means |
|---|---|---|
| The contract (L-1) | **Layout** | The signed policy: required steps, authorized keys, artifact rules, expiry |
| Provider P, FINOS, quorum firms, the bank | **Functionaries** | Named actors, each with a signing keypair |
| Attestations L0–L8 | **Links / Statements** | Signed evidence that one step executed |
| "both digests in every link" | **Materials / Products rules** | The product of step N must be the material of step N+1 — this threads the DAG and is *enforced*, not just documented |
| k-of-n quorum verification | **Threshold** | A step may require m-of-n functionary signatures — native, not bolted on |
| FINOS / bank independent rebuild | **Inspection** | A command the *verifier* runs at verification time, whose result feeds pass/fail |
| Bridge expiry | Layout **expiration** | Verification fails after the layout expires |
| The admission gate | `in-toto-verify` | The single command that evaluates all of the above |

**Consequence:** "did the provider fulfil the contract" becomes a mechanical
question — `in-toto-verify` passes or it doesn't. No human reads a PDF. No
bespoke checker to build, certify, or get a second-line sign-off on.

---

## 2. The contract *is* the layout

The backpatch contract (`osera/backpatch-contract/v1`) is not merely *checked
by* a layout — it **compiles to one**. The alliance issues the contract; a
deterministic transform emits the in-toto layout the bank verifies against. One
authored artifact, two representations, same digest lineage.

Sketch of the compiled layout (elided to the load-bearing parts):

```jsonc
{
  "_type": "layout",
  "expires": "2027-06-30T00:00:00Z",          // = contract.schedule.bridgeExpiry
  "readme": "OSERA-2026-0142 v1 compiled layout",

  "keys": {
    "provider-p":  { /* provider pubkey */ },
    "finos":    { /* verifier-quorum root, or threshold group */ },
    "verifier-db": {}, "verifier-gs": {}, "verifier-ms": {},
    "bank-self": { /* the bank's own inspection key */ }
  },

  "steps": [
    {
      "name": "baseline",
      "expected_materials": [
        // the baseline must be the public artifact the contract names
        ["MATCH", "commons-x-1.2.3.jar", "WITH", "PRODUCTS",
         "FROM", "maven-central-anchor"],
        ["DISALLOW", "*"]
      ],
      "expected_products": [["ALLOW", "commons-x-1.2.3.jar"]],
      "pubkeys": ["provider-p"], "threshold": 1
    },
    {
      "name": "transform",
      // product of baseline is material of transform — DAG thread, enforced
      "expected_materials": [["MATCH", "commons-x-1.2.3.jar", "WITH", "PRODUCTS",
                              "FROM", "baseline"]],
      "expected_products": [["ALLOW", "commons-x-1.2.3-osera.1.jar"],
                            ["ALLOW", "*.recipe"]],
      "pubkeys": ["provider-p"], "threshold": 1
    },
    {
      "name": "build-provenance",
      "expected_materials": [["MATCH", "*", "WITH", "PRODUCTS", "FROM", "transform"]],
      "expected_products": [["ALLOW", "commons-x-1.2.3-osera.1.jar"]],
      "pubkeys": ["provider-p"], "threshold": 1
    },
    {
      "name": "quorum-verify",
      // THIS is the k-of-n. Three independent verifiers must sign this step.
      "expected_materials": [["MATCH", "commons-x-1.2.3-osera.1.jar",
                              "WITH", "PRODUCTS", "FROM", "build-provenance"]],
      "expected_products": [["ALLOW", "commons-x-1.2.3-osera.1.jar"]],
      "pubkeys": ["finos", "verifier-db", "verifier-gs", "verifier-ms"],
      "threshold": 3                            // = contract.verification.k
    }
  ],

  "inspections": [
    {
      // the bank runs its OWN rebuild/acceptance at verify time.
      // if THIS fails, ingest fails — regardless of what the provider/quorum signed.
      "name": "bank-acceptance",
      "expected_materials": [["MATCH", "commons-x-1.2.3-osera.1.jar",
                              "WITH", "PRODUCTS", "FROM", "quorum-verify"]],
      "expected_products": [["ALLOW", "acceptance-report.json"]],
      "run": "run-bank-acceptance-suite --artifact commons-x-1.2.3-osera.1.jar"
    }
  ]
}
```

The three properties this buys, all native:

- **`MATCH ... FROM` rules thread the DAG.** in-toto *enforces* that the artifact
  leaving `transform` is the artifact entering `build-provenance`. Our "both
  digests in every link" principle is not documentation here — it is a
  verification rule that fails closed.
- **`threshold: 3` on `quorum-verify`** is the k-of-n quorum, expressed in one
  integer. If only two verifiers signed, or three signed but one dissented
  (different product digest), the step fails.
- **`inspections`** run the bank's own acceptance suite *during* verification.
  The bank is not a passive consumer of the quorum's word; it is itself a
  functionary whose check can veto ingest.

---

## 3. The verification flow at the bank's gate

What actually executes when an OSERA artifact hits the repository manager:

```
1. RESOLVE     collect layout + all link/statement files for artifact digest
               (from OCI referrers / sigstore bundle — attestation-chain §1)

2. INVOKE      in-toto-verify \
                 --layout osera-2026-0142.layout \
                 --verification-keys alliance-root.pub \
                 --link-dir ./collected-attestations

   in-toto-verify then checks, in one pass:
     a. layout signed by the alliance root key, not expired
     b. every step has its required threshold of links
     c. every link signed by an AUTHORIZED functionary (right key, right step)
     d. materials/products rules satisfied  → DAG intact, no artifact swap
     e. inspections run  → BANK's own acceptance suite executes here
     f. inspection results satisfy their rules

3. GATE        exit 0  → promote to golden internal repo
               exit ≠0 → quarantine, do not ingest, raise finding
```

**Fulfilment is proven iff `in-toto-verify` returns 0.** That is the entire
answer to "how does the bank verify the contract was fulfilled." No new trust,
no new tool.

---

## 4. Why this is strong for a regulator (and a bank's second line)

- **The policy is the artifact.** The layout *is* the contract. There is no gap
  between "what was agreed" and "what is enforced" — they are the same signed
  object. An auditor verifies the layout digest matches the accepted contract,
  and everything downstream is mechanical.
- **Verification is replayable by the regulator.** `in-toto-verify` is
  open-source, deterministic, and takes only public inputs (layout, links,
  keys). A regulator can re-run the exact verification the bank ran and get the
  same answer. Few controls in a bank can claim independent re-execution by the
  supervisor.
- **The bank's own check is inside the gate, not beside it.** Via inspections,
  "we independently accepted this" is part of the same cryptographic pass/fail —
  not a separate manual attestation someone has to remember to file.
- **Failure is specific.** in-toto tells you *which* step failed, *which*
  functionary was unauthorized, *which* artifact rule broke. That is an
  actionable finding, not "verification failed."
- **CRA alignment is direct.** in-toto is already positioned as the verification
  mechanism for demonstrating an authorized, untampered pipeline — exactly the
  evidence the CRA's vulnerability-handling and supply-chain obligations call for.

---

## 5. Existing in-toto ecosystem the bank can lean on

Rather than build, integrate:

- **`in-toto-verify`** (Python reference impl, v1.0, production-stable) — the
  gate itself.
- **Witness** — CLI that generates in-toto attestations inside CI/CD and carries
  its own **OPA/Rego policy engine**. Useful because the bank's *admission rules*
  (attestation-chain §6, rules 1–13) can be expressed as Rego alongside the
  layout, covering the OSERA-specific predicate fields that a bare layout doesn't
  natively reason about (e.g. `conformance == "FULL"`, `regressionsVsBaseline == 0`).
- **Archivista** — storage + graph service for in-toto attestations; solves
  "resolve all links for this digest" at scale and lets you *traverse* the DAG
  for the exposure-graph domain.
- **cosign** — attach/verify DSSE-wrapped attestations against the artifact in
  the registry; the OCI-referrer resolution from attestation-chain §1.

Division of labour: **layout** handles structure, authorization, thresholds, DAG
integrity, and inspections. **Rego (via Witness)** handles the semantic predicate
checks specific to OSERA. Together they cover the full admission policy.

---

## 6. The one genuine gap

in-toto verifies **that the pipeline ran as specified by authorized parties,
untampered.** It does **not** read the *meaning* inside a predicate. "0
regressions" being an authentically signed statement isn't the same as it being
true.

So the semantic checks — CVEs-fixed ⊇ CVEs-in-scope, digestMatch across
verifiers, coverage ≥ 0.90 — ride in a **Rego policy via Witness** at the same
gate. **Structure → layout; meaning → Rego.** Neither alone is enough, and
saying that out loud is what stops someone concluding "in-toto passed, therefore
it's good."

---

## 7. Open questions for the working group

Partially recovered — the following items were preserved:

4. **Can the layout supply the bank's inspection command?** Recommend hard no:
   inspections are bank-authored only; the layout may *require* that an
   inspection named `bank-acceptance` exists, but never supply its command.
5. **Archivista as the exposure-graph backend:** the same attestation store that
   answers "resolve links for this digest" can answer "which apps consume this
   coordinate." Worth evaluating Archivista as the graph substrate for the
   adoption-tracking domain rather than standing up a separate store.

> **[Recovery note — items 1–3 were not preserved in the transcript.]**
