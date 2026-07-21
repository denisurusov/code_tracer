#!/usr/bin/env python3
"""Assemble the paper parts into one document, and render a self-contained HTML.

    python3 docs/paper/assemble.py            # writes build/contract-bound-evidence.{md,html}

The single-file paper is a PROJECTION over the numbered parts in this directory
(noteworthy-authoritative-form). Edit the parts; never edit the built file.
Figures are inlined into the HTML so the result is one shareable file with no
external dependencies.

Requires: markdown  (pip install markdown)
"""
import re
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
RESOURCE = HERE.parent / "resource"
BUILD = HERE.parent.parent / "build"

PARTS = [
    ("00-front-matter.md", None, False),
    ("part-1-the-model.md", "Part I — The model", True),
    ("part-2-commissioning-and-trust.md", "Part II — Commissioning and trust", True),
    ("part-3-admission-and-afterlife.md", "Part III — Admission and afterlife", True),
    ("part-4-limits.md", "Part IV — Limits", True),
    ("99-closing-and-appendices.md", None, True),
]

FIGURES = {
    1: ("p1-lifecycle.svg", "Lifecycle and zones"),
    2: ("p2-datamodel.svg", "Data model: which attribute binds to which"),
    3: ("p3-architecture.svg", "Architecture: components and the stores they touch"),
    4: ("code-tracer-topology.svg", "Physical topology: what is written where, read by whom"),
}


def strip_part_header(text):
    """Drop the per-part title block, up to and including its first rule."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.strip() == "---":
            return "\n".join(lines[i + 1:]).strip()
    return text.strip()


def drop_trailing_note(text):
    return re.sub(r"\n---\n\n> \*\*Drafting note.*$", "", text, flags=re.S).strip()


def fig_marker(n):
    return f"@@FIG{n}@@"


def build_markdown():
    chunks = []
    for filename, heading, strip in PARTS:
        raw = (HERE / filename).read_text()
        body = strip_part_header(raw) if strip else raw.strip()
        body = drop_trailing_note(body)
        if filename.startswith("part-1"):
            # the per-part scope note duplicates the front matter
            body = re.sub(r"## A note on scope.*?\n---\n", "", body, flags=re.S).strip()
            body = body.replace(
                "## 5. Verification does not compress",
                fig_marker(2) + "\n\n---\n\n## 5. Verification does not compress",
            )
        if filename.startswith("part-3"):
            body = body.replace(
                "## 9. The contract compiles to a policy",
                fig_marker(3) + "\n\n---\n\n## 9. The contract compiles to a policy",
            )
            body = body.replace(
                "### What you actually deploy",
                fig_marker(4) + "\n\n### What you actually deploy",
            )
        if heading:
            chunks.append(f"---\n\n# {heading}")
        chunks.append(body)
        if filename.startswith("00-"):
            chunks.append(fig_marker(1))
    doc = "\n\n".join(chunks)
    return re.sub(r"\n{4,}", "\n\n\n", doc)


def to_markdown_figures(doc):
    for n, (src, caption) in FIGURES.items():
        img = f"![Figure {n} — {caption}](../docs/resource/{src})\n\n*Figure {n} — {caption}.*"
        doc = doc.replace(fig_marker(n), img)
    return doc


CSS = """
:root{--ink:#1a2332;--muted:#5b6676;--rule:#e3e8ee;--accent:#b91c1c;--bg:#fdfdfc}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
 font:16px/1.65 Georgia,'Iowan Old Style','Times New Roman',serif}
.wrap{max-width:46rem;margin:0 auto;padding:4rem 1.5rem 6rem}
h1{font-size:2.1rem;line-height:1.2;letter-spacing:-.01em;margin:0 0 .3rem}
h2{font-size:1.45rem;margin:2.8rem 0 .8rem;line-height:1.25;letter-spacing:-.005em}
h3{font-size:1.12rem;margin:2rem 0 .6rem;color:#24303f}
h1+h2{margin-top:.6rem;font-weight:400;color:var(--muted);font-size:1.25rem}
p{margin:0 0 1.05rem}
hr{border:0;border-top:1px solid var(--rule);margin:2.6rem 0}
strong{font-weight:700}
em{color:#33404f}
blockquote{margin:1.4rem 0;padding:.9rem 1.3rem;border-left:3px solid var(--accent);
 background:#fff7f7;color:#5a1a1a}
blockquote p{margin:0 0 .6rem}blockquote p:last-child{margin:0}
code{font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;
 background:#f3f4f6;padding:.1em .35em;border-radius:3px}
pre{background:#f7f8fa;border:1px solid var(--rule);border-radius:6px;padding:1rem;
 overflow-x:auto}
pre code{background:none;padding:0;font-size:12.5px;line-height:1.55}
table{border-collapse:collapse;width:100%;margin:1.4rem 0;font-size:14.5px}
th,td{border-bottom:1px solid var(--rule);padding:.55rem .6rem;text-align:left;
 vertical-align:top}
th{font-weight:700;border-bottom:2px solid #cbd5e1}
ul,ol{margin:0 0 1.05rem;padding-left:1.3rem}
li{margin:.3rem 0}
.fig{margin:2rem 0 .4rem;padding:1rem;background:#fff;border:1px solid var(--rule);
 border-radius:8px;overflow-x:auto}
.fig svg{display:block;width:100%;height:auto;min-width:900px}
.fig + p em{display:block;color:var(--muted);font-size:13.5px;margin-top:-.2rem}
@media print{body{background:#fff}.wrap{max-width:none;padding:0}
 .fig{break-inside:avoid;page-break-inside:avoid}
 h2{break-after:avoid}}
"""


def to_html(doc):
    import markdown

    body = markdown.markdown(doc, extensions=["tables", "fenced_code", "toc"])
    for n, (src, caption) in FIGURES.items():
        svg = (RESOURCE / src).read_text()
        svg = re.sub(r"^<\?xml[^>]*\?>\s*", "", svg)
        body = body.replace(fig_marker(n), f'<div class="fig">{svg}</div>')
        body = body.replace(
            f"<p>{fig_marker(n)}</p>", f'<div class="fig">{svg}</div>'
        )
    title = (
        "Contract-Bound Evidence — admitting externally-patched "
        "open source into a regulated estate"
    )
    return (
        '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        f"<title>{title}</title>\n<style>{CSS}</style></head><body>"
        f'<div class="wrap">\n{body}\n</div></body></html>'
    )


def main():
    BUILD.mkdir(exist_ok=True)
    doc = build_markdown()
    html = to_html(doc)
    (BUILD / "contract-bound-evidence.md").write_text(to_markdown_figures(doc))
    (BUILD / "contract-bound-evidence.html").write_text(html)
    words = len(re.findall(r"[A-Za-z0-9'’\-]+", doc))
    print(f"wrote {BUILD}/contract-bound-evidence.md and .html — {words} words")


if __name__ == "__main__":
    main()
