# Contract-Bound Evidence

## Admitting externally-patched open source into a regulated estate

*Working draft — 21 July 2026*

---

### Abstract

Regulated institutions run large amounts of old, widely-shared open source they
cannot upgrade on any useful timescale, because the blocking dependency belongs to
someone else. Backpatching — applying a security fix to the version actually in
use — is the available bridge, but a backpatch produced by a third party arrives
with evidence that party produced about its own work, which is not evidence at
all.

This paper describes **contract-bound evidence**: a model in which the
specification is commissioned and countersigned *before* work begins, and every
downstream claim is checked against it by parties who independently re-derived
the result. The receiving institution's question moves from *did the supplier do
good work?* — which it cannot answer — to *did the output conform to a scope the
supplier committed to before starting, independently verified?* — which is
mechanically decidable.

Two ideas do most of the work. The first is the **commissioned specification**,
which closes the loophole that makes supplier-produced test evidence
unfalsifiable. The second is the observation that **verification does not
compress**: unlike proof-of-work, checking a build costs roughly what producing
it cost, so a single checker is both a bottleneck and a single point of trust.
The response is a quorum of independent verifiers in which **disagreement is
disqualifying rather than outvoted**.

### A note on scope

The model is general. It is described here through one instance — OSERA, a FINOS
coalition mutualizing the backpatching of old open source across regulated banks
— because that instance exists, has named participants, and supplies concrete
vocabulary. Nothing in the model depends on OSERA specifically; the same
structure applies wherever an organisation must admit code that someone else
modified on its behalf, including vendor-maintained forks and internal platform
teams patching for downstream business units.

`code_tracer` is the reference implementation and is named where the distinction
between model and implementation matters.

### How to read this

**Part I** is the model and is the part most likely to transfer to other
problems. **Part II** is institutional: commissioning, trust roots, quorum
sizing — written for people deciding how an alliance should operate. **Part III**
is what a receiving institution deploys and stores — written for platform and
open-source programme teams. **Part IV** states the limits.

One worked example runs throughout: a deserialization vulnerability in a
`jackson-databind` version pinned by a framework's bill of materials, present
transitively across hundreds of applications, where the upgrade is blocked by
coupling rather than by effort.

Four figures accompany the text. Figure 1 gives the shape of the system and is
worth reading before Part I; the rest appear where they are relevant.
