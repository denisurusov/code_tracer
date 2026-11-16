#!/usr/bin/env node
// Text evidence record. Reads the evidence bundle (out/evidence.intoto.jsonl),
// the gate report and the VSA, and writes EVIDENCE.md: one row per evidence
// category with its format and a text version of the evidence (result, signer,
// hashes, paths to the binaries), followed by every referenced file and the
// signers' public keys, so the record can be checked against the binaries
// without the gate's own state.
//
//   node evidence/manifest.mjs [--out EVIDENCE.md]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { BUNDLE_NAME, readBundle } from "./lib/bundle.mjs";
import { cosignVersion, statementOf } from "./lib/cosign.mjs";
import { fileDigest } from "./lib/digest.mjs";
import { loadCatalog } from "./lib/catalog.mjs";
import { SOURCE_URI } from "./lib/statement.mjs";

const { values } = parseArgs({ options: { out: { type: "string", default: "EVIDENCE.md" } } });
const catalog = loadCatalog();
const trust = JSON.parse(readFileSync(".keys/trust.json", "utf8"));
const bundles = readBundle(`out/${BUNDLE_NAME}`);
const gate = existsSync("out/gate-report.json") ? JSON.parse(readFileSync("out/gate-report.json", "utf8")) : null;
const jarPurl = `${catalog.product.purl}?type=jar`;
const jarPath = `out/artifacts/${catalog.product.artifact.split("/").pop()}`;
const short = (h) => (h ? `\`sha256:${h}\`` : "—");
const code = (s) => `\`${s}\``;
const order = ["build", "unit", "integration", "contract", "uat", "e2e", "accessibility", "load", "sast", "secrets", "sca",
  "license", "data-quality", "ux-signoff", "uat-signoff"];

// Files on disk named by the bundle, keyed by category.
const bundleFiles = Object.fromEntries(order.map((c) => [c, `out/attestations/${c}.sigstore.json`]));

const FORMAT = {
  build: "SLSA provenance v1",
  unit: "in-toto test-result · CTRF (from JUnit XML)",
  integration: "in-toto test-result · CTRF (from JUnit XML) · Cucumber Messages",
  contract: "in-toto test-result · CTRF (from JUnit XML) · Cucumber Messages",
  uat: "in-toto test-result · CTRF (from JUnit XML) · Cucumber Messages",
  e2e: "in-toto test-result · CTRF (from JUnit XML)",
  accessibility: "in-toto test-result · CTRF · SARIF (axe-core)",
  load: "in-toto test-result · CTRF · autocannon JSON · environment spec JSON",
  sast: "in-toto test-result · CTRF · SARIF (semgrep)",
  secrets: "in-toto test-result · CTRF · SARIF (gitleaks)",
  sca: "in-toto test-result · CTRF · SARIF · OSV records · OpenVEX",
  license: "in-toto test-result · CTRF · SARIF · CycloneDX SBOM",
  "data-quality": "in-toto test-result · CTRF (from JUnit XML)",
  "ux-signoff": "in-toto test-result (named sign-off) · findings document",
  "uat-signoff": "in-toto test-result (named sign-off) · notes document",
};

const rows = [];
const files = new Map(); // path -> { sha256, roles:Set, categories:Set }
const addFile = (path, sha, role, category) => {
  const f = files.get(path) ?? { sha256: sha, roles: new Set(), categories: new Set() };
  f.roles.add(role);
  f.categories.add(category);
  files.set(path, f);
};
const signers = new Map();

