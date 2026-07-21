# Contract-Bound Evidence

### Admitting externally-patched open source into a regulated estate

**Part I — The model** *(draft; ~2,300 words)*

> Structure, audience and framing decisions: `artifact-paper-outline`.
> Diagrams: `docs/resource/`.

---

## A note on scope

This paper describes a general model. It describes it through one instance —
OSERA, a FINOS coalition that mutualizes the backpatching of old open source
across regulated banks — because that instance exists, has named participants,
and supplies concrete vocabulary. Nothing in the model depends on OSERA
specifically. The same structure applies wherever an organization must admit code
that someone else modified on its behalf: a vendor-maintained fork, an internal
platform team patching for a downstream business unit, a consortium sharing
remediation cost.

We return to what generalizes, and what does not, in Part IV. The reference
implementation is a system called `code_tracer`.

---

## 1. The bind

Start with the situation as it actually presents, rather than as a policy
document imagines it.

A bank runs several hundred applications. Somewhere in their dependency trees —
typically three or four levels down, arriving transitively through a framework's
bill of materials — sits a version of `jackson-databind`. No team chose it. No
team can tell you why that version rather than another. It is there because the
framework's dependency management put it there, and it has been there for years.

A deserialization vulnerability is published against it.

The remediation is obvious and unavailable. The fix exists upstream, in a later
release. Adopting that release means moving the framework BOM that pins it, which
means a coordinated upgrade across a release train no single application team
controls, scheduled against a change calendar that has other commitments. The
honest estimate is quarters, not weeks. Meanwhile the scanner fires on every
application in the estate, and the risk function has an exposure it cannot close
and cannot explain away.

This is the bind, and it is worth being precise about its shape:

- **The exposure is broad**, because the library is shared.
- **The upgrade is blocked by coupling, not by effort.** This distinction matters.
  A blocked-by-effort problem is a resourcing conversation. A blocked-by-coupling
  problem cannot be solved by the party that has the problem.
- **The window is long**, and it is measured in the calendar of whoever owns the
  blocking dependency.

The available response is a **backpatch**: take the version the estate actually
runs, apply the security fix to it, ship a hardened build under a distinct
coordinate. This is not a new technique. What it lacks, when done ad hoc, is any
basis on which a regulated institution can admit the result.

Three properties make a backpatch bearable rather than reckless. First, it is
**deliberately temporary** — a bridge to an upstream fix that will eventually be
adoptable, carrying a sunset date, because a privately-maintained fork is itself a
standing liability. Second, it is **narrow**: fix only, no features, no drift, and
provable API/ABI stability, because the whole value is that it drops into a
running estate without a code change. Third, and the subject of this paper, it
must arrive with **evidence a machine can check**.

Backpatching is also expensive and, done per-institution, absurdly duplicative:
every bank in the sector fixing the same library in parallel, each producing
evidence only it trusts. Mutualizing the work across an alliance is the obvious
efficiency. It is also what creates the problem the rest of this paper solves.
The moment the patch is produced by someone else, the receiving institution's
question changes from *did we do this correctly?* to *why should we believe
they did?*

---

## 2. Why maker-produced evidence is not evidence

The natural response is to ask the maker for proof. Publish the SBOM, the test
results, the vulnerability analysis, the build provenance — sign all of it, attach
it to the artifact, let the consumer verify the signatures.

This is better than nothing and it is not sufficient, for a reason that has
nothing to do with anyone's honesty.

**The party producing the evidence is the party being evaluated.** The maker
selects what to test, runs the tests, interprets the results, and signs the
report. Every artifact in that chain is authentic — correctly signed, untampered,
verifiable. And the chain establishes only that the maker said these things, not
that they are true.

The sharpest form of the problem is the test corpus. Consider the claim *all
tests passed*. If the corpus was chosen after the patch was written — after
someone could observe which tests the patch happens to pass — then the claim is
unfalsifiable. It is not a lie. It is a statement with no fixed referent, and it
will survive any amount of cryptographic verification, because signatures attest
to authorship rather than to adequacy.

