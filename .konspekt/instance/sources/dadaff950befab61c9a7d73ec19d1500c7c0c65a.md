<!-- konspekt source excerpt
     Verbatim transcript of the RI fixture-spec §9 closure (SLSA materials depth,
     japicmp pinning) and the two findings that prompted the conformance pass,
     code_tracer, 2026-07-21. Both sides included. This header is the only
     editorial text; everything below the rule is verbatim as written by each
     party, with omissions within a turn marked […]. No included line is
     paraphrased. -->

---

**User:** commit the file please, then we need to close out the open items from [code_tracer/.konspekt/instance/artifacts/artifact-ri-fixtures-spec.md at main · denisurusov/code_tracer]

**Claude:** "[…] **SLSA materials depth (L3): digest-only, plus the toolchain as a third pinned material.** Rule 6 checks that the hardened artifact was built from L0 source + L2 transformation on the pinned toolchain. Digest references to L0 and L2 satisfy two of those three; a deeper synthetic graph (transitive build deps, plugin versions) would add surface no admission rule reads. So depth buys nothing — but the *toolchain* needs to be a digest-addressed material in its own right, or rule 6's third clause has nothing to check against. **japicmp: keep it, and pin the version.** I expected to argue for genericizing — a named tool the fixture never invokes implies invocation. But that's wrong, and the reason is zero-dissent. If the contract names only a capability, verifier A running japicmp and verifier B running revapi can reach different conclusions on the same artifact, and under zero-dissent a spurious disagreement is disqualifying. Reproducible verification requires the *check* be pinned exactly as the toolchain is. Genericizing would manufacture dissent. The Phase 0 caveat belongs in §8 — the fixture asserts the result without running the tool — rather than in the contract schema. […] **The variant matrix covers 7 of 15 rules.** §7 exercises rules 3, 5', 9, 11, 13 and expiry. Nothing exercises rule 6 (build integrity), 7 (transformation integrity), 8 (corpus digest match), 12 (digest binding), 14 (compile agreement) or 15 (freshness). Given the exit criterion is 'each known-bad variant drives REJECT naming its rule,' the corpus currently can't demonstrate most of the gate. Rule 8 matters most — the corpus-substitution check is the loophole the whole model exists to close, and no variant tests it. **The spec predates roughly half this session's decisions.** No `governance` block in L-1, no `verification.k` framing, no `compilerVersion`, no trust-root snapshot or checkpoint set in the bundle layout, no delivery-manifest / evidence-bundle split, and rules 14–15 didn't exist when it was written."

**User:** rewrite them all. and please push the HTML in.
