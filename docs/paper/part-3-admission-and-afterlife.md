# Contract-Bound Evidence

### Admitting externally-patched open source into a regulated estate

**Part III — Admission and afterlife** *(draft; ~2,400 words)*

> Structure, audience and framing decisions: `artifact-paper-outline`.
> Diagrams: `docs/resource/`.

---

Parts I and II described a model and who operates it. This part is about what a
receiving institution actually runs, what it stores, and what it is still on the
hook for a year later. The short version is that the gate is smaller than people
expect and the afterlife is larger.

---

## 9. The contract compiles to a policy

The L-1 contract is machine-readable for a specific reason: it is **compiled, not
read**. A deterministic transform turns the signed contract into the verification
policy the gate enforces. One authored artifact, two representations.

This matters because the alternative — a human reading a contract and configuring
a gate to match — reintroduces exactly the gap the contract was written to close.
An operator who mistypes a threshold, or who configures last quarter's scope,
produces a gate that passes artifacts the contract would have rejected, and
nothing in the system notices.

**Both sides compile, and the digests must agree.** The issuer compiles the
policy and distributes it. The receiving institution **recompiles it locally from
the same signed contract** and compares digests. A mismatch is a failed
admission.

The temptation is to skip this: the issuer signs the compiled policy, so why not
just verify the signature? Because a signature establishes *authorship*, not
*correctness*. Accepting a signed policy without recompiling inserts a trusted
compiler into a design whose entire premise is that you verify rather than trust.
Recompilation costs milliseconds and removes a component from the trusted set —
one of the better trades in the design. It does impose a real engineering
constraint: the compiler must be **byte-deterministic**, which means no
timestamps, no map iteration order, no environment leakage. The compiler version
travels with the policy so that a version skew surfaces as a digest mismatch
rather than as silent divergence.

### Structure and meaning are different checks

Verification runs in two passes, and the split is not arbitrary.

The **structural** pass asks whether the right steps ran, in the right order,
signed by the right parties, with the graph intact and thresholds met. It is a
graph and signature check. It knows nothing about vulnerabilities.

The **semantic** pass asks whether the evidence *means* what the contract
requires: that the CVEs proven fixed cover the commissioned scope, that the test
corpus matched by digest, that coverage cleared its threshold, that conformance
is `FULL`.

Keeping them separate has a practical payoff. The structural layer is a mature,
general-purpose framework that this design consumes unmodified. The semantic
layer is a policy file — readable, reviewable, diffable, and modifiable by a
security engineer without touching verification machinery. When a bank's risk
function asks *what exactly does the gate check?*, the answer is a file they can
read, not a codebase they have to trust.

For the running example: the structural pass confirms that a rebuild step ran and
was signed by three registered verifiers. The semantic pass confirms that the
deserialization CVE named in the contract has a proof that fails on the baseline
`jackson-databind` and passes on the hardened one, and that the corpus those
results came from is the corpus the contract named.

---

## 10. The perimeter

Because verification is hermetic and offline, the boundary crossing cannot be a
protocol. There is no live call to the alliance at verification time. What
crosses is a **copy of a self-contained, content-addressed set of files** — the
evidence bundle.

This produces the design test the whole interface is built around: **if the gate
needs it, it ships in the bundle.** Anything the gate would have to fetch is a
live dependency, and a live dependency means the decision cannot be replayed
later from stored inputs. Every admission rule must be decidable from bundle
contents alone; a rule that isn't is either a wrong rule or a missing bundle
element.

The bundle carries the artifact reference, the provider's attestations, the
verifiers' summaries, the signed contract, the compiled policy, a snapshot of the
trust root, and the certificate chain. Two properties matter more than the
inventory.

**The bundle is a container, never a credential.** It carries no signature of its
own and confers no authority on its contents. Every element inside is
independently signed and independently verified. This keeps assembly from
becoming a trust role — the party that packages the evidence gains no power over
whether it is believed, which means bundle assembly can happen inside the
receiving institution without anyone having to vouch for the assembler.