for (const bundle of bundles) {
  const st = statementOf(bundle);
  const p = st.predicate;
  const isProv = st.predicateType === "https://slsa.dev/provenance/v1";
  const category = isProv ? "build" : p["x-code-tracer"].category;
  const t = trust[bundle.verificationMaterial?.publicKey?.hint];
  const signer = t ? `${t.identity.id} (${t.identity.name})` : `unknown key ${bundle.verificationMaterial?.publicKey?.hint}`;
  if (t) signers.set(t.identity.id, { ...t, hint: bundle.verificationMaterial.publicKey.hint });
  const bundlePath = bundleFiles[category];
  const bundleSha = existsSync(bundlePath) ? fileDigest(bundlePath) : null;
  const jar = st.subject.find((s) => s.name === jarPurl)?.digest?.sha256;
  const src = st.subject.find((s) => s.name === SOURCE_URI)?.digest;

  const lines = [];
  if (isProv) {
    const dep = p.buildDefinition.resolvedDependencies.find((d) => d.uri === SOURCE_URI)?.digest ?? {};
    lines.push(`built ${code(jarPath)} ${short(jar)}`);
    lines.push(`from source ${short(dep.sha256)}${dep.gitCommit ? ` (git ${dep.gitCommit.slice(0, 12)})` : ""}`);
    lines.push(`command ${code(p.buildDefinition.externalParameters.command)}; ${p.buildDefinition.internalParameters.javac}; ${p.buildDefinition.internalParameters.maven.split(" (")[0]}`);
    lines.push(`builder ${p.runDetails.builder.id}`);
  } else {
    lines.push(`**${p.result}** — ${p.passedTests.length} passed, ${p.warnedTests.length} warned, ${p.failedTests.length} failed`);
    if (p.failedTests.length) lines.push(`failed: ${p.failedTests.join(", ")}`);
    if (p.warnedTests.length) lines.push(`warned: ${p.warnedTests.join(", ")}`);
    const reviewer = p["x-code-tracer"].reviewer;
    if (reviewer) lines.push(`reviewer ${reviewer.name}, ${reviewer.role}`);
    for (const d of p.configuration ?? []) {
      addFile(d.name, d.digest.sha256, d.annotations?.role, category);
      if (["report", "environment-spec", "advisory-snapshot"].includes(d.annotations?.role)) {
        lines.push(`${d.annotations.role}${d.annotations.format ? ` (${d.annotations.format})` : ""}: ${code(d.name)} ${short(d.digest.sha256)}${d.annotations.uri ? ` from ${d.annotations.uri}` : ""}`);
      }
    }
    const vex = p["x-code-tracer"].vexApplied ?? [];
    if (vex.length) lines.push(`VEX applied: ${vex.map((v) => `${v.vulnerability} on ${v.subcomponent} ${v.status}`).join("; ")}`);
    lines.push(`tested jar ${short(jar)}, source ${short(src?.sha256)}`);
  }
  lines.push(`signed by ${signer}`);
  lines.push(`bundle ${code(bundlePath)} ${short(bundleSha)}`);
  rows.push({ category, format: `Sigstore bundle (cosign) · ${FORMAT[category] ?? st.predicateType}`, evidence: lines.join("<br>") });
}
rows.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

const vsaPath = "out/vsa.sigstore.json";
const jarSha = existsSync(jarPath) ? fileDigest(jarPath) : null;
const anyTest = bundles.map(statementOf).find((s) => s.predicateType !== "https://slsa.dev/provenance/v1");
const srcSubject = anyTest?.subject.find((s) => s.name === SOURCE_URI)?.digest ?? {};
const runUrl = anyTest?.predicate.url ?? "—";
const ciArtifact = process.env.GITHUB_RUN_ID
  ? `GitHub Actions artifact \`test-evidence\` of [run ${process.env.GITHUB_RUN_ID}](${runUrl}), with the same paths under \`out/\`; kept for the repository's artifact retention period`
  : "local run: `demo/out/` on the machine that ran it (not committed)";

