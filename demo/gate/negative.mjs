#!/usr/bin/env node
// Negative cases for the gate. Each case copies the demo (with its evidence) to a
// temporary directory, applies one change, and runs the gate. A case passes when
// the gate refuses and the refusal names the expected rule.
//
// Run after `npm run evidence` and the sign-offs, so out/ holds a full set.
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verify, RULES } from "./verify.mjs";
import { generateKey, signEnvelope } from "../evidence/lib/dsse.mjs";
import { fileDigest } from "../evidence/lib/digest.mjs";

const SRC = process.cwd();

function copyDemo() {
  const dir = mkdtempSync(join(tmpdir(), "gate-neg-"));
  cpSync(SRC, dir, { recursive: true, filter: (p) => !p.startsWith(join(SRC, "node_modules")) });
  symlinkSync(join(SRC, "node_modules"), join(dir, "node_modules"));
  return dir;
}

const att = (dir, c) => join(dir, "out/attestations", `${c}.dsse.json`);
const readStatement = (dir, c) => JSON.parse(Buffer.from(JSON.parse(readFileSync(att(dir, c), "utf8")).payload, "base64").toString());
const resign = (dir, c, statement, signerId) =>
  writeFileSync(att(dir, c), JSON.stringify(signEnvelope(statement, readFileSync(join(dir, ".keys", `${signerId}.key`), "utf8")), null, 2));

const CASES = [
  {
    name: "product source changed after testing",
    expect: "G05",
    apply: (d) => appendFileSync(join(d, "product/lib/quote.mjs"), "\n// patched after the tests ran\n"),
  },
  {
    name: "attestation payload edited without re-signing",
    expect: "G01",
    apply: (d) => {
      const env = JSON.parse(readFileSync(att(d, "unit"), "utf8"));
      const st = JSON.parse(Buffer.from(env.payload, "base64").toString());
      st.predicate.url = "https://example.com/a-different-run";
      env.payload = Buffer.from(JSON.stringify(st)).toString("base64");
      writeFileSync(att(d, "unit"), JSON.stringify(env));
    },
  },
  {
    name: "attestation signed by an unknown key",
    expect: "G02",
    apply: (d) => writeFileSync(att(d, "e2e"), JSON.stringify(signEnvelope(readStatement(d, "e2e"), generateKey().privatePem))),
  },
  {
    name: "UX sign-off signed by a trusted person not authorized for UX",
    expect: "G03",
    apply: (d) => resign(d, "ux-signoff", readStatement(d, "ux-signoff"), "raj.patel"),
  },
  {
    name: "load results signed by the CI pipeline instead of the perf environment",
    expect: "G03",
    apply: (d) => resign(d, "load", readStatement(d, "load"), "ci-pipeline"),
  },
  {
    name: "catalog changed after testing (intent rewritten)",
    expect: "G06",
    apply: (d) => appendFileSync(join(d, "tests/catalog.yaml"), "\n# objective reworded after the run\n"),
  },
  {
    name: "scenario file changed after testing",
    expect: "G07",
    apply: (d) => appendFileSync(join(d, "tests/features/integration/service.feature"), "\n# edited\n"),
  },
  {
    name: "report file swapped",
    expect: "G08",
    apply: (d) => writeFileSync(join(d, "out/results/sast/semgrep.sarif"), JSON.stringify({ version: "2.1.0", runs: [] })),
  },
  {
    name: "a catalog test silently dropped from the results (properly signed)",
    expect: "G09",
    apply: (d) => {
      const st = readStatement(d, "contract");
      st.predicate.passedTests = st.predicate.passedTests.filter((id) => id !== "API-004");
      resign(d, "contract", st, "ci-pipeline");
    },
  },
  {
    name: "a test failed (properly signed)",
    expect: "G10",
    apply: (d) => {
      const st = readStatement(d, "unit");
      st.predicate.passedTests = st.predicate.passedTests.filter((id) => id !== "UNIT-005");
      st.predicate.failedTests = ["UNIT-005"];
      st.predicate.result = "FAILED";
      resign(d, "unit", st, "ci-pipeline");
    },
  },
  {
    name: "load environment spec missing fields (properly signed)",
    expect: "G11",
    apply: (d) => {
      const specPath = join(d, "out/results/load/env-spec.json");
      const spec = JSON.parse(readFileSync(specPath, "utf8"));
      delete spec.compute;
      writeFileSync(specPath, JSON.stringify(spec, null, 2));
      const st = readStatement(d, "load");
      const desc = st.predicate.configuration.find((x) => x.annotations.role === "environment-spec");
      desc.digest.sha256 = fileDigest(specPath);
      resign(d, "load", st, "perf-env");
    },
  },
  {
    name: "required category missing (no accessibility evidence)",
    expect: "G12",
    apply: (d) => rmSync(att(d, "accessibility")),
  },
];

const baseline = verify({ root: SRC });
console.log(`baseline: ${baseline.verdict}`);
if (baseline.verdict !== "ADMIT") {
  console.error("Baseline evidence is not admitted; run the full demo first.");
  process.exit(1);
}

const rows = [];
for (const c of CASES) {
  const dir = copyDemo();
  try {
    c.apply(dir);
    const r = verify({ root: dir });
    const rules = [...new Set(r.failures.map((f) => f.rule))];
    const ok = r.verdict === "REFUSE" && rules.includes(c.expect);
    const first = r.failures.find((f) => f.rule === c.expect) ?? r.failures[0];
    rows.push({ case: c.name, expected: `${c.expect} ${RULES[c.expect]}`, verdict: r.verdict, "rules failed": rules.join(" "), ok: ok ? "✓" : "✗" });
    if (first) console.log(`- ${c.name}\n    ${first.rule} ${first.name} [${first.category}]: ${first.detail}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.table(rows);
const bad = rows.filter((r) => r.ok !== "✓").length;
console.log(bad ? `${bad} case(s) did not behave as expected` : `All ${rows.length} negative cases refused by the expected rule.`);
process.exitCode = bad ? 1 : 0;
