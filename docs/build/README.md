# Built and circulated

Two kinds of file live here, and the difference decides whether a rebuild may
overwrite them. Everything in this directory must appear in one of the two tables
below; anything else is unfiled and should not be here.

## Derived outputs — never edited

Each is a projection over a source elsewhere in `docs/`. Change the source and
rebuild (`noteworthy-authoritative-form`). A rebuild overwrites these without
asking.

| Output | Source | Built by |
|---|---|---|
| `contract-bound-evidence.md` | `docs/paper/part-*.md` | `assemble.py` |
| `contract-bound-evidence.html` | the same parts | `assemble.py` |
| `contract-bound-evidence.docx` | the assembled markdown | `mkdocx.js` |
| `contract-bound-evidence.pdf` | the DOCX | `soffice --headless` |
| `fig{1..4}.png` | `docs/resources/*.svg` | `render-figures.py` |
| `explainer.pdf` | `explainer.html`, in this directory | rendered from a browser |

## Authored artifacts — their own source

Self-contained presentation HTML: layout *is* the content, so there is no
markdown behind it and nothing to regenerate it from. These are edited in place
like any other authored file.

| Artifact | Realizes |
|---|---|
| `explainer.html` | the design walkthrough — the model, then one package carried through every state of it |

**No build command writes to these names.** That is the whole of the protection,
and it is worth stating plainly: if a future script ever emits `explainer.html`,
an authored document disappears silently on the next rebuild. Add to the derived
table only what a script actually produces.

They carry no commit stamp, and correctly so. The stamp exists because a derived
file can drift from the source it was made from; an authored file *is* its source,
so git already records exactly when it changed and to what.

## Why any of this is committed

A version that goes to the working group has to be recoverable afterwards. With
an ignored build directory, a circulated PDF exists only in the recipient's
inbox and nobody can answer what it said.

## The stamp rule

Every **derived** output records the commit it was built from — in front matter
for markdown and HTML, in document properties for DOCX and PDF. A reader can then
tell whether the file matches the tree without diffing it, and a build carrying no
stamp is treated as stale.

A build made from a working tree with uncommitted changes is stamped `-dirty`,
because it corresponds to no commit anyone else can retrieve. `assemble.py` prints
the stamp it wrote; commit before building if the output is going anywhere.

This is the same discipline a verdict follows when it pins the evidence core it
was decided against: the output names the input it came from, so the derivation
stays checkable.

## Naming

A rendering takes the name of what it was rendered from — `explainer.pdf` beside
`explainer.html`, not a name describing the viewing mode it was captured in.

## Binaries

DOCX, PDF and PNG are pushed by hand. They cannot be written through the API path
the rest of this repository is maintained over, so they arrive in their own
commit, and the stamp is the only way to tell which source they came from.
