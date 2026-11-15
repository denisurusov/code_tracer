# code_tracer

**Admitting externally-hardened open source into a regulated estate.**

A bank runs an old version of a widely-used library. Upgrading is a project;
the vulnerability is now. An external party patches the old version — fixing the
flaw and nothing else — and asks the bank to accept it.

code_tracer is what stands at that door: the on-prem gate that decides whether
the patched version is admitted, and the ledger that tracks what the bank is
relying on afterwards and until when. It also covers the other end — the
alliance-side tooling that commissions the work in the first place, since a gate
that checks conformance to a commitment needs the commitment to be authored,
signed and machine-readable before any work starts.

It is **not** the supply chain. It is the two ends of one: what is promised, and
what is admitted.

**New here?** [`docs/build/explainer.html`](docs/build/explainer.html) is the
whole thing shown rather than described — the model, then one package carried
through every state of it, in language written for someone who has never heard of
OSERA. Twenty minutes, no prerequisites.

---

## Context: OSERA

[OSERA](https://www.finos.org/) — the Open Source Enterprise Resiliency Alliance,
a FINOS coalition — mutualizes the cost of backpatching old, widely-shared open
source across regulated banks. One party does the work once; many banks consume
the result.

That only works if each bank can verify the result **itself**, mechanically,
without trusting the producer's word.

Two ingest classes arrive at the gate:

- **(a)** OSERA-backpatched existing open source — a known baseline and a
  transformation of it.
- **(b)** FINOS-native projects — no baseline; provenance and project health
  instead.

From the moment evidence crosses the bank perimeter, the machine is
class-agnostic — and mode-agnostic. That invariant is load-bearing: it is what
lets the gate be a single parameterized tool rather than two.

## The contract

The alliance and the external party agree a **machine-readable contract** before
any work starts. It fixes:

- the **original state** of the software, by digest, before anyone touched it
- the **specific changes** requested — which flaws, and explicitly which not
- the **tests expected to run**, frozen so the corpus cannot be weakened later
- the **acceptance thresholds** — coverage floors, interface-stability budget,
  reproducibility level, delivery deadline
- **who signs, funds and therefore verifies**, and the inputs — source,
  transformation, toolchain — they and every later adopter rebuild from

Admission is then mechanical rather than a PDF somebody reads. The contract is
the root of all the evidence that follows, and it compiles directly into the
policy the verifier enforces.

The project machine it drives — drafted, proposed, accepted, delivered,
fulfilled — is
[`artifact-contract-lifecycle`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c/.konspekt/instance/artifacts/artifact-contract-lifecycle.md).

## Two zones

The design splits at the bank perimeter, and nearly every decision follows from
which side of it something sits on.

| | Outside | Inside |
|---|---|---|
| Whose infrastructure | the external party's and the signatories' | the bank's |
| What happens | build, test, independently rebuild | resolve, **rebuild again**, gate, adopt, track, sunset |
| Evidence is | **produced** | **consumed** |

Resolution is the last step that touches a network. Everything after it runs
**hermetically and offline** — so a regulator can re-run the same inputs and reach
the same verdict, byte for byte.

## The evidence chain

Eleven signed records accrue as a package moves through its life, `L-1` through
`L9`: the contract, the identified original, the flaws before, the change itself,
the build, the tests, proof each flaw is genuinely fixed, the parts list, the
flaw status after, the independent rebuilds, and finally the bank's own
acceptance tests.

Three properties do the heavy lifting:

- **Proof of fix must fail on the original and pass on the patch.** A test that
  passes on the unpatched version proves nothing.
- **Dissent is disqualifying, not outvoted.** Verification binds to the parties
  that signed and funded the contract; all of them must agree, and one
  disagreement blocks admission however many others concur.
- **The adopting bank rebuilds it too**, inside its own perimeter, and signs its
  own record of the result. This is identical whether the work was commissioned
  collectively or by one member alone, and it is what keeps the second case from
  needing a weaker tier.

Full chain, the sixteen admission rules, and the reasoning:
[`artifact-architecture`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c/.konspekt/instance/artifacts/artifact-architecture.md) §3.

## The gate

Structural verification asks whether the pipeline is *shaped* correctly — right
steps, right signers, chain intact. Semantic policy asks what it *means* — are
the flaws fixed a superset of the agreed scope, does coverage clear the floor,
did every verifier agree, is the trust material current, does each flaw record
still read as it did when the work was commissioned.

Both run inside the bank, in one pass, offline. The load-bearing claim of the
whole design is that **the bank needs no new verification mechanism**: the
contract compiles to a layout a stock in-toto/Witness verifier already enforces.

Nine components do not exist off the shelf and are the product surface; the rest
integrates proven open source (in-toto-verify, cosign, Archivista, TUF):

| | Component | Does | Side |
|---|---|---|---|
| ① | Contract → layout compiler | turns the agreed contract into enforceable policy | both |
| ② | Semantic policy | the meaning a structural verifier cannot read | bank |
| ③ | Resolver | finds the evidence, rebuilds the package, seals the bundle | bank |
| ④ | Acceptance harness | runs the bank's own tests as part of the gate | bank |
| ⑤ | Exposure + sunset tracker | the ledger — who relies on what, until when | bank |
| ⑥ | Lifecycle console | a read-only view across the whole cycle | bank |
| ⑦ | Contract authoring | scope, baseline, corpus, and the release-line judgement | alliance |
| ⑧ | Issuance & countersignature | signing, delivery, the hand-off freeze | alliance |
| ⑨ | Verifier registry & trust root | who may sign, and how keys rotate | alliance |

① is compiled on **both** sides and the digests must match, so a signed policy is
verified rather than merely authenticated.

## Two ways to commission

**Team** — members vote a project in and share the cost; every signatory verifies,
and at least two are required. **Solo** — one member commissions and funds alone,
and is the only outside verifier.

A bank goes solo to use the standards on work only it wants done, rather than to
obtain the alliance's endorsement. So solo output is published on the same terms
as team output, under its own trust path, with no gate in between: the path
records who commissioned it and never changes. What differs is how much
corroboration preceded the crossing, not what the gate requires or what an
adopting bank does.

## The bridge, and why it expires

A backpatch is deliberately temporary. A privately-maintained fork of an old
release is itself a standing liability, so every fix ships with a **sunset date**
and a stated upgrade target. No fix is commissioned without an exit.

At sunset, exactly one of two things happens: the application moves to the
properly-upgraded release, or the fix is **re-issued**.

A re-issue is modelled as a **new package that supersedes the old one**, never
the same record with a changed date. Each re-issue has its own contract, its own
baseline, and very likely a new set of flaws discovered since. A mutable status
field could not represent that without silently overwriting the contract the
prior version was verified against — and could not answer the question that
matters after the fact: *what was in force in March, and what did it cover?*

The ledger is append-only and hash-chained. Current state is a projection
replayed from the event log, not the authority.

## Reading it

Four documents, for four different readers.

**[`docs/build/explainer.html`](docs/build/explainer.html)** — the design shown.
The governance problem, the three machines, what crosses the perimeter, then one
package walked from contract to expiry. Plain language throughout, with the
technical term demoted to a chip beside it and the underlying values one hover
away. `explainer.pdf` beside it is the same document as rendered.

**[`docs/paper/`](docs/paper/)** — *Contract-Bound Evidence*, a working draft for
the formation working group, in four parts: the model, commissioning and trust,
admission and afterlife, and limits. The argument for the design rather than its
specification — written to be read start to finish by someone deciding whether
the approach is sound. Parts are authored as markdown and assembled; built
outputs live in [`docs/build/`](docs/build/), each stamped with the commit it was
built from.

**[`docs/lifecycle.md`](docs/lifecycle.md)** — the design as a reference. The
complete pass over all three state machines in bullet form, shortest route to a
specific rule.

**[`docs/operating-model.html`](docs/operating-model.html)** — who runs it. The
previous three describe the machine; this one describes the organisation around
it: twenty-nine activities, each with an actor, a clock and a record it leaves
behind. It also marks the values that are still somebody's to decide, and says
whose — the alliance's, a bank's, or ours.

## The operator's view

[**`docs/mockup.html`**](docs/mockup.html) — open it in a browser — walks a single
fix across the whole lifecycle and shows what an operator actually sees at each
step.

It is a **design mockup, not an implementation**: the visual target the lifecycle
console (⑥) is built against, settled before the console is written rather than
discovered during it. Four screens — the board, the decision, the exposure table,
the history — each shown at the moment it carries the most information, with the
contract's terms set beside what was actually delivered. The explainer above uses
these same screens as its worked example.

Two caveats, also stated on the page itself: the **refusal case is not yet drawn**
— every screen shows a fix being accepted, which is half of what the gate does —
and while the scenario, thresholds and schedule come from the fixture spec, the
fingerprints, test counts and application names are invented to make the screens
concrete.

## Repository layout

```
docs/                   publications — anything written for a reader
  lifecycle.md          the complete pass over all three state machines
  operating-model.html  who runs it, on what clock, and what it leaves behind
  mockup.html           design mockup of the lifecycle console
  paper/                Contract-Bound Evidence — sources and build scripts
  resources/            figures (SVG), authored
  build/                derived outputs, stamped with the commit they were
                        built from and never edited — plus explainer.html,
                        which is authored and its own source
  historical/           working-group notes, frozen at reconstruction
.konspekt/NOTES.md      human scratchpad
demo/                   runnable test-evidence demo: a small product, tests in
                        every category, signed in-toto results, and the gate
.github/                the demo's evidence workflow
```

The design records (goals, decisions, artifacts and their edges) were kept as a
konspekt instance under `.konspekt/instance/` until commit
[`9217e03`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c), and have since been removed from the tree. Links to them in this
README point at that commit. [`docs/README.md`](docs/README.md) indexes the
publications, and [`docs/build/README.md`](docs/build/README.md) says which files
in that one directory are derived and which are authored.

### Test-evidence demo

[`demo/`](demo/README.md) runs the provider-side test evidence (the chain's L4
record, split by test category) and the bank-side gate check (L8) end to end on a
small product: tests in every category, results in CTRF and SARIF, each category
signed as an in-toto test-result attestation, and a gate that admits or refuses.

## Status

**Design, with a reference implementation scoped and not yet built.**

The architecture, the three lifecycle machines, the data model, the evidence
bundle, the contract schema and the operating model are settled. The reference
implementation is a deliberate walking skeleton — it implements the consumption
half only, on a single synthetic backpatch, with the production side faked by
fixtures. If it starts standing up a patching pipeline, it has lost the plot.

Its acceptance test is one sentence: one offline command turns the conforming
fixture into an admission with a signed verdict; flipping any single fixture to a
known-bad variant yields a refusal naming the rule it failed; and two runs
produce byte-identical verdicts with no network.

Scope and phases:
[`artifact-reference-implementation`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c/.konspekt/instance/artifacts/artifact-reference-implementation.md).

## Known gaps

Named rather than hidden — each was tracked in the design records ([commit `9217e03`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c)):

- **Alliance governance policy.** The trust-root *mechanism* is settled: a
  threshold of parties co-signs the root, and bilateral work runs under a
  delegated namespace. What remains is policy — which organisations sit in that
  threshold, how a verifier is admitted or removed, and the procedure on
  suspected compromise. Not an engineering question, and the largest item open.
- **Operating values.** Seven, each named with the party that settles it — see
  the operating model's section eight. Ballot cadence, seconding threshold and
  the verification service level are the ones that bite first; two of the seven
  deliberately propose nothing, because they encode how much influence a
  contribution buys.
- **Anchor re-derivation.** Confirming the baseline against its public source at
  verify time conflicts with running hermetically offline; currently satisfied
  against a local snapshot.
- **Rebuild-input durability.** Source and toolchain are pinned by digest, but a
  pinned locator can stop resolving years later while every digest still checks
  out — which makes an old package un-rebuildable without invalidating any
  evidence.
- **Class (b) depth.** How far the chain collapses for FINOS-native projects,
  which have no baseline to transform.

## Standards

code_tracer composes existing standards rather than inventing formats: in-toto
attestations and layouts, DSSE envelopes, SLSA provenance, CycloneDX SBOMs, VEX
for exploitability, Sigstore signing, TUF trust roots, Package URL coordinates,
and Rego for policy.

Current register: [`artifact-architecture`](https://github.com/denisurusov/code_tracer/blob/9217e039501b148ad5ca43a093c0ebe59601a92c/.konspekt/instance/artifacts/artifact-architecture.md)
§7. The original working-group survey, kept for its framing, is
[`docs/historical/osera-standards-register.md`](docs/historical/osera-standards-register.md).
