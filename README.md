# code_tracer

**The bank-side admission gate for externally-hardened open source.**

A bank runs an old version of a widely-used library. Upgrading is a project;
the vulnerability is now. An external party patches the old version — fixing the
flaw and nothing else — and asks the bank to accept it.

code_tracer is what stands at that door: the on-prem gate that decides whether
the patched version is admitted, and the ledger that tracks what the bank is
relying on afterwards and until when.

It is **not** the supply chain. It is the gate and ledger at the *end* of one.

---

## Context: OSERA

[OSERA](https://www.finos.org/) — the Open Source Enterprise Resiliency Alliance,
a FINOS coalition — mutualizes the cost of backpatching old, widely-shared open
source across regulated banks. One party does the work once; many banks consume
the result.

That only works if each bank can verify the result **itself**, mechanically,
without trusting the producer's word. code_tracer is one bank's half of that
arrangement.

Two ingest classes arrive at the gate:

- **(a)** OSERA-backpatched existing open source — a known baseline and a
  transformation of it.
- **(b)** FINOS-native projects — no baseline; provenance and project health
  instead.

From the moment evidence crosses the bank perimeter, the machine is
class-agnostic. That invariant is load-bearing: it is what lets the gate be a
single parameterized tool rather than two.

## The contract

The bank and the external party agree a **machine-readable contract** before any
work starts. It fixes:

- the **original state** of the software, by digest, before anyone touched it
- the **specific changes** requested — which flaws, and explicitly which not
- the **tests expected to run**, frozen so the corpus cannot be weakened later
- the **acceptance thresholds** — coverage floors, interface-stability budget,
  reproducibility level, delivery deadline

Admission is then mechanical rather than a PDF somebody reads. The contract is
the root of all the evidence that follows, and it compiles directly into the
policy the verifier enforces.

Schema and rationale: [`docs/osera-backpatch-contract.md`](docs/osera-backpatch-contract.md).

## Two zones

The design splits at the bank perimeter, and nearly every decision follows from
which side of it something sits on.

| | Outside | Inside |
|---|---|---|
| Whose infrastructure | the external party's and the verifiers' | the bank's |
| What happens | build, test, independently rebuild | resolve, gate, adopt, track, sunset |
| Evidence is | **produced** | **consumed** |
| code_tracer runs here | no | **yes** |

Everything inside runs **hermetically and offline** — no network call at
verification time — so a regulator can re-run the same inputs and reach the same
verdict, byte for byte.

## The evidence chain

Eleven signed records accrue as a candidate moves through its life, `L-1` through
`L9`: the contract, the identified original, the flaws before, the change itself,
the build, the tests, proof each flaw is genuinely fixed, the parts list, the
flaw status after, the independent rebuilds, and finally the bank's own
acceptance tests.

Two properties do the heavy lifting:

- **Proof of fix must fail on the original and pass on the patch.** A test that
  passes on the unpatched version proves nothing.
- **Dissent is disqualifying, not outvoted.** Independent verifiers rebuild the
  artifact; a single disagreement blocks admission even when the numeric
  threshold is met. Threshold and zero-dissent are two separate conditions.

Detail: [`docs/osera-attestation-chain.md`](docs/osera-attestation-chain.md).

## The gate

Structural verification asks whether the pipeline is *shaped* correctly — right
steps, right signers, chain intact. Semantic policy asks what it *means* — are
the flaws fixed a superset of the agreed scope, does coverage clear the floor,
did every verifier agree.

Both run inside the bank, in one pass, offline. The load-bearing claim of the
whole design is that **the bank needs no new verification mechanism**: the
contract compiles to a layout a stock in-toto/Witness verifier already enforces.

Five components do not exist off the shelf and are the product surface; the rest
integrates proven open source (in-toto-verify, cosign, Archivista):

| | Component | Does |
|---|---|---|
| ① | Contract → layout compiler | turns the agreed contract into enforceable policy |
| ② | Semantic policy | the meaning a structural verifier cannot read |
| ③ | Attestation resolver | finds and collects the evidence for an artifact |
| ④ | Acceptance harness | runs the bank's own tests as part of the gate |
| ⑤ | Exposure + sunset tracker | the ledger — who relies on what, until when |
| ⑥ | Lifecycle console | a read-only view across the whole cycle |

Detail: [`docs/osera-bank-verification.md`](docs/osera-bank-verification.md).

## The bridge, and why it expires

A backpatch is deliberately temporary. A privately-maintained fork of an old
release is itself a standing liability, so every fix ships with a **sunset date**
and a stated upgrade target. No fix is commissioned without an exit.

At sunset, exactly one of two things happens: the application moves to the
properly-upgraded release, or the fix is **re-issued**.

A re-issue is modelled as a **new candidate that supersedes the old one**, never
the same record with a changed date. Each re-issue has its own contract, its own
baseline, and very likely a new set of flaws discovered since. A mutable status
field could not represent that without silently overwriting the contract the
prior version was verified against — and could not answer the question that
matters after the fact: *what was in force in March, and what did it cover?*

The ledger is append-only and hash-chained. Current state is a projection
replayed from the event log, not the authority.

## The operator's view

[**`lifecycle-mockup.html`**](lifecycle-mockup.html) — open it in a browser — walks
a single fix across the whole lifecycle, from contract to expiry and round the
renewal, and shows what an operator actually sees at each step.

It is a **design mockup, not an implementation**: the visual target the lifecycle
console (⑥) is built against, settled before the console is written rather than
discovered during it. Four screens — the board, the decision, the exposure table,
the history — each shown at the moment it carries the most information, with the
contract's terms set beside what was actually delivered.

Every label is written for someone who has never heard of OSERA, with the
technical term demoted to a small chip beside it; the underlying values —
fingerprints, test counts, thresholds, timestamps — are one hover away. A closing
section maps every standard the design uses back to where it appeared on the
screens above.

Two caveats, also stated on the page itself: the **refusal case is not yet drawn**
— every screen shows a fix being accepted, which is half of what the gate does —
and while the scenario, thresholds and schedule come from the fixture spec, the
fingerprints, test counts and application names are invented to make the screens
concrete.

## Repository layout

```
lifecycle-mockup.html   design mockup of the lifecycle console — open in a
                        browser
docs/                   working-group design notes — contract schema,
                        attestation chain, bank-side verification, standards
.konspekt/              project state in konspekt format: goals, tasks,
                        decisions, artifacts, and the edges between them
lib/                    konspekt conformance checker and validator
.github/                conformance CI and notification workflows
```

[`docs/README.md`](docs/README.md) indexes both — the design artifacts and the
working-group notes — and says which supersedes which.

### Design state lives in `.konspekt/`

This repo carries its own design state as data rather than prose. Goals decompose
into tasks, decisions are recorded as first-class records with their rejected
alternatives, and everything is append-only and hash-anchored.

Start at [`.konspekt/instance/project.md`](.konspekt/instance/project.md); the
architecture, product lifecycle, data model and reference-implementation scope
are under `.konspekt/instance/artifacts/`.

Validate the instance:

```sh
node lib/validate.mjs
```

The maintenance loop and the rules governing it are in
[`.konspekt/OPERATING.md`](.konspekt/OPERATING.md). The short version: proposals
are made continuously, but only a human command accepts them.

## Status

**Design, with a reference implementation scoped and not yet built.**

The architecture, product lifecycle, data model and contract schema are settled.
The reference implementation is a deliberate walking skeleton — it implements the
consumption half only, on a single synthetic backpatch, with the production side
faked by fixtures. If it starts standing up a patching pipeline, it has lost the
plot.

Its acceptance test is one sentence: one offline command turns the conforming
fixture into an admission with a signed verdict; flipping any single fixture to a
known-bad variant yields a refusal naming the rule it failed; and two runs
produce byte-identical verdicts with no network.

Scope and phases: [`.konspekt/instance/artifacts/artifact-reference-implementation.md`](.konspekt/instance/artifacts/artifact-reference-implementation.md).

## Known gaps

Named rather than hidden — each is tracked in `.konspekt/`:

- **Trust-root governance.** Key rotation and revocation via TUF is the one
  genuine gap in the verification story. The reference implementation uses static
  throwaway keys: it needs *a* trust root, not the *right* one.
- **Anchor re-derivation.** Confirming the baseline against its public source at
  verify time conflicts with running hermetically offline; currently satisfied
  against a local snapshot.
- **Class (b) depth.** How far the chain collapses for FINOS-native projects,
  which have no baseline to transform.

## Standards

code_tracer composes existing standards rather than inventing formats: in-toto
attestations and layouts, DSSE envelopes, SLSA provenance, CycloneDX SBOMs, VEX
for exploitability, Sigstore signing, Package URL coordinates, and Rego for
policy.

Full register with maturity assessments:
[`docs/osera-standards-register.md`](docs/osera-standards-register.md).