**Resolution is online; verification is offline.** Discovering which attestations
belong to an artifact digest requires a lookup, and that lookup happens *before*
the bundle is sealed. Once sealed, nothing else is consulted. The perimeter is
that line, not the institution's firewall. This distinction is what allows a
central discovery index to exist without compromising hermeticity: the index is a
lookup rather than evidence, no admission rule depends on it, and a wrong answer
fails immediately against signed, digest-bound attestations.

**Offline verification forfeits freshness**, which has to be handled explicitly.
A trust-root snapshot pinned into a bundle cannot learn that a verifier key was
revoked yesterday. So the bundle carries stated maximum ages — a longer clock for
the trust root, a much shorter one for transparency-log checkpoints — and
exceeding either is a **named-rule rejection, not a warning**. A warning defers
the decision to whoever is reading the console, which is not a control.
Re-resolution is cheap, because only the trust material needs refreshing; the
artifact and its evidence are unchanged.

### What you actually deploy

This is the part most likely to surprise a platform team, and it is the strongest
adoption argument in the model.

**The gate is a CI job.** It invokes a general-purpose attestation verifier for
the structural pass and a policy engine for the semantic pass. Most regulated
institutions already run both — the policy engine is frequently already deployed
for Kubernetes admission control. The gate is stateless: it reads a bundle and
writes a verdict.

**The storage is unremarkable.** A quarantine repository for arriving packages,
which nothing but the gate may read. A registry for bundles. A directory of trust
material — a trust-root snapshot, certificate roots, checkpoints, the schema and
policy the bundle pinned — refreshed on a schedule under ordinary configuration
management, not a service. An append-only ledger. The existing repository manager
serves as the golden repository, unchanged.

**The one-reader rule on quarantine is a control, not a convenience.** If any
other system can read the quarantine repository, an application team can consume
an unadmitted artifact by pointing at the wrong repository, and every guarantee
in this paper evaporates without a single check failing.

What is genuinely new is short: the contract-to-policy compiler, the semantic
policy itself, the resolver that assembles bundles, the harness that runs the
institution's own acceptance tests as a verification step, and the ledger. That
is a small surface, and none of it is exotic infrastructure.

**The institution's own tests are not optional.** They run *inside* the gate, as
a verification step whose result folds into the admit-or-reject decision rather
than as a separate downstream stage. The reasoning is uncomfortable but sound:
under a warranty-free distribution model, nobody is contractually answerable when
a conforming backpatch nonetheless breaks production. A conforming artifact is
not the same as a compatible one, and compatibility with a particular estate is
the one thing the alliance cannot test on anyone's behalf. This step never leaves
the institution and is never shared.

---

## 11. Bridges expire

Admission is the beginning of the obligation, not the end of it. A backpatch is
deliberately temporary — a bridge to an upstream fix that will eventually be
adoptable. An institution that admits bridges without tracking their expiry has
replaced a known vulnerability with an unmanaged dependency on a third party's
continued goodwill, which is not obviously an improvement.

So the ledger is not a reporting nicety. It is the half of the system the risk
function touches daily, and it answers a question the gate cannot: *what are we
running now, what does it cover, and when does it lapse?*

**The ledger is an append-only, hash-chained event log**, with everything else
computed from it. Events record issuance, renewal, expiry, retirement, and
verifier revocation. Current state is a projection replayed from the chain rather
than a stored row.

The reason is an audit question that a last-write-wins table cannot answer:
*which bridge was in force in March, and exactly which CVEs did it cover?* A
mutable status column knows only the present. An event chain replays to any past
date. Since the entire model exists to make regulatory claims defensible, storing
the operational half in a form that forgets its own history would be a strange
place to economize. The chaining also makes tampering detectable — break one link
and the whole tail is invalid — which is the same discipline the attestation
chain uses, applied to the institution's own records.

One consequence worth stating: **"expiring soon" is computed, never stored.**
Deriving it from the expiry date and a warning window avoids a mutable status
that would need its own writer and its own clock, and therefore its own failure
mode.

