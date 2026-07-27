# Contract-Bound Evidence

### Admitting externally-patched open source into a regulated estate

**Part IV — Limits** *(draft; ~1,000 words)*

> Structure, audience and framing decisions: `artifact-paper-outline`.

---

## 13. What this model does not do

A design paper that lists only its strengths is asking to be believed rather than
checked. This part states the limits plainly. Some are open problems that further
work could close; two are structural, and no amount of engineering will remove
them.

### A faithful build of a malicious change passes every check

This is the sharpest limit, and it follows directly from what reproducibility
proves.

Independent rebuild establishes that the artifact corresponds to the stated
inputs: this source, this transformation, this toolchain, producing exactly these
bytes. Every verifier confirming the same digest confirms that the provider's
described change was applied faithfully and that nothing else was introduced
during the build.

It says nothing about whether the change itself is benign. A provider who inserts a
backdoor *into the declared transformation* produces an artifact that rebuilds
identically for every verifier, passes the vulnerability proofs, passes the test
corpus, and conforms perfectly to the contract. The quorum will agree, correctly,
that this is what the recipe produces.

The model therefore shifts the trust question rather than eliminating it: from
*did the provider test adequately?* — which it answers well — to *is the provider
acting in good faith?* — which it does not address at all. Source review of the
transformation remains a separate control, and the contract's requirement that
the recipe set be content-addressed exists to make that review possible and
repeatable. An alliance that treats independent verification as a substitute for
looking at the patch has misread what the verification proves.

### Verifiers may fail in correlated ways

The quorum assumes independence. In practice, verifiers are likely to run similar
toolchains, similar container images, and a shared rebuild harness distributed by
the alliance — because that is the cheapest way to make verification a low-effort
membership obligation.

A defect in that shared harness is a common-mode failure. Every verifier could
converge on the same wrong answer with no dissent, which is exactly the signal the
design relies on to detect trouble. The mitigation is partial: encourage
diversity in build environments, and treat the harness as security-relevant code
in its own right. But the tension is real, and it runs against the operational
pressure to standardise.

### The quorum verifies conformance, not judgement

Verification confirms that delivery matched the contract. Nobody independently
checks that the contract asked for the right things.

If the commissioned scope omits a CVE that mattered, or names a test corpus too
weak to catch a regression, every downstream check will pass and the artifact
will be admitted. The scope decision sits with the issuer and, in solo mode, with
a single institution. That decision is recorded and attributable — the governance
block makes it checkable after the fact — but it is not verified by anyone before
the work proceeds.

### Open problems

**Version coordinates in semver ecosystems.** The hardened artifact needs a
coordinate sorting above its baseline. Under semver, a pre-release suffix sorts
below the base version and build metadata is ignored for precedence, so neither
available form works. Until this is resolved, npm and cargo cannot be supported
even where reproducibility is achievable.

**Schema compatibility over time.** Signed contracts are frozen permanently and
the ledger must answer questions about them years later, so the gate has to
evaluate every schema version ever issued. Nothing can be deprecated. The
versioning and compatibility rules for that schema are unspecified, and the
problem only becomes visible once both sides ship independently.

**Anchor durability in deletion-permitting registries.** npm and PyPI allow
unpublishing, so a baseline can disappear after commissioning and the anchor
check becomes unrepeatable. The proposed remedy — recording a log witness at
commissioning — is sound but adds a step that must actually be performed, at the
moment when nobody yet has a reason to care.

**Reconciliation of the discovery index.** The central attestation index is
rebuildable from the transparency log, which is what makes omission detectable
rather than silent. Detectable, however, only if someone performs the
reconciliation. Ownership and cadence are unassigned.

**Governance policy.** Who sits in the trust-root threshold, how verifiers are
admitted and removed, and what happens on suspected compromise are undecided.
These are the largest remaining items and they are not engineering questions.

### Two things the model deliberately does not attempt

**It is not a substitute for upgrading.** Every bridge carries an expiry, and the
ledger exists to make expiry impossible to ignore. An institution that renews
indefinitely has built a permanent private fork with extra ceremony, which is a
worse position than the one it started from — the model can make that visible,
but it cannot prevent it.

**It offers no warranty.** A neutral venue distributing hardened open source will
not warrant fitness, and nobody is contractually answerable when a conforming
backpatch breaks production. The contract narrows what has to be accepted on
faith — *as-is, but provably conforming to a scope committed in advance and
independently re-derived* is a much better as-is than *as-is, trust us* — but a
risk function still has to accept it, in writing.

### At formation, nothing works

Until three verifiers are active, no artifact can reach full admission. An
alliance that commissions work before recruiting verifiers will have paid for
artifacts nobody can consume. Verifier recruitment is a launch prerequisite, and
it is easy to mistake for a growth activity because the machinery looks complete
without it.
