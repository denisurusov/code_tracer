# Contract-Bound Evidence

### Admitting externally-patched open source into a regulated estate

**Part II — Commissioning and trust** *(draft; ~1,750 words)*

> Structure, audience and framing decisions: `artifact-paper-outline`.
> Diagrams: `docs/resources/`.

---

Part I described the model. This part is about the institutional machinery
underneath it: who decides what gets commissioned, who checks the result, what
happens when a commitment is not met, and how the trust root survives the
organisations that hold it. These are governance questions, and they are the ones
an alliance has to settle before any of the engineering matters.

---

## 6. Issuance, and what happens when delivery falls short

The contract has its own lifecycle, separate from the artifact's. It is drafted,
proposed to the provider, accepted when the provider countersigns, delivered, and
finally fulfilled when the verifiers confirm conformance. It can also be
withdrawn before acceptance, breached on delivery, or lapse if the delivery
window passes with nothing produced.

**Acceptance is the hinge.** Before it, the draft is mutable and internal to the
issuer. From it, scope, baseline, corpus and thresholds are frozen and signed,
and the artifact lifecycle begins. Everything Part I claims about commissioned
specification rests on that one transition being clean.

The hand-off at delivery deserves a note, because it closes a loophole one layer
out from the corpus problem. The provider assembles a **delivery manifest** — the
contract plus its own attestations — and its digest is written to a transparency
log. This establishes that this exact set existed at this time, and it stops the
provider adjusting the submission after seeing how verification went. Deliberately,
the freeze is a log entry rather than a signature: an inclusion proof cannot be
misread as anyone's endorsement of the contents.

### Conformance is binary

Verification reports conformance as full, partial, or breach. Only **full**
admits. Partial and breach never promote, under any circumstance.

This looks harsh, and working groups reliably propose softening it: surely a
backpatch that fixes four of five commissioned CVEs is better than nothing, and
surely the receiving institution should be allowed to weigh that for itself.

The argument against is that a discretionary middle state destroys the property
the contract was created to establish. Once *partial* can promote, someone has to
decide which partials are acceptable — and that decision is exactly the
unstructured judgement the commissioned specification removed. It also puts the
decision in the wrong place: the receiving institution's gate would be
adjudicating whether the alliance's commissioning was met, artifact by artifact.
And the contract is on a trajectory toward executable terms, where a
discretionary state has no representation at all.

**An honest shortfall routes through amendment.** If a fifth CVE proves
unfixable, the contract is amended: that CVE moves to the explicitly-out-of-scope
list with a stated reason, the provider countersigns the new version, and delivery
is then *full* against a contract that tells the truth. The residual exposure is
recorded in a signed document that the receiving institution can read, rather
than buried inside a softened verdict.

This is the better outcome for the same reason double-entry bookkeeping beats a
fudge: the shortfall becomes visible and attributable instead of absorbed. The
cost is process friction — an amendment cycle takes days that a verdict override
would take minutes — and that friction is the mechanism working.

Amendments are versions of the same commitment, carrying an explicit supersession
pointer, so the record shows what changed and when. This is distinct from
renewal, which produces a *new* commitment in the same lineage when a bridge
expires. Collapsing the two would lose the distinction between "we changed what
we asked for" and "we asked again, later."

---

## 7. A trust root that outlives its holders

Everything in the model reduces to a question of key management: which signatures
does the receiving institution's gate accept, and who decides?

The naive answer is that the alliance holds the root key. This fails on
continuity. Alliances form, merge, restructure and dissolve. If the root sits
with a single organisation, then every artifact ever admitted becomes
unverifiable the moment that organisation ceases to exist — not because anything
was wrong with the artifacts, but because the trust material can no longer be
re-signed. Root metadata carries an expiry, so this is a scheduled failure rather
than a hypothetical one.

**So the root is co-signed by a threshold of parties spanning the alliance and
its member institutions.** Re-signing requires k of m, so it survives any single
party disappearing, and no single compromised key can rotate the root. This is
the same shape as verification, applied to trust material — the design uses
thresholds wherever a single key would otherwise be load-bearing.

### Bilateral work needs a delegated namespace

Not all work is commissioned collectively. An institution may contract a provider
directly, for a library only it cares about. That work should not be signed under
the alliance's root, because the alliance did not commission it and cannot stand
behind the judgement.

The established mechanism handles this: **delegation**. The root delegates a
namespace to a named institution, which signs its own bilateral work. The
delegation is visible in the trust metadata, so a receiving institution can see
which path an artifact arrived by. Importantly, a delegate cannot sign a new
root, which keeps the blast radius of a compromised delegation contained.

### No weaker tier