### Renewal is a new artifact, not a status change

When a bridge approaches expiry and upstream still isn't adoptable, the response
is a **renewal** — and a renewal is a new package that supersedes the old one,
not a date extension on the existing one.

This is not bookkeeping pedantry. The second bridge has its own commissioned
contract, its own baseline, and very often a *different* CVE set — for a library
with recurring deserialization issues, bridge two typically closes vulnerabilities
that did not exist when bridge one was commissioned. Treating that as "the same
bridge, extended" would erase precisely the information the ledger exists to
retain. The two are linked by an explicit supersession pointer and share a stable
lineage key, so the chain is traversable while each link remains distinct.

### Revocation records an exposure; it does not invalidate

When a verifier's key is revoked, what happens to the artifacts admitted on that
verifier's summaries?

They **stay admitted**. Admission was valid at the time, against a pinned
trust-root version, and the artifacts themselves are unchanged — they still
rebuild to the same digest and still prove the same vulnerabilities fixed. The
event is recorded against every affected lineage, and the console raises a review
trigger for the risk function to judge case by case.

The alternative is worse than it first appears. Automatically invalidating
everything a revoked key touched would let a single trust event pull hundreds of
packages out of production simultaneously — a self-inflicted outage triggered
by key hygiene rather than by any defect in an artifact. This is tolerable
precisely because of the zero-dissent quorum: with a floor of three independent
verifiers and no disagreement permitted, no single verifier was ever the sole
basis for an admission.

**The console writes nothing durable.** It is a read tier over projections and
verdicts. Every state change routes through the gate, which writes a verdict, or
the ledger, which appends an event. This is what keeps the audit trail complete:
there is no path by which someone clicks a button and changes the record.

---

## 12. Which ecosystems this works for

The model is ecosystem-agnostic in principle and constrained in practice, and the
constraint sits in two places that are easy to miss.

**Anchor strength varies.** The first link in the chain is only load-bearing if
the baseline can be re-pulled from a registry nobody in the alliance controls.
Some registries are immutable and permit no unpublishing, so *the artifact at
these coordinates has this digest* is durable. Go goes further, publishing an
independent checksum log that is stronger than anything this design constructs by
hand. But **npm and PyPI permit deletion**, which means a baseline can vanish
after the fact and the anchor check becomes unrepeatable. Those ecosystems need a
supplementary witness recorded at commissioning, so that *this digest was the
published artifact at time T* survives removal.

**Reproducibility gates feasibility.** Independent verification requires that
rebuilds converge bit-for-bit. This is workable in the Java ecosystem, good in Go
and Rust, and materially harder in npm and Python, where builds routinely embed
timestamps, absolute paths, and platform detail. Without reproducibility there is
no digest agreement, therefore no quorum, therefore no admission. Ecosystem
support is a **feasibility question, not a sequencing preference** — an ecosystem
is supportable when its builds can be made reproducible, and not before. Stating
this plainly avoids promising support the verification model cannot deliver.

There is a third constraint, smaller but sharp. The hardened artifact needs a
coordinate that sorts **above** its baseline in the ecosystem's own version
ordering, never collides with a real upstream release, and increases across
renewals. In Maven's version grammar a qualifier suffix satisfies this. Under
PEP 440, a local version identifier does. **Under semver, neither form works**: a
pre-release suffix sorts *below* the base version — so a resolver would treat the
hardened artifact as older than the vulnerable one it replaces — and build
metadata is ignored for precedence entirely. That is an open problem, and it may
constrain which ecosystems are viable regardless of reproducibility.

Adding an ecosystem is therefore a deliberate act with four prerequisites: an
anchor class, reproducible builds, a valid coordinate encoding, and a way to
carry attestations.

---

Part III is the deployable half: a compiled policy, a bundle that crosses once, a
gate built largely from software the institution already runs, and a ledger that
outlives the admission decision by design. Part IV is what the model does not do.

---

> **Drafting note.** Exact CVE identifiers and fixed-in versions are deliberately
> absent and MUST be verified against a live source before publication.
