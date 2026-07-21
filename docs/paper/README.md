# The paper

**Contract-Bound Evidence — admitting externally-patched open source into a
regulated estate.** Working draft, ~7,900 words, four figures.

## Layout

| File | Contents |
|---|---|
| `00-front-matter.md` | abstract, scope note, how to read |
| `part-1-the-model.md` | the bind · why maker evidence isn't evidence · commissioned specification · the anchor · verification does not compress |
| `part-2-commissioning-and-trust.md` | issuance and amendment · trust root · quorum sizing |
| `part-3-admission-and-afterlife.md` | compile · perimeter · what you actually deploy · the ledger · ecosystems |
| `part-4-limits.md` | what the model does not do |
| `99-closing-and-appendices.md` | closing, figures, ruleset summary, status |
| `assemble.py` | builds the single-file paper |

## Building

```sh
pip install markdown
python3 docs/paper/assemble.py
```

Writes `build/contract-bound-evidence.md` and `build/contract-bound-evidence.html`.
The HTML inlines all four figures from `docs/resource/`, so it is a single file
with no external dependencies — that is the version to circulate.

**The built files are a projection over the parts** and are not committed. Edit
the numbered parts and rebuild; never edit the built output
(`noteworthy-authoritative-form`).

## Before publication

- CVE identifiers and version numbers in the worked example are deliberately
  absent and must be verified against a live source.
- Part III's claim that most institutions already run a policy engine is
  load-bearing for the adoption argument and should be checked.
- Where this paper and the records under `.konspekt/instance/` disagree, the
  records are authoritative.
