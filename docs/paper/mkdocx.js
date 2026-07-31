// Build contract-bound-evidence.docx from the assembled markdown.
//
//   python3 docs/paper/assemble.py          # docs/build/contract-bound-evidence.md
//   python3 docs/paper/render-figures.py    # docs/build/fig{1..4}.png from docs/resources
//   node docs/paper/mkdocx.js               # docs/build/contract-bound-evidence.docx
//   soffice --headless --convert-to pdf --outdir docs/build docs/build/contract-bound-evidence.docx
//
// Body is portrait US Letter; each figure gets its OWN LANDSCAPE PAGE, because the
// diagrams run about 1.5:1 with 9-12px labels and are illegible scaled into a
// portrait column. That was verified by rendering and looking, not assumed.
//
// Deliberately a small hand-rolled markdown subset rather than pandoc: the paper
// uses only headings, paragraphs, tables, fenced code, blockquotes, bullets and
// rules, and this keeps the styling decisions in one readable place.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, PageOrientation, Header, Footer, PageNumber, SectionType,
} = require('docx');

const BUILD = path.resolve(__dirname, '../build');
const MD = fs.readFileSync(path.join(BUILD, 'contract-bound-evidence.md'), 'utf8');

// assemble.py stamps the source commit into an HTML comment on the first line.
// It rides into the docx metadata and the page footer so a circulated file names
// the tree it came from; the parser below skips the comment so it never renders
// as a paragraph.
const STAMP = (MD.match(/^<!--\s*built from (\S+)\s*-->/m) || [, 'unknown'])[1];

// Pixel dimensions of the rendered PNGs (cairosvg, scale 2.2). These MUST equal
// the SVG viewBox times SCALE — the ratio drives the landscape fit calculation,
// so a resized figure with a stale constant is scaled slightly wrong and nothing
// reports it. fig1 carried 3124x1936 against an actual 3168x1980 until 2026-07-30.
const FIGS = {
  1: { file: 'fig1.png', cap: 'Lifecycle and zones', w: 3168, h: 1980 },
  2: { file: 'fig2.png', cap: 'Data model: which attribute binds to which', w: 3212, h: 2068 },
  3: { file: 'fig3.png', cap: 'Architecture: components and the stores they touch', w: 3124, h: 1760 },
  4: { file: 'fig4.png', cap: 'Physical topology: what is written where, read by whom', w: 3168, h: 2222 },
};

const INK = '1A2332', MUTED = '5B6676', RULE = 'E3E8EE', ACCENT = 'B91C1C';

// ---------- inline markdown -> TextRuns ----------
function runs(text, base = {}) {
  const out = [];
  // order matters: code first, so ** inside a code span is not read as bold
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g;
  let last = 0, m;
  const push = (t, opts) => { if (t) out.push(new TextRun({ text: t, ...base, ...opts })); };
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index), {});
    if (m[1]) push(m[1].slice(1, -1), { font: 'Consolas', size: 19 });
    else if (m[2]) push(m[2].slice(2, -2), { bold: true });
    else if (m[3]) push(m[3].slice(1, -1), { italics: true });
    else if (m[4]) push(m[4].slice(1, -1), { italics: true });
    last = m.index + m[0].length;
  }
  push(text.slice(last), {});
  return out.length ? out : [new TextRun({ text: '', ...base })];
}

const P = (text, opts = {}) => new Paragraph({
  children: runs(text, opts.run || {}),
  spacing: { after: opts.after ?? 160, line: opts.line ?? 276 },
  ...opts.para,
});

