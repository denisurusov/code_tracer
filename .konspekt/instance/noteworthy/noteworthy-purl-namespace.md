```yaml
id: noteworthy-purl-namespace
type: noteworthy
title: Decision — purl namespace for backpatched artifacts
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-architecture-draft
  sourceRef: ce42f850ccfc660dde5fce05f46db479f0993fe0
  contentHash: ce42f850ccfc660dde5fce05f46db479f0993fe0
  timestamp: 2026-07-17T18:45:00Z
createdAt: 2026-07-17T18:45:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: purl namespace for backpatched artifacts

**Decision (Option B).** A backpatched artifact carries a **distinct
version-suffixed purl** — `pkg:maven/…@<upstream>-osera.N`, where `N` is the
**succession count** (`3.2.1-osera.1`, `3.2.1-osera.2`, …). The `sha256` digest
remains the identity (chain principle #1); the purl is the legible label. The
hardening relationship is declared explicitly: L2 names `baseline → hardened`,
and L6/L7 (SBOM/VEX) assert the is-hardening-of link and the fixed CVEs.

Rejected **Option A** (same coordinate as upstream, distinguished only by
digest): although equally safe under digest-keyed verification, it produces a
label that lies — two artifacts sharing a coordinate but differing in bytes,
which every coordinate-keyed scanner, SBOM diff, and dependency resolver
conflates.

**Why B.**
- The supersedes chain (`artifact-product-lifecycle` §7) becomes self-describing:
  successive bridges read as `-osera.1`, `-osera.2`, not identical purls separable
  only by digest — the audit story that section exists to make easy.
- It survives the bank boundary into repository managers and app manifests, where
  a distinct coordinate is pinnable and visible; a same-coordinate/different-
  digest artifact is a footgun for ordinary tooling that doesn't key on digests.
- The CPE mismatch (architecture §7 trap) is turned into an explicit,
  machine-readable is-hardening-of relationship (declared in L6/L7) rather than
  hidden — B declares and annotates the relationship; A conceals it.

---

## Amendment 2026-07-21 — the suffix scheme is per-ecosystem

**The principle stands; the encoding was over-fitted to Maven.** `-osera.N` was
chosen against Maven's version grammar. Under **semver**, `3.2.1-osera.1` is a
**pre-release identifier and sorts *below* `3.2.1`** — so npm, cargo and every
semver-based resolver would treat the hardened artifact as older than the
vulnerable release it replaces. That is exactly the footgun this decision exists
to prevent, reintroduced through ecosystem assumptions
(`noteworthy-ecosystem-generalization`).

**The invariant, which is what actually matters:**

> The hardened coordinate MUST sort **above** its baseline in the ecosystem's own
> version ordering, MUST NOT collide with any upstream release, and MUST remain
> monotonic across successive bridges in a line (`N` increasing).

**Per-ecosystem encodings satisfying it:**

| Ecosystem | Encoding | Why |
|---|---|---|
| Maven | `3.2.1-osera.N` | Maven's grammar sorts the qualifier above the bare version |
| Python (PEP 440) | `3.2.1+osera.N` | local version identifier; sorts **above** the base version |
| semver (npm, cargo) | **not** `-osera.N` — requires a scheme that sorts above `3.2.1` | pre-release sorts below; build metadata (`+`) is ignored for precedence, so neither naive form works. Encoding to be fixed at ecosystem onboarding |
| Go | module path or `+incompatible`-style handling | version semantics differ again; resolve at onboarding |

Note the irony: `+osera.N` — the build-metadata form this decision originally
**rejected** as pushing build-metadata semantics onto Maven's grammar — is the
*correct* form under PEP 440. The rejection was right for Maven and wrong as a
general rule.

**semver is genuinely unresolved.** Pre-release sorts below; build metadata is
ignored for precedence entirely. Neither `-osera.N` nor `+osera.N` satisfies the
invariant, so a semver ecosystem needs either a patch-level bump plus a
qualifier, or a distinct package name. Deferred to ecosystem onboarding
(`noteworthy-ecosystem-generalization` §3), and flagged as a real obstacle rather
than a formatting detail.

**Unchanged by this amendment:** digest remains identity; the purl remains a
label; the is-hardening-of relationship remains declared in L2/L6/L7.

---

## Amendment 2026-07-26 — record name

The record this decision binds is now `package-version`
(`noteworthy-lifecycle-nouns`); the field it fixes is unchanged.

---

## Amendment 2026-07-31 — `N` counts successions, and the suffix does not change

`N` was described as a **renewal count**. Nothing is renewed
(`noteworthy-successor-project`): each increment marks a **successor project**
with its own contract, baseline, scope, signatories and funding, continuing the
same `osera.line`. So `N` is a **succession count**.

**The literal `-osera.N` is deliberately untouched.** It is a coordinate carrying
ordering, non-collision and monotonicity requirements, embedded in repository
managers, app manifests and every purl in the design. Renaming it would break all
of that to correct a word that does not appear in it — the suffix says `osera`,
not `renewal`. The vocabulary sweep stops at the boundary where a name is a
label and starts being an interface.

**Binds:** `artifact-data-model` `package-version.purl` (§4). **Resolves:** the
purl question in `artifact-architecture` §7.
