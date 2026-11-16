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
import { certificateIdentity, cosignVersion, rekorLogIndex, statementOf } from "./lib/cosign.mjs";
import { IDENTITIES } from "./lib/keys.mjs";
import { delivered } from "./lib/product.mjs";
import { fileDigest } from "./lib/digest.mjs";
import { loadCatalog } from "./lib/catalog.mjs";
import { SOURCE_URI } from "./lib/statement.mjs";

const { values } = parseArgs({ options: { out: { type: "string", default: "EVIDENCE.md" } } });
const catalog = loadCatalog();
const trust = JSON.parse(readFileSync(".keys/trust.json", "utf8"));
const bundles = readBundle(`out/${BUNDLE_NAME}`);
const gate = existsSync("out/gate-report.json") ? JSON.parse(readFileSync("out/gate-report.json", "utf8")) : null;
const jar = delivered();
const jarPurl = jar.jarPurl;
const jarPath = jar.path;
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
  const certId = certificateIdentity(bundle);
  const logIndex = rekorLogIndex(bundle);
  let signer;
  if (certId) {
    const id = Object.entries(IDENTITIES).find(([, x]) => x.keyless && new RegExp(x.keyless.identityRegexp).test(certId))?.[0] ?? "untrusted";
    signer = `${id} — keyless, certificate for ${code(certId)}${logIndex ? `, [Rekor entry ${logIndex}](https://search.sigstore.dev/?logIndex=${logIndex})` : ""}`;
    signers.set(id, { keyless: true, identity: { id, name: certId }, issuer: IDENTITIES[id]?.keyless?.issuer, identityRegexp: IDENTITIES[id]?.keyless?.identityRegexp });
  } else {
    const t = trust[bundle.verificationMaterial?.publicKey?.hint];
    signer = t ? `${t.identity.id} (${t.identity.name}) — cosign key` : `unknown key ${bundle.verificationMaterial?.publicKey?.hint}`;
    if (t) signers.set(t.identity.id, { ...t, hint: bundle.verificationMaterial.publicKey.hint });
  }
  const bundlePath = bundleFiles[category];
  const bundleSha = existsSync(bundlePath) ? fileDigest(bundlePath) : null;
  const jar = st.subject.find((s) => s.name === jarPurl)?.digest?.sha256;
  const src = st.subject.find((s) => s.name === SOURCE_URI)?.digest;

  const lines = [];
  if (isProv) {
    const dep = p.buildDefinition.resolvedDependencies.find((d) => d.uri === SOURCE_URI)?.digest ?? {};
    lines.push(`built ${code(jarPath)} ${short(jar)}`);
    lines.push(`from source ${short(dep.sha256)}${dep.gitCommit ? ` (git ${dep.gitCommit.slice(0, 12)})` : ""}`);
    const ip = p.buildDefinition.internalParameters;
    lines.push(ip.builder === "container" ? `in container ${code(ip.image)}` : `on the host (${ip.os})`);
    lines.push(`version ${p.buildDefinition.externalParameters.revision}; ${ip.javac}; ${ip.maven}`);
    lines.push(`builder ${p.runDetails.builder.id}`);
  } else {
    lines.push(`**${p.result}** — ${p.passedTests.length} passed, ${p.warnedTests.length} warned, ${p.failedTests.length} failed`);
    if (p.failedTests.length) lines.push(`failed: ${p.failedTests.join(", ")}`);
    if (p.warnedTests.length) lines.push(`warned: ${p.warnedTests.join(", ")}`);
    const reviewer = p["x-code-tracer"].reviewer;
    if (reviewer) lines.push(`reviewer ${reviewer.name}, ${reviewer.role}`);
    for (const d of p.configuration ?? []) {
      addFile(d.name, d.digest.sha256, d.annotations?.role, category);
      if (d.annotations?.role === "advisory-snapshot") {
        lines.push(`advisory snapshot (OSV): ${d.annotations.uri ?? code(d.name)} ${short(d.digest.sha256)}${d.annotations.retrievedOn ? `, retrieved ${d.annotations.retrievedOn}` : ""} — not retained; recorded by hash and URL`);
      } else if (["report", "environment-spec"].includes(d.annotations?.role)) {
        lines.push(`${d.annotations.role}${d.annotations.format ? ` (${d.annotations.format})` : ""}: ${code(d.name)} ${short(d.digest.sha256)}`);
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
const repo = process.env.DEMO_MAVEN_REPO_URL;
const gavPath = repo ? `${repo}/${jar.groupId.replaceAll(".", "/")}/${jar.artifactId}/${jar.version}/${jar.artifactId}-${jar.version}` : null;
const ciArtifact = [
  repo ? `Maven repository ${code(repo)} as ${code(`${jar.groupId}:${jar.artifactId}:${jar.version}`)}: [jar](${gavPath}.jar), [evidence sidecar](${gavPath}-evidence.intoto.jsonl) (classifier \`evidence\`), [this record](${gavPath}-evidence-record.md) (classifier \`evidence-record\`); reading needs a GitHub token with \`read:packages\`` : null,
  process.env.GITHUB_RUN_ID
    ? `GitHub Actions artifact \`test-evidence\` of [run ${process.env.GITHUB_RUN_ID}](${runUrl}) with every file under \`out/\`, kept 90 days`
    : "local run: `demo/out/` on the machine that ran it (not committed)",
].filter(Boolean).join("<br>");

const md = [];
md.push("# Test evidence record");
md.push("");
md.push(`Generated by \`npm run manifest\` from \`out/${BUNDLE_NAME}\` on ${new Date().toISOString()}. Every attestation is a Sigstore bundle made with cosign ${cosignVersion()}: ${[...signers.values()].some((t) => t.keyless) ? "workflow identities signed keyless (Fulcio certificate, Rekor entry); named reviewers and the gate signed with cosign keys" : "signed with cosign keys and an offline signing config (no Fulcio certificate, no Rekor entry)"}. Paths are relative to \`demo/\`.`);
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
md.push("| Identity | Signed as | How to verify |");
md.push("|---|---|---|");
for (const [id, t] of signers) {
  md.push(t.keyless
    ? `| ${id} | ${code(t.identity.name)} | keyless: \`--certificate-identity-regexp '${t.identityRegexp}' --certificate-oidc-issuer ${t.issuer}\` |`
    : `| ${id} | ${t.identity.name} | cosign key, hint \`${t.hint}\` (public key below) |`);
}
const gateT = Object.entries(trust).find(([, t]) => t.identity.id === "bank-gate");
if (gateT) md.push(`| bank-gate | ${gateT[1].identity.name} | \`${gateT[0]}\` |`);
md.push("");
for (const [id, t] of [...signers, ...(gateT ? [["bank-gate", gateT[1]]] : [])].filter(([, t]) => !t.keyless)) {
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
md.push("With the binaries from the location above:");
md.push("");
md.push("```sh");
md.push(`sha256sum ${jarPath}                     # must equal the delivered jar hash above`);
const verifyCmd = (id, type, file) => {
  const t = signers.get(id);
  const auth = t?.keyless ? `--certificate-identity-regexp '${t.identityRegexp}' --certificate-oidc-issuer ${t.issuer}` : `--key ${id}.pub --insecure-ignore-tlog`;
  md.push(`cosign verify-blob-attestation ${auth} \\`);
  md.push(`  --type ${type} --bundle out/attestations/${file} ${jarPath}`);
};
verifyCmd("ci-pipeline", "https://in-toto.io/attestation/test-result/v0.1", "unit.sigstore.json");
verifyCmd("build-service", "https://slsa.dev/provenance/v1", "build.sigstore.json");
md.push("npm run gate                           # every rule, including the rebuild");
md.push("```");
md.push("");

writeFileSync(values.out, md.join("\n"));
console.log(`wrote ${values.out}: ${rows.length} evidence categories, ${files.size} referenced files, ${signers.size} signers`);