// Tables need BOTH columnWidths and a width on every cell, both in DXA;
// percentage widths break in Google Docs.
function tableFrom(lines) {
  const rows = lines.filter(l => !/^\|[\s:|-]+\|$/.test(l.trim()));
  const cells = rows.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  const nCols = Math.max(...cells.map(r => r.length));
  const total = 9360; // 6.5in in DXA
  const colW = Math.floor(total / nCols);
  const widths = Array(nCols).fill(colW);
  widths[nCols - 1] = total - colW * (nCols - 1); // make the columns sum exactly
  return new Table({
    columnWidths: widths,
    width: { size: total, type: WidthType.DXA },
    rows: cells.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: Array.from({ length: nCols }, (_, c) => new TableCell({
        width: { size: widths[c], type: WidthType.DXA },
        // CLEAR, never SOLID — SOLID renders black
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: 'F3F5F8' } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          children: runs(r[c] || '', { size: 18, bold: i === 0 }),
          spacing: { after: 0, line: 240 },
        })],
      })),
    })),
  });
}

// ---------- block parse ----------
const children = [];
const lines = MD.split('\n');
let i = 0;

const isFig = l => /^!\[Figure (\d)/.test(l);

let guard = 0, lastI = -1, stuck = 0;
while (i < lines.length) {
  // Progress guards. An earlier revision looped forever on a line beginning with
  // '-' that was not a list item ("-osera.N"): it matched no branch and never
  // advanced i. Cheap to detect, miserable to diagnose without.
  if (i === lastI) {
    if (++stuck > 3) { console.error('STUCK at line', i, JSON.stringify(lines[i])); process.exit(3); }
  } else { stuck = 0; lastI = i; }
  if (++guard > 50000) { console.error('GUARD tripped at line', i); process.exit(4); }
  const line = lines[i];

  // HTML comments carry build metadata, never content. Skip them, including the
  // multi-line case, so the stamp does not surface as a paragraph in the docx.
  if (/^<!--/.test(line)) {
    while (i < lines.length && !/-->/.test(lines[i])) i++;
    i++;
    continue;
  }

  if (isFig(line)) {
    children.push({ FIG: Number(line.match(/^!\[Figure (\d)/)[1]) });
    i++;
    // swallow the italic caption that follows the image in the markdown
    while (i < lines.length && (lines[i].trim() === '' || /^\*Figure \d/.test(lines[i].trim()))) i++;
    continue;
  }

  if (/^\|/.test(line)) {
    const buf = [];
    while (i < lines.length && /^\|/.test(lines[i])) buf.push(lines[i++]);
    children.push(tableFrom(buf));
    children.push(new Paragraph({ text: '', spacing: { after: 160 } }));
    continue;
  }

  if (/^```/.test(line)) {
    i++;
    const buf = [];
    while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
    i++;
    buf.forEach(b => children.push(new Paragraph({
      children: [new TextRun({ text: b || ' ', font: 'Consolas', size: 16 })],
      spacing: { after: 0, line: 240 },
      shading: { type: ShadingType.CLEAR, fill: 'F7F8FA' },
    })));
    children.push(new Paragraph({ text: '', spacing: { after: 160 } }));
    continue;
  }

  if (/^>\s?/.test(line)) {
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
    children.push(new Paragraph({
      children: runs(buf.join(' ').trim(), { color: '5A1A1A' }),
      spacing: { before: 120, after: 200, line: 276 },
      indent: { left: 360 },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 12 } },
    }));
    continue;
  }

  if (/^---+\s*$/.test(line)) {
    // a paragraph bottom border, never a one-row table
    children.push(new Paragraph({
      text: '', spacing: { before: 120, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 6 } },
    }));
    i++; continue;
  }

  const h = line.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const lvl = h[1].length;
    const txt = h[2].trim();
    if (lvl === 1 && /^Part /.test(txt)) {
      children.push(new Paragraph({ children: [new PageBreak()] })); // must sit inside a Paragraph
    }
    children.push(new Paragraph({
      children: runs(txt, {
        size: lvl === 1 ? 36 : lvl === 2 ? 27 : 23,
        bold: true,
        color: lvl === 1 ? INK : lvl === 2 ? INK : '24303F',
      }),
      // built-in HeadingLevel so a generated TOC would pick these up
      heading: lvl === 1 ? HeadingLevel.HEADING_1
        : lvl === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      spacing: { before: lvl === 1 ? 280 : 320, after: 140 },
    }));
    i++; continue;
  }

  if (/^\s*[-*]\s+/.test(line)) {
    const buf = [];
    while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
    buf.forEach(b => children.push(new Paragraph({
      children: runs(b),
      bullet: { level: 0 }, // never a literal bullet glyph
      spacing: { after: 90, line: 276 },
    })));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
    continue;
  }

  if (line.trim() === '') { i++; continue; }

  // Paragraph: always consume the current line, then continue while it reads as
  // prose. Consuming unconditionally is what guarantees forward progress.
  const buf = [lines[i++]];
  while (
    i < lines.length && lines[i].trim() !== '' &&
    !/^(#{1,4}\s|>|\||```|---+\s*$|<!--)/.test(lines[i]) &&
    !/^\s*[-*]\s+/.test(lines[i]) && !isFig(lines[i])
  ) {
    buf.push(lines[i++]);
  }
  const text = buf.join(' ').replace(/\s+/g, ' ').trim();
  if (text) children.push(P(text));
}

// ---------- sections: portrait body, landscape figure pages ----------
const chrome = () => ({
  headers: {
    default: new Header({
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'Contract-Bound Evidence — working draft', size: 16, color: MUTED })],
        spacing: { after: 120 },
      })],
    }),
  },
  footers: {
    default: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })],
        }),
        // Belt to the metadata's braces. LibreOffice drops dc:description when it
        // exports to PDF, so a properties-only stamp does not survive conversion.
        // A footer line cannot be dropped by a converter, and a reader can check
        // it without opening a properties dialog.
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `built from ${STAMP.slice(0, 12)}`, size: 12, color: MUTED })],
        }),
      ],
    }),
  },
});

