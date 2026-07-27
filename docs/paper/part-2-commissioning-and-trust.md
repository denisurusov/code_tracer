# Contract-Bound Evidence

### Admitting externally-patched open source into a regulated estate

**Part II — Commissioning and trust** *(draft; ~1,650 words)*

> Structure, audience and framing decisions: `artifact-paper-outline`.
> Diagrams: `docs/resource/`.

---

Part I described the model. This part is about the institutional machinery
underneath it: who decides what gets commissioned, what happens when a
commitment is not met, and how the trust root survives the organisations that
hold it. These are governance questions, and they are the ones an alliance has to
settle before any of the engineering matters.

---

## 6. Issuance, and what happens when delivery falls short

The contract has its own lifecycle, separate from the artifact's. It is drafted,
proposed to the provider, accepted when the provider countersigns, delivered, and
finally fulfilled when the quorum confirms conformance. It can also be withdrawn
before acceptance, breached on delivery, or lapse if the delivery window passes
with nothing produced.

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
the same shape as the verification quorum, applied to trust material — the design
uses thresholds wherever a single key would otherwise be load-bearing.

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

The related decision concerns the transparency log. A shared log operated by the
alliance is convenient, but a log operator can in principle present different
views to different parties. Rather than adding a separate witness network, each
verifier records the log state it observed at the time of verification, and those
observations travel with the evidence. Agreement across the quorum makes a split
view detectable, using machinery already present for other reasons.

---

## 8. Verification as a duty, and how large the quorum should be

The unresolved question in early drafts was what motivates an institution to
verify someone else's artifact. The natural answer was to make verification a
credit — count it against membership dues, so institutions that verify pay less.

That answer collapses on contact with bilateral commissioning. If verification
earns credit and an institution can commission alone, the rational strategy is to
commission solo and never verify, which starves the quorum precisely when it is
needed. Worse, the institutions most able to verify are the ones most able to go
it alone.

**So verification is an obligation of membership.** Members verify what the
alliance commissions; the cost is a CI job. This has a useful secondary effect:
the pool of verifiers is the membership, so quorum size scales with the alliance
rather than being separately negotiated.

It also clarifies what the two commissioning modes actually change. In
**team** mode, members vote work in and share the cost and the
responsibility. In **solo** mode, one institution commissions and funds alone and
is solely accountable for that judgement. The mode determines who answers for
*deciding to commission this work at all*. It has no effect on how strictly the
result is verified, and none on what the gate requires.

### Choosing k

The threshold is expressed both absolutely and proportionally: a floor of three,
rising with the size of the active membership.

The floor exists because two verifiers cannot produce a usable signal — when two
parties disagree there is no way to tell which is wrong without a third. The
proportional term exists so the guarantee does not silently weaken as the
alliance grows; a fixed three-of-forty is a much weaker statement than
three-of-five, and expressing only a fixed number lets that erosion happen
without anyone deciding it should.

**The threshold in force is frozen into the contract at issuance.** An artifact
is judged against the quorum that applied when it was commissioned, rather than
one that drifted during the work. Without this, a membership change mid-delivery
would silently move the target.

One consequence has to be stated because it affects formation planning: until
three verifiers are active, nothing can be admitted at all. Verifier recruitment
is a launch prerequisite. An alliance that signs a provider before it has three
verifying members will have commissioned work that cannot be consumed.

---

Part II settles the institutional questions: a commitment that freezes on
countersignature, a shortfall that surfaces as an amended contract, a trust root
that survives its holders, and a quorum drawn from membership with a threshold
that cannot quietly erode. Part III is what a receiving institution deploys.
