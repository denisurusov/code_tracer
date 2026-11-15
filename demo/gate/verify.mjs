#!/usr/bin/env node
// Bank ingestion gate for test evidence. Runs offline over:
//   - the cloned product source (to recompute the subject digest),
//   - the scenario files and catalog in the clone,
//   - the evidence directory (attestations + results) that came with it.
//
// Every refusal names the rule it failed. On success it signs a SLSA
// Verification Summary Attestation (VSA) with the gate's own key.
//
//   node gate/verify.mjs [--root .] [--evidence out] [--policy gate/policy.yaml] [--trust .keys/trust.json]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { fileDigest, sha256, sourceDigest } from "../evidence/lib/digest.mjs";
import { signEnvelope, verifyEnvelope } from "../evidence/lib/dsse.mjs";
import { TEST_RESULT_TYPE, STATEMENT_TYPE } from "../evidence/lib/statement.mjs";

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
};

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function verify({ root = ".", evidence = "out", policyPath = "gate/policy.yaml", trustPath = ".keys/trust.json" } = {}) {
  const policy = parse(readFileSync(join(root, policyPath), "utf8"));
  const trust = JSON.parse(readFileSync(join(root, trustPath), "utf8"));
  const catalog = parse(readFileSync(join(root, "tests/catalog.yaml"), "utf8"));
  const productType = catalog.product.type;
  const required = policy.product_types[productType] ?? [];
  const src = sourceDigest(root);
  const attDir = join(root, evidence, "attestations");
  const files = existsSync(attDir) ? readdirSync(attDir).filter((f) => f.endsWith(".dsse.json")).sort() : [];

  const checks = [];
  const fail = (category, rule, detail) => checks.push({ category, rule, name: RULES[rule], ok: false, detail });
  const pass = (category, rule) => checks.push({ category, rule, name: RULES[rule], ok: true });
  const seen = new Map();

  for (const f of files) {
    const envelope = JSON.parse(readFileSync(join(attDir, f), "utf8"));
    const v = verifyEnvelope(envelope, trust);
    const st = v.statement ?? {};
    const category = st.predicate?.["x-code-tracer"]?.category ?? f.replace(".dsse.json", "");
    const p = st.predicate ?? {};

    if (v.trusted === false) { fail(category, "G02", v.reason); continue; }
    pass(category, "G02");
    if (!v.ok) { fail(category, "G01", v.reason); continue; }
    pass(category, "G01");

    const catPolicy = policy.categories[category];
    if (!catPolicy) { fail(category, "G03", `no policy for category ${category}`); continue; }
    catPolicy.signers.includes(v.identity.id)
      ? pass(category, "G03")
      : fail(category, "G03", `${v.identity.id} (${v.identity.name}) may not sign ${category}; allowed: ${catPolicy.signers.join(", ")}`);

    st._type === STATEMENT_TYPE && st.predicateType === TEST_RESULT_TYPE
      ? pass(category, "G04") : fail(category, "G04", `predicateType ${st.predicateType}`);

    const subj = st.subject?.[0]?.digest?.sha256;
    subj === src.digest ? pass(category, "G05") : fail(category, "G05", `attested ${subj}, clone has ${src.digest}`);

    // Every configuration descriptor must match the file in the clone or evidence dir.
    const byRole = (role) => (p.configuration ?? []).filter((d) => d.annotations?.role === role);
    const mismatches = (ds) => ds.flatMap((d) => {
      const path = join(root, d.name);
      if (!existsSync(path)) return [`${d.name}: missing`];
      const actual = fileDigest(path);
      return actual === d.digest.sha256 ? [] : [`${d.name}: digest differs`];
    });
    const catD = byRole("catalog");
    const catM = mismatches(catD);
    if (catD.length === 0) fail(category, "G06", "no catalog descriptor");
    else catM.length ? fail(category, "G06", catM.join("; ")) : pass(category, "G06");
    const scM = mismatches(byRole("scenario"));
    scM.length ? fail(category, "G07", scM.join("; ")) : pass(category, "G07");
    const rpM = mismatches([...byRole("report"), ...byRole("environment-spec")]);
    rpM.length ? fail(category, "G08", rpM.join("; ")) : pass(category, "G08");

    const ids = catalog.tests.filter((t) => t.category === category).map((t) => t.id);
    const reported = new Set([...(p.passedTests ?? []), ...(p.warnedTests ?? []), ...(p.failedTests ?? [])]);
    const missing = ids.filter((id) => !reported.has(id));
    missing.length ? fail(category, "G09", `not reported: ${missing.join(", ")}`) : pass(category, "G09");

    const okResults = catPolicy.allow_warned ? ["PASSED", "WARNED"] : ["PASSED"];
    const resultOk = okResults.includes(p.result) && (p.failedTests ?? []).length === 0 && (catPolicy.allow_warned || (p.warnedTests ?? []).length === 0);
    resultOk ? pass(category, "G10") : fail(category, "G10", `result ${p.result}; failed: ${(p.failedTests ?? []).join(", ") || "none"}; warned: ${(p.warnedTests ?? []).join(", ") || "none"}`);

    if (catPolicy.environment_spec_required_fields) {
      const d = byRole("environment-spec")[0];
      if (!d || !existsSync(join(root, d.name))) fail(category, "G11", "no environment spec");
      else {
        const spec = JSON.parse(readFileSync(join(root, d.name), "utf8"));
        const absent = catPolicy.environment_spec_required_fields.filter((k) => { const x = get(spec, k); return x === undefined || x === null || x === ""; });
        const wrongSut = spec.system_under_test?.source_digest !== `sha256:${src.digest}`;
        absent.length || wrongSut
          ? fail(category, "G11", [absent.length && `missing: ${absent.join(", ")}`, wrongSut && "spec describes a different source digest"].filter(Boolean).join("; "))
          : pass(category, "G11");
      }
    }
    seen.set(category, { file: f, digest: sha256(readFileSync(join(attDir, f))), signer: v.identity });
  }

  const absent = required.filter((c) => !seen.has(c));
  absent.length ? fail("*", "G12", `missing for ${productType}: ${absent.join(", ")}`) : pass("*", "G12");

  const failures = checks.filter((c) => !c.ok);
  return {
    verdict: failures.length ? "REFUSE" : "ADMIT",
    productType, required, sourceDigest: src.digest,
    categories: [...seen.keys()], attestations: Object.fromEntries(seen), checks, failures,
  };
}

export function vsa(report, { root = ".", evidence = "out", policyPath = "gate/policy.yaml" } = {}) {
  return {
    _type: STATEMENT_TYPE,
    subject: [{ name: "fx-quote-demo/source", digest: { sha256: report.sourceDigest } }],
    predicateType: "https://slsa.dev/verification_summary/v1",
    predicate: {
      verifier: { id: "https://example.com/bank/ingestion-gate/demo" },
      timeVerified: new Date().toISOString(),
      resourceUri: "git+https://github.com/denisurusov/code_tracer#demo/product",
      policy: { uri: policyPath, digest: { sha256: fileDigest(join(root, policyPath)) } },
      inputAttestations: Object.values(report.attestations).map((a) => ({ uri: `${evidence}/attestations/${a.file}`, digest: { sha256: a.digest } })),
      verificationResult: report.verdict === "ADMIT" ? "PASSED" : "FAILED",
      verifiedLevels: [],
      "x-code-tracer": { productType: report.productType, categories: report.categories, failedRules: report.failures.map((f) => `${f.rule} ${f.name} [${f.category}]`) },
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
  console.log(`\nVerdict for ${r.productType}: ${r.verdict}`);
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