const md = [];
md.push("# Test evidence record");
md.push("");
md.push(`Generated by \`npm run manifest\` from \`out/${BUNDLE_NAME}\` on ${new Date().toISOString()}. Every attestation is a Sigstore bundle made with cosign ${cosignVersion()} (key-based, offline signing config: no Fulcio certificate, no Rekor entry, no timestamp authority). Paths are relative to \`demo/\`.`);
md.push("");
md.push("## Product");
md.push("");
md.push("| | |");
md.push("|---|---|");
md.push(`| Package | ${code(jarPurl)} |`);
md.push(`| Delivered jar | ${code(jarPath)} ${short(jarSha)} |`);
md.push(`| Source | ${code(SOURCE_URI)} ${short(srcSubject.sha256)}${srcSubject.gitCommit ? `, git commit ${code(srcSubject.gitCommit)}` : " (working tree differed from a commit)"} |`);
md.push(`| Run | ${runUrl} |`);
md.push(`| Where the binaries are | ${ciArtifact} |`);
md.push(`| Evidence bundle | ${code(`out/${BUNDLE_NAME}`)} ${short(existsSync(`out/${BUNDLE_NAME}`) ? fileDigest(`out/${BUNDLE_NAME}`) : null)} (${bundles.length} Sigstore bundles, one per line) |`);
if (gate) {
  md.push(`| Gate verdict | **${gate.verdict}** for ${gate.productType}${gate.failures.length ? ` — failed: ${gate.failures.map((f) => `${f.rule} ${f.name} [${f.category}]`).join("; ")}` : ""} |`);
  md.push(`| Gate rebuild | ${gate.rebuildDigest ? `${short(gate.rebuildDigest)} (${gate.rebuildDigest === jarSha ? "matches the delivered jar" : "differs from the delivered jar"})` : "not run"} |`);
  md.push(`| VSA | ${code(vsaPath)} ${short(existsSync(vsaPath) ? fileDigest(vsaPath) : null)}, signed by bank-gate |`);
}
md.push("");
md.push("## Evidence by category");
md.push("");
md.push("| Evidence category | Format | Evidence |");
md.push("|---|---|---|");
for (const r of rows) md.push(`| ${r.category} | ${r.format} | ${r.evidence} |`);
md.push("");
md.push("## Files referenced by the attestations");
md.push("");
md.push("| Path | sha256 | Role | Categories |");
md.push("|---|---|---|---|");
for (const [path, f] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
  md.push(`| ${code(path)} | \`${f.sha256}\` | ${[...f.roles].join(", ")} | ${[...f.categories].join(", ")} |`);
}
md.push("");
md.push("## Signers");
md.push("");
md.push("Public keys of the identities that signed this run. The key hint is the one cosign writes into each bundle (`verificationMaterial.publicKey.hint`).");
md.push("");
md.push("| Identity | Stands for | Key hint |");
md.push("|---|---|---|");
for (const [id, t] of signers) md.push(`| ${id} | ${t.identity.name} | \`${t.hint}\` |`);
const gateT = Object.entries(trust).find(([, t]) => t.identity.id === "bank-gate");
if (gateT) md.push(`| bank-gate | ${gateT[1].identity.name} | \`${gateT[0]}\` |`);
md.push("");
for (const [id, t] of [...signers, ...(gateT ? [["bank-gate", gateT[1]]] : [])]) {
  md.push(`<details><summary>${id} public key</summary>`);
  md.push("");
  md.push("```");
  md.push(t.publicKeyPem.trim());
  md.push("```");
  md.push("");
  md.push("</details>");
  md.push("");
}
md.push("## How to check this record");
md.push("");
md.push("With the binaries from the location above, save a signer's public key from the section above as `<id>.pub`, then:");
md.push("");
md.push("```sh");
md.push(`sha256sum ${jarPath}                     # must equal the delivered jar hash above`);
md.push(`cosign verify-blob-attestation --key ci-pipeline.pub --insecure-ignore-tlog \\`);
md.push(`  --type https://in-toto.io/attestation/test-result/v0.1 \\`);
md.push(`  --bundle out/attestations/unit.sigstore.json ${jarPath}`);
md.push(`cosign verify-blob-attestation --key build-service.pub --insecure-ignore-tlog \\`);
md.push(`  --type https://slsa.dev/provenance/v1 --bundle out/attestations/build.sigstore.json ${jarPath}`);
md.push("npm run gate                           # every rule, including the rebuild");
md.push("```");
md.push("");

writeFileSync(values.out, md.join("\n"));
console.log(`wrote ${values.out}: ${rows.length} evidence categories, ${files.size} referenced files, ${signers.size} signers`);
