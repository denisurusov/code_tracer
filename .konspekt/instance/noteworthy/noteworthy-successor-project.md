```yaml
id: noteworthy-successor-project
type: noteworthy
title: Decision — a renewal is a successor project, and nothing is renewed
status: active
review: accepted
summary:
  origin: machine
  pinned: true
  updatedAt: 2026-07-31T00:00:00Z
provenance:
  conversationId: konspekt-operating-model
  timestamp: 2026-07-31T00:00:00Z
createdAt: 2026-07-31T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
```
# Decision: a renewal is a successor project, and nothing is renewed

**Decision.** What the design called a **renewal** is a **successor project**. It
is a fresh commissioning decision in every respect — its own contract, its own
baseline, its own CVE set, its own signatories, its own money — and it runs the
whole demand pipeline from nomination. The only thing carried over is
`contract.osera.line`, and a line is a label rather than a funding decision.

**Why the word had to go.** It implied a continuity the mechanism does not
provide, and the implication was load-bearing rather than cosmetic: it produced a
serious proposal that a renewal could skip the commissioning ballot under a
standing authorisation for its line, on the grounds that the alliance had
"already decided this bridge is worth funding." It has not. It decided that the
*previous* bridge was worth funding, against a different baseline and a different
CVE set, possibly with different members paying. That proposal was an argument
from the noun rather than from the machine.

`docs/lifecycle.md` had already been carrying the contradiction in plain sight —
a section titled Renewal whose first sentence says "a renewal is a new project
against the same line." The sentence undoes the heading, which is a reliable sign
the heading is wrong.

**What genuinely continues, and is unaffected:**

- **`lineKey`** — version-less purl + `osera.line`. Constant across the chain so
  the state pointer and the ledger follow the lineage.
- **The `supersedes` edge** on the package, and the invariant that it must agree
  with the shared line.
- **The exposure history**, which is what lets a bank answer what was in force in
  March.

Those are continuities of **lineage**. What does not continue is the
**commitment**, and the two were being conflated by one word.

**Consequence for the notice window.** Because a successor runs the full
pipeline, the window at E2 must cover a complete commissioning cycle, ballot
included — not the shortened path a standing authorisation would have permitted.
That roughly doubles it, and the derivation is now honest about why
(`noteworthy-service-level-parameters`).

**Binds:** the Renewal sections of `docs/lifecycle.md` and
`artifact-product-lifecycle` §7; the Sunset → Drafted′ transition, which is a
successor rather than a loop; `artifact-operating-model` §4, where E2's
re-entry point is the demand pipeline rather than the commissioning ballot alone.
**Relates:** `noteworthy-lifecycle-nouns`, which retired *candidate* for the same
reason — a noun spanning grains that the machine keeps separate.
