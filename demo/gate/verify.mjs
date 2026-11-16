#!/usr/bin/env node
// Bank ingestion gate for test evidence. Runs offline over:
//   - the cloned product source (to recompute the subject digest),
//   - the scenario files, catalog and VEX document in the clone,
//   - the evidence bundle (out/evidence.intoto.jsonl) and result files that came with it.
//
// Two layers, as in the architecture:
//   structural  (this file)          signatures, signer identity, purl + digest binding, file digests,
//                                    build provenance, and a rebuild of the jar from the clone
//   semantic    (gate/policy/*.rego) coverage, results, environment spec, required categories, VEX
//
// Every refusal names the rule it failed. The gate signs a SLSA VSA either way.
//
//   node gate/verify.mjs [--root .] [--evidence out] [--policy gate/policy.yaml] [--trust .keys/trust.json] [--no-rebuild]
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { fileDigest, sha256, sourceDigest } from "../evidence/lib/digest.mjs";
import { certificateIdentity, statementOf, verifyBundle } from "../evidence/lib/cosign.mjs";
import { signStatement } from "../evidence/lib/signing.mjs";
import { ensureKeys, IDENTITIES, identityRegexp } from "../evidence/lib/keys.mjs";
import { delivered } from "../evidence/lib/product.mjs";
import { mavenBuild } from "../evidence/lib/maven-build.mjs";
import { TEST_RESULT_TYPE, STATEMENT_TYPE, SOURCE_URI } from "../evidence/lib/statement.mjs";

const PROVENANCE_TYPE = "https://slsa.dev/provenance/v1";
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
  G14: "provenance-consistent",
  G15: "rebuild-matches",
  G16: "toolchain-pinned",
};
const SEMANTIC = ["G09", "G10", "G11", "G12", "G13"];
const POLICY_DIR = fileURLToPath(new URL("./policy", import.meta.url));

function evalRego(input) {
  const out = execFileSync("opa", ["eval", "--v1-compatible", "--format", "json", "--data", POLICY_DIR, "--stdin-input", "data.codetracer.gate.deny"],
    { input: JSON.stringify(input), encoding: "utf8" });
  return JSON.parse(out).result?.[0]?.expressions?.[0]?.value ?? [];
}

/**
 * Rebuild the jar from the clone's product/ (excluding target/) in a scratch
 * directory, with the version and build image the provenance names, offline
 * against the local Maven repository (the bank's own mirror), and return its
 * sha256. Digest equality is what makes the provider's build claim checkable
 * (Reproducible Builds).
 */