The same structure recurs at every level. *These CVEs are fixed* — as assessed by
whom, against what scope? *No regressions* — against which baseline? *Coverage
meets threshold* — measured over which code, chosen when?

Signing solves tampering. It does not solve self-assessment. Any design that
treats a signed maker claim as evidence has simply relocated the trust
relationship into a cryptographic envelope and declared the problem handled.

Two moves fix this, and the rest of Part I is those two moves.

---

## 3. Commissioned specification

The first move: **fix the specification before the work starts, and have the maker
countersign it.**

The alliance issues a contract. It names, by content digest rather than by
version string:

- the **baseline** — the exact upstream artifact to start from;
- the **scope** — which CVEs must be fixed, and, explicitly, which present-but-
  unfixed CVEs are *out* of scope;
- the **test corpus** — named by digest, so it cannot be substituted;
- the **thresholds** — API/ABI stability required, patched-path coverage minimum;
- the **schedule** — delivery window, and the sunset date of the resulting bridge.

The maker countersigns before beginning. From that moment the deliverable is a
**commissioned specification** rather than a post-hoc submission, and the corpus
loophole closes: *all required tests passed* now has a fixed referent that was
frozen before anyone could see which tests would be convenient.

This is a small mechanical change with a large epistemic consequence. The
question the receiving institution asks moves from *did the maker do good work?* —
a judgement it is not positioned to make — to *did the output conform to a scope
the maker committed to before starting?* The second question has a mechanical
answer.

Everything downstream is checked **against** this contract rather than for
internal consistency. It is not a document that sits beside the evidence; it is
the referent every piece of evidence points back to. We call it **L-1**, the layer
beneath the chain, because the chain is verified relative to it.

Two properties of the contract matter later. It is **frozen at countersignature** —
any change is a new version with a new digest and a fresh signature, carrying an
explicit supersession pointer, so the audit trail records what changed and when.
And it is **machine-readable by construction**, because it will be compiled, not
read: a deterministic transform emits the verification policy that the receiving
institution's gate enforces. One authored artifact, two representations, the same
digest lineage. No human reads a PDF and forms an opinion.

---

## 4. The chain and the anchor

Above L-1 sits the evidence chain proper. In the OSERA instance it has ten levels
— baseline, vulnerability assessment, transformation, build provenance, test
results, vulnerability proof, SBOM and diff, VEX, verification summary,
acceptance — but the level count is not the interesting part, and a reader who
memorizes it has learned the least transportable thing in this paper.

Three principles do the work.

**Everything is digest-bound.** No attestation refers to a version string.
Subjects are content digests plus a package URL. Version strings are metadata;
they are labels for humans and dependency resolvers, never identity. This is what
makes the graph checkable rather than merely readable.

**Every link names both artifacts.** Each attestation carries both the baseline
digest and the hardened digest. A claim that names only one is unverifiable — you
cannot check *this fixes that* against a statement that mentions only *this* — and
must be rejected outright rather than accepted with reservations.

**The chain is a directed graph, not a list.** Each attestation references its
inputs by digest, so the graph is traversable from the deployed artifact back to
the upstream commit, and the traversal is enforced rather than documented.

Then there is the property everything else rests on, and it is the one most
likely to be quietly wrong.

**The anchor must be independently observable.** The first link — *this is the
upstream artifact and source commit we started from* — is a self-claim. If the
maker merely asserts it, the entire structure is a self-claim with nine extra
steps and considerably better production values. It is load-bearing only if it
can be **re-derived from public data by a party with no relationship to the
maker**: the baseline digest must match the artifact publicly retrievable from
the ecosystem's own registry at the stated coordinates, and the source reference
must be a real commit in the public upstream repository. The verifier re-pulls and
compares. No trust is required, and none is extended.

For our example this holds strongly. `jackson-databind` lives in Maven Central,
which is immutable and permits no unpublishing, so *the artifact at these
coordinates has this digest* is a durable, independently checkable fact. Not every
ecosystem gives this for free, and Part IV returns to what changes when it does
not — the strength of the anchor turns out to determine which ecosystems this
model can support at all.

