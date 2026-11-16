#!/usr/bin/env node
// Evidence runner. For each category: run the tests, convert the output to CTRF
// (and SARIF where it is a scan), check coverage against the catalog, build an
// in-toto test-result statement and sign it as a DSSE envelope.
//
// Run `npm run build` first: the jar in out/artifacts/ is a subject of every attestation.
//
//   node evidence/run.mjs all            every automated category
//   node evidence/run.mjs unit load ...  selected categories
//
// Output, per category:
//   out/results/<category>/ctrf.json + native reports
//   out/attestations/<category>.dsse.json
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { CATEGORIES, AUTOMATED, idFromName, ctrfReport } from "./categories.mjs";
import { CATALOG_PATH, idsFor, loadCatalog, scenariosFor } from "./lib/catalog.mjs";
import { descriptor } from "./lib/digest.mjs";
import { buildStatement, classify } from "./lib/statement.mjs";
import { signEnvelope } from "./lib/dsse.mjs";
import { ensureKeys, privateKey } from "./lib/keys.mjs";
import { writeBundle } from "./lib/bundle.mjs";

const args = process.argv.slice(2);
const selected = args.length === 0 || args.includes("all") ? AUTOMATED : args;
for (const c of selected) if (!CATEGORIES[c]) throw new Error(`unknown category ${c}; known: ${AUTOMATED.join(", ")}`);

ensureKeys();
const catalog = loadCatalog();
const rows = [];

for (const category of selected) {
  const def = CATEGORIES[category];
  const ids = idsFor(catalog, category);
  console.log(`\n=== ${category} (${ids.length} catalog tests) ===`);
  rmSync(`out/raw/${category}`, { recursive: true, force: true });
  rmSync(`out/results/${category}`, { recursive: true, force: true });
  mkdirSync(`out/raw/${category}`, { recursive: true });
  mkdirSync(`out/results/${category}`, { recursive: true });
  mkdirSync("out/attestations", { recursive: true });

  const started = Date.now();
  def.run();
  const finished = Date.now();
  const ev = def.evaluate({ ids });

  // Results directory: CTRF plus native reports, all digested into the statement.
  const resultsDir = `out/results/${category}`;
  const ctrfPath = `${resultsDir}/ctrf.json`;
  writeFileSync(ctrfPath, JSON.stringify(ctrfReport(ev.tool.name, ev.tool.version, ev.tests, started, finished), null, 2));
  const reportPaths = ev.reports.map((p) => {
    const dest = `${resultsDir}/${p.startsWith(`out/raw/${category}/`) ? p.slice(`out/raw/${category}/`.length) : basename(p)}`;
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(p, dest);
    return dest;
  });
  let envSpecPath;
  if (ev.environmentSpec) {
    envSpecPath = `${resultsDir}/${basename(ev.environmentSpec)}`;
    cpSync(ev.environmentSpec, envSpecPath);
  }

  const configuration = [
    descriptor(CATALOG_PATH, { role: "catalog" }),
    ...scenariosFor(catalog, category).map((p) => descriptor(p, { role: "scenario" })),
    ...(ev.extraConfig ?? []).map((p) => descriptor(p, { role: "scenario" })),
    ...(ev.vex ? [descriptor(ev.vex, { role: "vex", format: "OpenVEX" })] : []),
    ...(ev.snapshot ? [ev.snapshot] : []),
    ...(envSpecPath ? [descriptor(envSpecPath, { role: "environment-spec" })] : []),
    descriptor(ctrfPath, { role: "report", format: "CTRF" }),
    ...reportPaths.map((p) => descriptor(p, { role: "report", format: p.endsWith(".sarif") ? "SARIF" : "native" })),
  ];

  const classified = classify(ev.tests, ids, idFromName);
  const statement = buildStatement({ category, classified, configuration, started, finished, tool: ev.tool, extra: ev.extra });
  const envelope = signEnvelope(statement, privateKey(def.signer));
  writeFileSync(`out/attestations/${category}.dsse.json`, JSON.stringify(envelope, null, 2));
  rows.push({ category, result: statement.predicate.result, passed: classified.passed.length, warned: classified.warned.length,
    failed: classified.failed.length + classified.missing.length + classified.unknown.length, signer: def.signer });
}

const bundlePath = writeBundle();
console.log(`\nEvidence written to out/attestations/ and bundled in ${bundlePath}:`);
console.table(rows);
process.exitCode = rows.some((r) => r.result === "FAILED") ? 1 : 0;