export function rebuildJar(root, { revision, image, artifactId }) {
  const work = mkdtempSync(join(tmpdir(), "gate-rebuild-"));
  try {
    cpSync(join(root, "product"), join(work, "product"), { recursive: true, filter: (p) => !p.includes(`${join(root, "product", "target")}`) });
    // Offline against the local repository by default (the bank's own mirror). CI
    // sets DEMO_REBUILD_OFFLINE=0: there Maven Central stands in for the mirror.
    const offline = process.env.DEMO_REBUILD_OFFLINE !== "0";
    const b = mavenBuild({ root: work, revision, image, offline, allowHost: !image, artifactId });
    if (b.error) return { error: `rebuild failed: ${b.error}` };
    return { digest: fileDigest(b.jar), builder: b.builder };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const pomCoordinates = (pom) => {
  const top = pom.replace(/<parent>[\s\S]*?<\/parent>/, "").replace(/<dependencies>[\s\S]*$/, "");
  const tag = (t) => top.match(new RegExp(`<${t}>([^<]+)</${t}>`))?.[1];
  return { groupId: tag("groupId"), artifactId: tag("artifactId"), version: tag("version") };
};

export function verify({ root = ".", evidence = "out", policyPath = "gate/policy.yaml", trustPath = ".keys/trust.json", rebuild = true } = {}) {
  const policy = parse(readFileSync(join(root, policyPath), "utf8"));
  const trust = JSON.parse(readFileSync(join(root, trustPath), "utf8"));
  const catalog = parse(readFileSync(join(root, "tests/catalog.yaml"), "utf8"));
  const coords = pomCoordinates(readFileSync(join(root, "product/pom.xml"), "utf8"));
  const jar = delivered(root);
  const productPurl = jar?.purl ?? `${catalog.product.purl}@unknown`;
  const jarPurl = jar?.jarPurl ?? `${productPurl}?type=jar`;
  const deliveredDigest = jar ? fileDigest(jar.path) : null;
  const allowHost = process.env.DEMO_ALLOW_HOST_BUILD === "1";
  const profile = process.env.DEMO_GATE_PROFILE ?? "release";
  const trustedRefs = policy.trusted_refs?.[profile];
  if (!trustedRefs) throw new Error(`no trusted_refs for gate profile ${profile}`);
  // Which workflow a certificate is for (any ref), and whether its ref is trusted.
  const workflowOf = (certId) => Object.entries(IDENTITIES).find(([, x]) => x.keyless && certId.startsWith(`${x.keyless.workflow}@`));
  const src = sourceDigest(root);
  const bundlePath = join(root, evidence, BUNDLE_NAME);
  const bundles = readBundle(bundlePath);

  const checks = [];
  const fail = (category, rule, detail) => checks.push({ category, rule, name: RULES[rule], ok: false, detail });
  const pass = (category, rule) => checks.push({ category, rule, name: RULES[rule], ok: true });
  const admitted = []; // attestations that passed G01/G02, handed to the semantic layer
  const seen = new Map();

  // The catalog's purl must name this Maven project, or the subject binding means nothing.
  const expectedPurl = `pkg:maven/${coords.groupId}/${coords.artifactId}`;
  if (catalog.product.purl !== expectedPurl) fail("*", "G05", `catalog purl ${catalog.product.purl} does not match product/pom.xml (${expectedPurl})`);
  if (!deliveredDigest) fail("*", "G05", `no delivered jar in ${join(evidence, "artifacts")}`);
  let provenance = null;
  let report_rebuild = null;
  const testJarDigests = [];

  bundles.forEach((bundle, i) => {
    const st = statementOf(bundle) ?? {};
    const p = st.predicate ?? {};
    const isProvenance = st.predicateType === PROVENANCE_TYPE;
    const category = isProvenance ? "build" : p["x-code-tracer"]?.category ?? `#${i}`;

    // G02: a keyless bundle's certificate identity must match a trusted workflow
    // identity; a key-signed bundle's key hint must be in the trust store.
    const certId = certificateIdentity(bundle);
    let trusted;
    if (certId) {
      const id = workflowOf(certId);
      if (!id) return fail(category, "G02", `certificate identity ${certId} is not a trusted workflow`);
      const re = identityRegexp(id[1].keyless, trustedRefs);
      if (!new RegExp(re).test(certId)) {
        return fail(category, "G02", `${certId} ran from a ref the ${profile} profile does not trust (${trustedRefs.join(", ")})`);
      }
      trusted = { identity: { id: id[0], ...id[1], certificateIdentity: certId },
        keyless: { issuer: id[1].keyless.issuer, identityRegexp: re } };
    } else {
      const hint = bundle.verificationMaterial?.publicKey?.hint;
      trusted = hint && trust[hint];
      if (!trusted) return fail(category, "G02", `unknown key ${hint ?? "(no key hint)"}`);
    }
    pass(category, "G02");
    const v = { identity: trusted.identity };

    // G01: cosign verifies the signature over the statement, its predicate type,
    // and that the jar digest the statement names is one of its subjects.
    const subjectDigest = (st.subject ?? []).find((x) => x.name === jarPurl)?.digest?.sha256 ?? st.subject?.[0]?.digest?.sha256;
    const tmp = mkdtempSync(join(tmpdir(), "gate-bundle-"));
    const bundleFile = join(tmp, "bundle.sigstore.json");
    writeFileSync(bundleFile, JSON.stringify(bundle));
    const cv = subjectDigest ? verifyBundle(bundleFile, trusted.publicKeyPem, st.predicateType, subjectDigest, trusted.keyless) : { ok: false, reason: "statement has no subject" };
    rmSync(tmp, { recursive: true, force: true });
    if (!cv.ok) return fail(category, "G01", `cosign verify-blob-attestation: ${cv.reason}`);
    pass(category, "G01");

    const catPolicy = policy.categories[category];
    if (!catPolicy) fail(category, "G03", `no policy for category ${category}`);
    else catPolicy.signers.includes(v.identity.id)
      ? pass(category, "G03")
      : fail(category, "G03", `${v.identity.id} (${v.identity.name}) may not sign ${category}; allowed: ${catPolicy.signers.join(", ")}`);

    const expectedType = catPolicy?.predicate_type ?? TEST_RESULT_TYPE;
    st._type === STATEMENT_TYPE && st.predicateType === expectedType
      ? pass(category, "G04") : fail(category, "G04", `predicateType ${st.predicateType}, expected ${expectedType}`);

    // Subjects: the delivered jar by purl, and (for test results) the source it was built from.
    const jarSubj = (st.subject ?? []).find((x) => x.name === jarPurl);
    const srcSubj = (st.subject ?? []).find((x) => x.name === SOURCE_URI);
    const subjectProblems = [
      !jarSubj && `no subject named ${jarPurl}`,
      jarSubj && deliveredDigest && jarSubj.digest?.sha256 !== deliveredDigest && `attested jar ${jarSubj.digest?.sha256}, delivered jar is ${deliveredDigest}`,
      !isProvenance && !srcSubj && `no subject named ${SOURCE_URI}`,
      srcSubj && srcSubj.digest?.sha256 !== src.digest && `attested source ${srcSubj.digest?.sha256}, clone has ${src.digest}`,
    ].filter(Boolean);
    subjectProblems.length ? fail(category, "G05", subjectProblems.join("; ")) : pass(category, "G05");

    if (isProvenance) {
      provenance = {
        jar: jarSubj?.digest?.sha256,
        source: (p.buildDefinition?.resolvedDependencies ?? []).find((d) => d.uri === SOURCE_URI)?.digest?.sha256,
        revision: p.buildDefinition?.externalParameters?.revision,
        builder: p.buildDefinition?.internalParameters?.builder,
        image: p.buildDefinition?.internalParameters?.image ?? null,
        allowedImages: catPolicy?.allowed_images ?? [],
      };
      admitted.push({ category, kind: "provenance", predicate: { passedTests: [], warnedTests: [], failedTests: [] } });
      seen.set(category, { index: i, digest: sha256(JSON.stringify(bundle)), signer: v.identity });
      return;
    }
    if (jarSubj) testJarDigests.push({ category, digest: jarSubj.digest?.sha256 });

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
      kind: "test-result",
      predicate: { passedTests: [], warnedTests: [], failedTests: [], ...p },
      environment_spec: readIfMatching(byRole("environment-spec")[0]),
      vex_document: readIfMatching(byRole("vex")[0]),
    });
    seen.set(category, { index: i, digest: sha256(JSON.stringify(bundle)), signer: v.identity });
  });

  // Build provenance: links the delivered jar, the source, and every test attestation.
  if (provenance) {
    const problems = [
      provenance.source !== src.digest && `provenance built from source ${provenance.source}, clone has ${src.digest}`,
      deliveredDigest && provenance.jar !== deliveredDigest && `provenance is for jar ${provenance.jar}, delivered jar is ${deliveredDigest}`,
      ...testJarDigests.filter((t) => t.digest !== provenance.jar).map((t) => `${t.category} tested jar ${t.digest}, provenance is for ${provenance.jar}`),
    ].filter(Boolean);
    problems.length ? fail("build", "G14", problems.join("; ")) : pass("build", "G14");

    // G16: the build ran in a container image the bank accepts (pinned by digest).
    const pinned = provenance.builder === "container" && provenance.allowedImages.includes(provenance.image);
    if (pinned) pass("build", "G16");
    else if (provenance.builder === "host" && allowHost) pass("build", "G16");
    else fail("build", "G16", provenance.builder === "container"
      ? `build image ${provenance.image} is not in the policy's allowed_images`
      : "built on the host, not in a pinned build image");

    // The bank's rebuild, with the provenance's version and image. `rebuild` may be
    // a precomputed digest (the negative cases reuse one rebuild).
    const rb = typeof rebuild === "string" ? { digest: rebuild }
      : rebuild ? rebuildJar(root, { revision: provenance.revision, image: provenance.image, artifactId: coords.artifactId }) : null;
    report_rebuild = rb?.digest ?? null;
    if (rb?.error) fail("build", "G15", rb.error);
    else if (rb) rb.digest === provenance.jar ? pass("build", "G15") : fail("build", "G15", `rebuilt jar ${rb.digest}, provenance says ${provenance.jar}`);
  }

  // Semantic layer: Rego.
  const denies = evalRego({ policy, catalog, source_digest: src.digest, artifact_digest: deliveredDigest, product_purl: productPurl, attestations: admitted });
  for (const d of denies) fail(d.category, d.rule, d.detail);
  const denied = new Set(denies.map((d) => `${d.rule}|${d.category}`));
  for (const a of admitted) for (const r of SEMANTIC) if (a.kind === "test-result" && r !== "G12" && !denied.has(`${r}|${a.category}`)) pass(a.category, r);
  if (!denied.has("G12|*")) pass("*", "G12");

  const failures = checks.filter((c) => !c.ok);
  return {
    verdict: failures.length ? "REFUSE" : "ADMIT",
    productType: catalog.product.type, profile, trustedRefs, productPurl, jarPurl, version: jar?.version, sourceDigest: src.digest, artifactDigest: deliveredDigest, rebuildDigest: report_rebuild,
    bundle: { path: join(evidence, BUNDLE_NAME), digest: existsSync(bundlePath) ? fileDigest(bundlePath) : null },
    categories: [...seen.keys()], attestations: Object.fromEntries(seen), checks, failures,
  };
}

