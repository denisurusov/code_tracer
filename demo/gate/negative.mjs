#!/usr/bin/env node
// Negative cases for the gate, plus one positive VEX case. Each case copies the
// demo (with its evidence) to a temporary directory, applies one change, rebuilds
// the bundle and runs the gate. A negative case passes when the gate refuses and
// the refusal names the expected rule; the positive case passes when it admits.
//
// Run after `npm run evidence` and the sign-offs, so out/ holds a full set.
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verify, RULES } from "./verify.mjs";
import { generateKey, signEnvelope } from "../evidence/lib/dsse.mjs";
import { fileDigest } from "../evidence/lib/digest.mjs";
import { writeBundle } from "../evidence/lib/bundle.mjs";
import { spawnSync } from "node:child_process";

const SRC = process.cwd();

function copyDemo() {
  const dir = mkdtempSync(join(tmpdir(), "gate-neg-"));
  cpSync(SRC, dir, { recursive: true, filter: (p) => !p.startsWith(join(SRC, "node_modules")) && !p.startsWith(join(SRC, "out/cache")) });
  symlinkSync(join(SRC, "node_modules"), join(dir, "node_modules"));
  return dir;
}

const att = (dir, c) => join(dir, "out/attestations", `${c}.dsse.json`);
const readStatement = (dir, c) => JSON.parse(Buffer.from(JSON.parse(readFileSync(att(dir, c), "utf8")).payload, "base64").toString());
const resign = (dir, c, statement, signerId) =>
  writeFileSync(att(dir, c), JSON.stringify(signEnvelope(statement, readFileSync(join(dir, ".keys", `${signerId}.key`), "utf8")), null, 2));

// Re-run the SCA category inside the copy against the fixture OSV snapshot (one
// fictional high-severity advisory on jackson-databind) and an optional VEX document.
function rerunSca(dir, { vex } = {}) {
  const env = { ...process.env, DEMO_OSV_SNAPSHOT: "tests/sca/fixtures/osv-snapshot-demo", ...(vex ? { DEMO_VEX: vex } : {}) };
  const r = spawnSync(process.execPath, ["evidence/run.mjs", "sca"], { cwd: dir, env, encoding: "utf8" });
  if (r.error) throw r.error;
}
const jarPath = (d) => join(d, "out/artifacts/fx-quote-demo-0.1.0.jar");

const CASES = [
  {
    name: "product source changed after testing",
    expect: "G05",
    apply: (d) => appendFileSync(join(d, "product/src/main/java/demo/fxquote/Quote.java"), "\n// patched after the tests ran\n"),
  },
  {
    name: "product source changed after the build; the gate's own rebuild disagrees",
    expect: "G15",
    rebuild: true,
    apply: (d) => writeFileSync(join(d, "product/src/main/java/demo/fxquote/Quote.java"),
      readFileSync(join(d, "product/src/main/java/demo/fxquote/Quote.java"), "utf8").replace('"20000"', '"10000"')),
  },
  {
    name: "build is not reproducible (rebuild digest differs from provenance)",
    expect: "G15",
    rebuild: "0".repeat(64),
    apply: () => {},
  },
  {
    name: "delivered jar replaced after the build",
    expect: "G14",
    apply: (d) => appendFileSync(jarPath(d), Buffer.from([0])),
  },
  {
    name: "tests ran against a different jar than the provenance covers (properly signed)",
    expect: "G14",
    apply: (d) => {
      const st = readStatement(d, "unit");
      st.subject[0].digest.sha256 = "1".repeat(64);
      resign(d, "unit", st, "ci-pipeline");
      writeFileSync(jarPath(d), readFileSync(jarPath(d))); // delivered jar unchanged
    },
  },
  {
    name: "build provenance signed by the CI pipeline instead of the build service",
    expect: "G03",
    apply: (d) => resign(d, "build", readStatement(d, "build"), "ci-pipeline"),
  },
  {
    name: "build provenance missing",
    expect: "G12",
    apply: (d) => rmSync(att(d, "build")),
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
  {
    name: "high-severity OSV advisory on a runtime dependency, no VEX",
    expect: "G10",
    apply: (d) => rerunSca(d),
  },
  {
    name: "advisory suppressed by an OpenVEX not_affected statement that cites no proof",
    expect: "G13",
    apply: (d) => rerunSca(d, { vex: "tests/sca/fixtures/vex-jackson-no-proof.openvex.json" }),
  },
  {
    name: "advisory suppressed by VEX citing a proof test that failed",
    expect: "G13",
    apply: (d) => {
      rerunSca(d, { vex: "tests/sca/fixtures/vex-jackson-not-affected.openvex.json" });
      const st = readStatement(d, "unit");
      st.predicate.passedTests = st.predicate.passedTests.filter((id) => id !== "UNIT-007");
      st.predicate.failedTests = ["UNIT-007"];
      st.predicate.result = "FAILED";
      resign(d, "unit", st, "ci-pipeline");
    },
  },
  {
    name: "POSITIVE: advisory suppressed by VEX citing a passed proof test (UNIT-007)",
    expectVerdict: "ADMIT",
    apply: (d) => rerunSca(d, { vex: "tests/sca/fixtures/vex-jackson-not-affected.openvex.json" }),
  },
];

// One real rebuild for the baseline; cases reuse its digest unless they ask to rebuild.
const baseline = verify({ root: SRC, rebuild: true });
console.log(`baseline: ${baseline.verdict} (rebuilt jar ${baseline.rebuildDigest})`);
if (baseline.verdict !== "ADMIT") {
  console.error("Baseline evidence is not admitted; run the full demo first.");
  process.exit(1);
}

const rows = [];
for (const c of CASES) {
  const dir = copyDemo();
  try {
    c.apply(dir);
    writeBundle(dir);
    const r = verify({ root: dir, rebuild: c.rebuild ?? baseline.rebuildDigest });
    const rules = [...new Set(r.failures.map((f) => f.rule))];
    const ok = c.expectVerdict === "ADMIT" ? r.verdict === "ADMIT" : r.verdict === "REFUSE" && rules.includes(c.expect);
    const first = r.failures.find((f) => f.rule === c.expect) ?? r.failures[0];
    rows.push({ case: c.name, expected: c.expect ? `${c.expect} ${RULES[c.expect]}` : "ADMIT", verdict: r.verdict, "rules failed": rules.join(" "), ok: ok ? "✓" : "✗" });
    if (first) console.log(`- ${c.name}\n    ${first.rule} ${first.name} [${first.category}]: ${first.detail}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.table(rows);
const bad = rows.filter((r) => r.ok !== "✓").length;
console.log(bad ? `${bad} case(s) did not behave as expected` : `All ${rows.length} cases behaved as expected (each refusal by the expected rule).`);
process.exitCode = bad ? 1 : 0;
