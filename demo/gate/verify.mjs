#!/usr/bin/env node
// Bank ingestion gate for test evidence. Runs offline over:
//   - the cloned product source (to recompute the subject digest),
//   - the scenario files, catalog and VEX document in the clone,
//   - the evidence bundle (out/evidence.intoto.jsonl) and result files that came with it.
//
// Two layers, as in the architecture:
//   structural  (this file)          signatures, signer identity, purl + digest binding, file digests
//   semantic    (gate/policy/*.rego) coverage, results, environment spec, required categories, VEX
//
// Every refusal names the rule it failed. The gate signs a SLSA VSA either way.
//
//   node gate/verify.mjs [--root .] [--evidence out] [--policy gate/policy.yaml] [--trust .keys/trust.json]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { fileDigest, sha256, sourceDigest } from "../evidence/lib/digest.mjs";
import { signEnvelope, verifyEnvelope } from "../evidence/lib/dsse.mjs";
import { TEST_RESULT_TYPE, STATEMENT_TYPE } from "../evidence/lib/statement.mjs";
import { BUNDLE_NAME, readBundle } from "../evidence/lib/bundle.mjs";

export const RULES = {
  G01: "signature-valid",
  G02: "signer-trusted",
  G03: "signer-authorized-for-category",
  G04: "statement-is-test-result",
  G05: "subject-matches-source",
  G06: "catalog-matches",
  G07: "scenarios-match",
  G08: "reports-match",
  G09: "coverage-complete",
  G10: "result-acceptable",
  G11: "environment-spec-complete",
  G12: "required-categories-present",
  G13: "vex-backed-by-proof",
};
const SEMANTIC = ["G09", "G10", "G11", "G12", "G13"];
const POLICY_DIR = fileURLToPath(new URL("./policy", import.meta.url));

function evalRego(input) {
  const out = execFileSync("opa", ["eval", "--v1-compatible", "--format", "json", "--data", POLICY_DIR, "--stdin-input", "data.codetracer.gate.deny"],
    { input: JSON.stringify(input), encoding: "utf8" });
  return JSON.parse(out).result?.[0]?.expressions?.[0]?.value ?? [];
}

export function verify({ root = ".", evidence = "out", policyPath = "gate/policy.yaml", trustPath = ".keys/trust.json" } = {}) {
  const policy = parse(readFileSync(join(root, policyPath), "utf8"));
  const trust = JSON.parse(readFileSync(join(root, trustPath), "utf8"));
  const catalog = parse(readFileSync(join(root, "tests/catalog.yaml"), "utf8"));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const productPurl = catalog.product.purl;
  const src = sourceDigest(root);
  const bundlePath = join(root, evidence, BUNDLE_NAME);
  const envelopes = readBundle(bundlePath);

  const checks = [];
  const fail = (category, rule, detail) => checks.push({ category, rule, name: RULES[rule], ok: false, detail });
  const pass = (category, rule) => checks.push({ category, rule, name: RULES[rule], ok: true });
  const admitted = []; // attestations that passed G01/G02, handed to the semantic layer
  const seen = new Map();

  // The catalog's purl must name this package, or the subject binding means nothing.
  const expectedPurl = `pkg:npm/${pkg.name}@${pkg.version}`;
  if (productPurl !== expectedPurl) fail("*", "G05", `catalog purl ${productPurl} does not match package.json (${expectedPurl})`);

  envelopes.forEach((envelope, i) => {
    const v = verifyEnvelope(envelope, trust);
    const st = v.statement ?? {};
    const p = st.predicate ?? {};
    const category = p["x-code-tracer"]?.category ?? `#${i}`;

    if (v.trusted === false) return fail(category, "G02", v.reason);
    pass(category, "G02");
    if (!v.ok) return fail(category, "G01", v.reason);
    pass(category, "G01");

    const catPolicy = policy.categories[category];
    if (!catPolicy) fail(category, "G03", `no policy for category ${category}`);
    else catPolicy.signers.includes(v.identity.id)
      ? pass(category, "G03")
      : fail(category, "G03", `${v.identity.id} (${v.identity.name}) may not sign ${category}; allowed: ${catPolicy.signers.join(", ")}`);

    st._type === STATEMENT_TYPE && st.predicateType === TEST_RESULT_TYPE
      ? pass(category, "G04") : fail(category, "G04", `predicateType ${st.predicateType}`);

    const subj = st.subject?.[0];
    const subjectProblems = [
      subj?.name !== productPurl && `subject ${subj?.name} is not ${productPurl}`,
      subj?.digest?.sha256 !== src.digest && `attested ${subj?.digest?.sha256}, clone has ${src.digest}`,
    ].filter(Boolean);
    subjectProblems.length ? fail(category, "G05", subjectProblems.join("; ")) : pass(category, "G05");

    // Every configuration descriptor must match the file in the clone or the evidence dir.
    const byRole = (...roles) => (p.configuration ?? []).filter((d) => roles.includes(d.annotations?.role));
    const mismatches = (ds) => ds.flatMap((d) => {
      const path = join(root, d.name);
      if (!existsSync(path)) return [`${d.name}: missing`];
      return fileDigest(path) === d.digest.sha256 ? [] : [`${d.name}: digest differs`];
    });
    const catD = byRole("catalog");
    const catM = mismatches(catD);
    if (catD.length === 0) fail(category, "G06", "no catalog descriptor");
    else catM.length ? fail(category, "G06", catM.join("; ")) : pass(category, "G06");
    const scM = mismatches(byRole("scenario", "vex"));
    scM.length ? fail(category, "G07", scM.join("; ")) : pass(category, "G07");
    const rpM = mismatches(byRole("report", "environment-spec"));
    rpM.length ? fail(category, "G08", rpM.join("; ")) : pass(category, "G08");

    // Hand the parsed environment spec and VEX document to the semantic layer only if their digests held.
    const readIfMatching = (d) => (d && mismatches([d]).length === 0 ? JSON.parse(readFileSync(join(root, d.name), "utf8")) : null);
    admitted.push({
      category,
      predicate: { passedTests: [], warnedTests: [], failedTests: [], ...p },
      environment_spec: readIfMatching(byRole("environment-spec")[0]),
      vex_document: readIfMatching(byRole("vex")[0]),
    });
    seen.set(category, { index: i, digest: sha256(JSON.stringify(envelope)), signer: v.identity });
  });

  // Semantic layer: Rego.
  const denies = evalRego({ policy, catalog, source_digest: src.digest, attestations: admitted });
  for (const d of denies) fail(d.category, d.rule, d.detail);
  const denied = new Set(denies.map((d) => `${d.rule}|${d.category}`));
  for (const a of admitted) for (const r of SEMANTIC) if (r !== "G12" && !denied.has(`${r}|${a.category}`)) pass(a.category, r);
  if (!denied.has("G12|*")) pass("*", "G12");

  const failures = checks.filter((c) => !c.ok);
  return {
    verdict: failures.length ? "REFUSE" : "ADMIT",
    productType: catalog.product.type, productPurl, sourceDigest: src.digest,
    bundle: { path: join(evidence, BUNDLE_NAME), digest: existsSync(bundlePath) ? fileDigest(bundlePath) : null },
    categories: [...seen.keys()], attestations: Object.fromEntries(seen), checks, failures,
  };
}