The tempting design here is a tiered one: artifacts over the alliance root get
full trust, delegated artifacts get a reduced check or an extra approval step.

That would be a mistake, and the reason is worth stating plainly. The admission
rules verify properties of the artifact and its evidence: that the baseline
anchors publicly, that the proofs hold, that independent parties re-derived the
result. None of those properties depend on who commissioned the work. A tier
system would therefore either apply a check that adds nothing, or relax one that
mattered — and relaxing it would mean the strict version was never necessary.

The trust path is recorded on the verdict for **attribution**. It tells you who
stood behind the commissioning judgement, which is genuinely useful when
something goes wrong. It does not alter what the gate requires.

One honest qualification, developed in §8: the *rules* are identical across
paths, and so is the work the receiving institution does. What varies is how many
independent reproductions accompanied the artifact before it arrived.

The related decision concerns the transparency log. A shared log operated by the
alliance is convenient, but a log operator can in principle present different
views to different parties. Rather than adding a separate witness network, each
verifier records the log state it observed at the time of verification, and those
observations travel with the evidence. Agreement across the verifiers makes a
split view detectable, using machinery already present for other reasons.

---

## 8. Who verifies, and how many

The unresolved question in early drafts was what motivates an institution to
verify someone else's artifact. The first answer was to make verification a
credit — count it against membership dues, so institutions that verify pay less.

That answer collapses on contact with bilateral commissioning. If verification
earns credit and an institution can commission alone, the rational strategy is to
commission solo and never verify, which starves the verifier pool precisely when
it is needed. Worse, the institutions most able to verify are the ones most able
to go it alone.

The second answer was to make verification an obligation of membership: members
verify what the alliance commissions, and the cost is a CI job. That works, and
it has an awkward edge — it conscripts institutions into checking projects they
neither asked for nor consume, and it leaves unanswered which member checks which
project.

**The answer the model settles on is that verification follows the money.** The
institutions that sign and fund a contract are the institutions that verify it.
All of them verify, all must agree, and a collectively-commissioned project needs
at least two signatories to exist at all.

The argument is that financial exposure is a firmer binding than an obligation.
A signatory has already accepted the cost, and it will run the result in its own
estate, so it carries the consequence of a bad patch twice over. It also disposes
of the assignment problem: there is no rule needed for who checks what, because
the contract already names them, and no project can stall waiting for a volunteer.

The cost is a sunk-cost pull in the other direction — a funder that needs the
package in production has some motive to see it pass. What holds the line is that
the comparison is digest equality, with nothing to interpret or soften.

### How many is enough

Earlier drafts set a floor of three, justified on the grounds that two verifiers
disagreeing give no way to tell which is wrong without a third.

That justification does not survive inspection, because **nothing in this design
arbitrates**. Disagreement is disqualifying rather than resolvable: two agree and
the package admits, two disagree and it stops, and five would behave the same
way. The third verifier was never going to break a tie, because there are no ties
to break.

What two rather than three does cost is compromise resistance — one bad signer is
half the outside evidence rather than a third of it. That is accepted, and the
reason it is acceptable is the next section.

### The receiving institution verifies too

The strongest reproduction in the model is the one nobody commissioned.

**Every adopting institution rebuilds the package itself**, from source and
toolchain references pinned by digest in the evidence, and signs its own
verification summary. This happens while it is still online, during resolution,
before the evidence is sealed for offline verification — so the gate still decides
from a sealed bundle and the decision is still replayable.

This is what makes a solo-commissioned artifact consumable without a weaker tier.
A solo project has one signatory and therefore one reproduction before the
perimeter; the maker and the checker are separated *at the point where the
decision is made* by the institution taking the risk. And it is why a revoked
verifier key does not unravel past admissions: whatever happened outside, the
receiving institution had rebuilt the package for itself.

The honest cost is that verification does not compress for consumers either.
Each adopting institution pays roughly production cost per package. Sampling
would reduce it and would make the work differ by commissioning mode, which is
the distinction this design refuses to draw.

**The threshold in force is frozen into the contract at issuance**, along with
the signatory set. An artifact is judged against the parties who committed to it
when it was commissioned, rather than against a set that drifted during the work.

One consequence has to be stated because it affects formation planning: a
collectively-commissioned project cannot begin until a second institution will
co-fund it. Co-funding is therefore a launch prerequisite, and an alliance that
signs a provider before it has members willing to pair up will have commissioned
work under contracts that cannot reach fulfilment.

---

Part II settles the institutional questions: a commitment that freezes on
countersignature, a shortfall that surfaces as an amended contract, a trust root
that survives its holders, and verification bound to the parties that pay for the
work and then rebuilt again by whoever adopts it. Part III is what a receiving
institution deploys.