export function vsa(report, { root = ".", policyPath = "gate/policy.yaml" } = {}) {
  return {
    _type: STATEMENT_TYPE,
    subject: [
      { name: report.jarPurl, digest: { sha256: report.artifactDigest } },
      { name: SOURCE_URI, digest: { sha256: report.sourceDigest } },
    ],
    predicateType: "https://slsa.dev/verification_summary/v1",
    predicate: {
      verifier: { id: "https://example.com/bank/ingestion-gate/demo" },
      timeVerified: new Date().toISOString(),
      resourceUri: report.jarPurl,
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
  console.log(`\nVerdict for ${r.productPurl} (${r.productType}, ${r.profile} profile): ${r.verdict}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { root: { type: "string", default: "." }, evidence: { type: "string", default: "out" },
    policy: { type: "string", default: "gate/policy.yaml" }, trust: { type: "string", default: ".keys/trust.json" },
    "no-rebuild": { type: "boolean", default: false }, "no-write": { type: "boolean", default: false } } });
  const opts = { root: values.root, evidence: values.evidence, policyPath: values.policy, trustPath: values.trust, rebuild: !values["no-rebuild"] };
  const report = verify(opts);
  printReport(report);
  if (values["no-write"]) { process.exitCode = report.verdict === "ADMIT" ? 0 : 1; process.exit(); }
  ensureKeys(join(values.root, ".keys"), ["bank-gate"]); // the gate's own key; trusts nothing new
  const out = join(values.root, values.evidence, "vsa.sigstore.json");
  signStatement(vsa(report, opts), "bank-gate", out, { keyDir: join(values.root, ".keys") });
  writeFileSync(join(values.root, values.evidence, "gate-report.json"), JSON.stringify(report, null, 2));
  console.log(`Signed VSA (${report.verdict === "ADMIT" ? "PASSED" : "FAILED"}) -> ${out}`);
  process.exitCode = report.verdict === "ADMIT" ? 0 : 1;
}
