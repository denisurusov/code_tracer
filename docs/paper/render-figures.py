#!/usr/bin/env python3
"""Rasterize the four figures for embedding in the Word/PDF build.

    python3 docs/paper/render-figures.py

Writes docs/build/fig{1..4}.png from docs/resources. Scale 2.2 puts the widest
diagram at ~3200px, which is enough that the 9-12px labels survive being placed
on a landscape page. If you change the scale, update the pixel dimensions in
mkdocx.js FIGS to match, since the aspect ratio there drives the fit calculation.

Requires: cairosvg
"""
import pathlib

import cairosvg

HERE = pathlib.Path(__file__).resolve().parent
RESOURCE = HERE.parent / "resources"
BUILD = HERE.parent / "build"

FIGURES = [
    ("p1-lifecycle.svg", "fig1.png"),
    ("p2-datamodel.svg", "fig2.png"),
    ("p3-architecture.svg", "fig3.png"),
    ("code-tracer-topology.svg", "fig4.png"),
]

SCALE = 2.2


def main():
    BUILD.mkdir(exist_ok=True)
    for src, out in FIGURES:
        target = BUILD / out
        cairosvg.svg2png(url=str(RESOURCE / src), write_to=str(target), scale=SCALE)
        print(f"{out}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