---

## 5. Verification does not compress

The second move is the one with the widest application beyond this domain, and it
begins with an analogy that fails instructively.

The situation resembles a problem distributed systems has thought about
carefully: parties who cannot fully trust each other need to agree on a fact.
Something transplants from that literature, and something crucial does not.

**What transplants:** *verify, don't trust*, and the observation that
deterministic processes let any party re-derive an answer independently. If a
build is reproducible — bit-for-bit identical given identical inputs — then any
party with the inputs can rebuild and compare digests, and agreement is a matter
of arithmetic rather than authority.

**What does not transplant:** consensus machinery. There is no double-spend
problem here, no scarce resource being allocated, and the alliance is a
legitimately trusted neutral venue rather than an adversarial anonymous network. A
consensus protocol would solve a problem this domain does not have while adding
latency a release SLA cannot absorb. Hash-linked, append-only, tamper-evident
logs: yes, unreservedly. Distributed consensus, canonical-chain agreement,
tokens: no, and the distinction is worth stating plainly because the vocabulary
invites conflation.

Now the failure of the analogy, which is where the design turns.

In proof-of-work, the asymmetry is the entire point: work is expensive to produce
and **cheap to verify**. Anyone can check a hash in microseconds. That asymmetry
is what lets a network converge cheaply.

**Here there is no asymmetry. Verification does not compress.** Reproducing a
build and re-running a test suite costs approximately what producing it cost. A
verifier is not a cheap checker; it is a second maker doing the same work and
comparing notes.

Two consequences follow, and they point in the same direction.

First, a single verifier is a **throughput bottleneck** — it must do the full work
of production for every artifact in the pipeline.

Second, and more seriously, a single verifier is a **single point of trust**.
Separating maker from checker hardens the design against maker compromise and does
exactly nothing about checker compromise. Compromise one verifier's signing keys
or build infrastructure and the entire model collapses in one move — with the
receiving institutions seeing a perfectly valid signature over a perfectly false
claim.

**The fix is a quorum, not a chain.** Because reproducible builds are
deterministic, independent verifiers converge on the same digest **without
coordinating**. There is no protocol between them, no messages, no leader. The
correct answer is a natural focal point — the one result every honest party
independently arrives at — and agreement is an artifact of determinism rather than
of negotiation. Each verifier publishes its own signed verification summary.
Admission requires *k* of them.

The most important design decision in this paper is what happens when they
disagree.

**Dissent is disqualifying, not outvoted.** If five institutions rebuild and four
agree while one produces a different digest, the honest reading is *not* four
against one. It is that something is wrong — either the toolchain specification is
underdetermined and the build is not as reproducible as claimed, or something
considerably worse — and either way the receiving institutions need to know
loudly, before promotion. So the rule is *k*-of-*n* **with zero dissent**, never a
simple majority. A dissenting verification summary triggers investigation, not
arithmetic.

This inverts the usual instinct. Majority voting is designed to *tolerate*
disagreement and produce an answer anyway. Here, disagreement is the most valuable
signal the system can generate, and a design that averages it away has discarded
its own best alarm. It is also a signal **no single-checker design can produce at
all** — with one verifier there is nothing to disagree with — and that, more than
throughput or redundancy, is the strongest argument for the quorum.

Two practical notes. The threshold should be expressed both absolutely and
proportionally — a floor of three, rising with membership — so it cannot silently
weaken as the alliance grows. And *k* must be **frozen into the contract at
issuance**, so an artifact is judged against the quorum that applied when it was
commissioned rather than one that drifted afterwards.

---

Part I establishes the model: commission the specification before the work,
anchor it in publicly observable fact, and require independent reproduction with
zero dissent. Part II turns to who commissions, who verifies, and how the trust
root survives the parties that hold it. Part III is what a receiving institution
actually deploys.

---

> **Drafting note.** Exact CVE identifiers and fixed-in versions are deliberately
> absent and MUST be verified against a live source before publication.