export function vsa(report, { root = ".", policyPath = "gate/policy.yaml" } = {}) {
  return {
    _type: STATEMENT_TYPE,
    subject: [{ name: report.productPurl, digest: { sha256: report.sourceDigest } }],
    predicateType: "https://slsa.dev/verification_summary/v1",
    predicate: {
      verifier: { id: "https://example.com/bank/ingestion-gate/demo" },
      timeVerified: new Date().toISOString(),
      resourceUri: report.productPurl,
      policy: { uri: policyPath, digest: { sha256: fileDigest(join(root, policyPath)) } },
      inputAttestations: [{ uri: report.bundle.path, digest: { sha256: report.bundle.digest } }],
      verificationResult: report.verdict === "ADMIT" ? "PASSED" : "FAILED",
      verifiedLevels: [],
      "x-code-tracer": {
        productType: report.productType, categories: report.categories,
        regoPolicyDigest: { sha256: fileDigest(join(POLICY_DIR, "gate.rego")) },
        failedRules: report.failures.map((f) => `${f.rule} ${f.name} [${f.category}]`),
      },
    },
  };
}

export function printReport(r) {
  const byCat = new Map();
  for (const c of r.checks) {
    const row = byCat.get(c.category) ?? { category: c.category, checks: 0, failed: [] };
    row.checks++;
    if (!c.ok) row.failed.push(`${c.rule} ${c.name}`);
    byCat.set(c.category, row);
  }
  console.table([...byCat.values()].map((x) => ({ category: x.category, checks: x.checks, result: x.failed.length ? "FAIL" : "ok", failed: x.failed.join(", ") })));
  for (const f of r.failures) console.log(`  ✗ ${f.rule} ${f.name} [${f.category}]: ${f.detail}`);
  console.log(`\nVerdict for ${r.productPurl} (${r.productType}): ${r.verdict}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { root: { type: "string", default: "." }, evidence: { type: "string", default: "out" },
    policy: { type: "string", default: "gate/policy.yaml" }, trust: { type: "string", default: ".keys/trust.json" } } });
  const opts = { root: values.root, evidence: values.evidence, policyPath: values.policy, trustPath: values.trust };
  const report = verify(opts);
  printReport(report);
  const gateKey = readFileSync(join(values.root, ".keys/bank-gate.key"), "utf8");
  const out = join(values.root, values.evidence, "vsa.dsse.json");
  writeFileSync(out, JSON.stringify(signEnvelope(vsa(report, opts), gateKey), null, 2));
  writeFileSync(join(values.root, values.evidence, "gate-report.json"), JSON.stringify(report, null, 2));
  console.log(`Signed VSA (${report.verdict === "ADMIT" ? "PASSED" : "FAILED"}) -> ${out}`);
  process.exitCode = report.verdict === "ADMIT" ? 0 : 1;
}
