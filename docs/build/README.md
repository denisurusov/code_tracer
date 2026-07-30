# Built outputs

Derived files. Each one is a projection over a source elsewhere in `docs/`, and
none of them is ever edited: change the source and rebuild
(`noteworthy-authoritative-form`).

## Why these are committed

A version that goes to the working group has to be recoverable afterwards. With
an ignored build directory, a circulated PDF exists only in the recipient's
inbox and nobody can answer what it said.

## The stamp rule

Every built output records the commit it was built from — in front matter for
markdown and HTML, in document properties for DOCX and PDF. A reader can then
tell whether the file matches the tree without diffing it, and a build carrying
no stamp is treated as stale.

This is the same discipline a verdict follows when it pins the evidence core it
was decided against: the output names the input it came from, so the derivation
stays checkable.

## What lands here

| Output | Source | Built by |
|---|---|---|
| `contract-bound-evidence.md` | `docs/paper/part-*.md` | `assemble.py` |
| `contract-bound-evidence.html` | the same parts | `assemble.py` |
| `contract-bound-evidence.docx` | the assembled markdown | `mkdocx.js` |
| `contract-bound-evidence.pdf` | the DOCX | `soffice --headless` |
| `fig{1..4}.png` | `docs/resources/*.svg` | `render-figures.py` |

Renderings of the authored HTML explainers belong here too, under the name of the
file they were rendered from.

## Binaries

DOCX, PDF and PNG are pushed by hand. They cannot be written through the API path
the rest of this repository is maintained over, so they arrive in their own
commit, and the stamp is the only way to tell which source they came from.