// US Letter in DXA (1440 = 1in). docx-js swaps width/height for LANDSCAPE, so
// portrait dimensions are passed in both cases.
const PORTRAIT = {
  page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
  },
  type: SectionType.NEXT_PAGE,
};
const LANDSCAPE = {
  page: {
    size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
    margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
  },
  type: SectionType.NEXT_PAGE,
};

function figureSection(n) {
  const f = FIGS[n];
  const maxW = 680, maxH = 460; // points available inside a landscape Letter page
  const scale = Math.min(maxW / f.w, maxH / f.h);
  return {
    properties: LANDSCAPE,
    ...chrome(),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 100 },
        children: [new ImageRun({
          type: 'png', // ImageRun requires an explicit type
          data: fs.readFileSync(path.join(BUILD, f.file)),
          transformation: { width: Math.round(f.w * scale), height: Math.round(f.h * scale) },
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Figure ${n} — ${f.cap}`, italics: true, size: 18, color: MUTED })],
      }),
    ],
  };
}

const sections = [];
let bodyBuf = [];
const flushBody = () => {
  if (bodyBuf.length) {
    sections.push({ properties: PORTRAIT, ...chrome(), children: bodyBuf });
    bodyBuf = [];
  }
};
for (const el of children) {
  if (el && el.FIG) { flushBody(); sections.push(figureSection(el.FIG)); }
  else bodyBuf.push(el);
}
flushBody();

const doc = new Document({
  creator: 'code_tracer',
  title: 'Contract-Bound Evidence',
  description: `Admitting externally-patched open source into a regulated estate — built from ${STAMP}`,
  // dc:description is Word's Comments field, and LibreOffice does NOT export it
  // to PDF — verified 2026-07-30, the PDF came out with an empty /Subject.
  // dc:subject does survive as /Subject, so the stamp rides in both.
  subject: `built from ${STAMP}`,
  styles: { default: { document: { run: { font: 'Georgia', size: 21, color: INK } } } },
  sections,
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync(path.join(BUILD, 'contract-bound-evidence.docx'), b);
  console.log('docx bytes:', b.length, '| blocks:', children.length,
              '| sections:', sections.length, '| stamp:', STAMP);
});
