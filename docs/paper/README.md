# The paper

**Contract-Bound Evidence — admitting externally-patched open source into a
regulated estate.** Working draft, ~7,900 words, four figures, 27 pages in print.

## Layout

| File | Contents |
|---|---|
| `00-front-matter.md` | abstract, scope note, how to read |
| `part-1-the-model.md` | the bind · why provider evidence isn't evidence · commissioned specification · the anchor · verification does not compress |
| `part-2-commissioning-and-trust.md` | issuance and amendment · trust root · who verifies |
| `part-3-admission-and-afterlife.md` | compile · perimeter · what you actually deploy · the ledger · ecosystems |
| `part-4-limits.md` | what the model does not do |
| `99-closing-and-appendices.md` | closing, figures, ruleset summary, status |
| `assemble.py` | single-file markdown + self-contained HTML |
| `render-figures.py` | SVG → PNG for the Word/PDF build |
| `mkdocx.js` | markdown → Word, with landscape figure pages |

## Building

Run from the repository root. On Windows, `python3` is usually just `python`, and
`soffice` needs LibreOffice on `PATH`.

```sh
pip install markdown cairosvg
python3 docs/paper/assemble.py          # docs/build/contract-bound-evidence.{md,html}
python3 docs/paper/render-figures.py    # docs/build/fig{1..4}.png
node docs/paper/mkdocx.js               # docs/build/contract-bound-evidence.docx
soffice --headless --convert-to pdf --outdir docs/build docs/build/contract-bound-evidence.docx
```

Four outputs, three of them for circulation:

| Format | Use |
|---|---|
| **HTML** | best for reading. One file, figures inlined, no dependencies |
| **PDF** | best for printing and for anyone who wants page numbers to cite |
| **DOCX** | best for anyone who needs to edit or restyle. Nothing is flattened except the figures |
| markdown | for diffing and inline comment |

**The built files are a projection over the parts.** Edit the numbered parts and
rebuild; never edit the built output (`noteworthy-authoritative-form`). Binary
builds are committed by hand when a version is circulated, since they cannot be
written through the API path the rest of this repo is maintained over.

### The commit stamp

Every output records the commit it was built from — an HTML comment at the top of
the markdown, a `source-commit` meta tag and a footer line in the HTML, and the
document description in the DOCX and the PDF derived from it. A reader can then
tell whether a built file matches the sources without diffing it.

A build made with uncommitted changes is stamped `-dirty`, because it corresponds
to no commit anyone else can retrieve. Commit first, then build, if the output is
going anywhere.

## Layout notes

The body is portrait US Letter; **each figure gets its own landscape page**. The
diagrams run about 1.5:1 with 9–12px labels and are illegible scaled into a
portrait column — that was established by rendering and looking, not assumed. Even
on a landscape page they sit near the limit of print legibility, so the HTML
remains the better artifact for close reading. Figure 2 is the densest.

If a figure changes, render it and look at the result before circulating. A text
edit inside an SVG shifts label widths, and an overflowing label is invisible in
the markup and obvious on the page.

## Before publication

- CVE identifiers and version numbers in the worked example are deliberately
  absent and must be verified against a live source.
- Part III's claim that most institutions already run a policy engine is
  load-bearing for the adoption argument and should be checked.
- Where this paper and the records under `.konspekt/instance/` disagree, the
  records are authoritative.
