// One entry per test category: how to run it, and how to turn its native output
// into CTRF tests (for the attestation) plus report files (kept and digested).
//
// evaluate() returns { tests: CTRF tests, reports: [paths], tool, idOf?, extra? }.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadCatalog } from "./lib/catalog.mjs";
import { mkdirSync } from "node:fs";
import { ID_RE, junitToCtrfTests, ctrfReport, npmAuditToSarif, npmAuditToOsv, applyVex, axeToSarif, sarifResults, sarifLog } from "./lib/convert.mjs";

const raw = (c, f = "") => `out/raw/${c}${f ? "/" + f : ""}`;
const version = (pkg) => JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, "utf8")).version;
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", ...opts });
const idFromName = (t) => t.extra?.id ?? t.name?.match(ID_RE)?.[1];
const write = (path, obj) => (writeFileSync(path, JSON.stringify(obj, null, 2)), path);
const ctrfFromJunit = (c, tool) => ({ tests: junitToCtrfTests(readFileSync(raw(c, "junit.xml"), "utf8")), tool });

// Turn SARIF findings into one CTRF test per catalog ID, using `match(result, id)`.
function checksFromSarif(ids, sarif, match, warnOnly = () => false) {
  const results = sarifResults(sarif).filter((r) => !r.suppressions?.length);
  return ids.map((id) => {
    const hits = results.filter((r) => match(r, id));
    const warn = hits.length > 0 && hits.every((r) => warnOnly(r, id));
    return {
      name: `${id} ${hits.length} finding(s)`,
      status: hits.length === 0 || warn ? "passed" : "failed",
      duration: 0,
      ...(hits.length ? { message: hits.map((h) => h.message.text).join("; ").slice(0, 500) } : {}),
      extra: { id, findings: hits.length, ...(warn ? { outcome: "warned" } : {}) },
    };
  });
}

const node = process.execPath;
const bin = (name) => `node_modules/.bin/${name}`;

export const CATEGORIES = {
  unit: {
    signer: "ci-pipeline",
    run: () => run(node, ["--test", "--test-reporter=spec", "--test-reporter-destination=stdout",
      "--test-reporter=junit", `--test-reporter-destination=${raw("unit", "junit.xml")}`, "tests/unit/quote.test.mjs"]),
    evaluate: () => ({ ...ctrfFromJunit("unit", { name: "node:test", version: process.version }), reports: [] }),
  },

  integration: {
    signer: "ci-pipeline",
    run: () => run(bin("cucumber-js"), ["-p", "integration"]),
    evaluate: () => ({ ...ctrfFromJunit("integration", { name: "cucumber-js", version: version("@cucumber/cucumber") }),
      reports: [raw("integration", "messages.ndjson")] }),
  },

  contract: {
    signer: "ci-pipeline",
    run: () => run(bin("cucumber-js"), ["-p", "contract"]),
    evaluate: () => ({ ...ctrfFromJunit("contract", { name: "cucumber-js", version: version("@cucumber/cucumber") }),
      reports: [raw("contract", "messages.ndjson")], extraConfig: ["product/openapi.json"] }),
  },

  e2e: {
    signer: "ci-pipeline",
    run: () => run(bin("playwright"), ["test", "tests/e2e", "--reporter=list,junit"],
      { env: { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: raw("e2e", "junit.xml") } }),
    evaluate: () => ({ ...ctrfFromJunit("e2e", { name: "playwright", version: version("@playwright/test") }), reports: [] }),
  },

  uat: {
    signer: "ci-pipeline",
    run: () => run(bin("cucumber-js"), ["-p", "uat"]),
    evaluate: () => ({ ...ctrfFromJunit("uat", { name: "cucumber-js + playwright", version: version("@cucumber/cucumber") }),
      reports: [raw("uat", "messages.ndjson")] }),
  },

  accessibility: {
    signer: "ci-pipeline",
    run: () => run(bin("playwright"), ["test", "tests/a11y", "--reporter=list,junit"],
      { env: { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: raw("accessibility", "junit.xml") } }),
    evaluate: () => {
      const files = readdirSync(raw("accessibility")).filter((f) => f.startsWith("axe-")).map((f) => raw("accessibility", f));
      const sarif = write(raw("accessibility", "axe.sarif"), axeToSarif(files, version("axe-core")));
      return { ...ctrfFromJunit("accessibility", { name: "playwright + axe-core", version: version("axe-core") }), reports: [sarif] };
    },
  },

  load: {
    signer: "perf-env",
    run: () => run(node, ["tests/load/load.mjs"]),
    evaluate: () => ({
      tests: JSON.parse(readFileSync(raw("load", "ctrf.json"), "utf8")).results.tests,
      tool: { name: "autocannon", version: version("autocannon") },
      reports: [raw("load", "autocannon.json")],
      environmentSpec: raw("load", "env-spec.json"),
      extraConfig: ["tests/load/profile.yaml", "tests/load/env-spec.base.yaml"],
    }),
  },

  sast: {
    signer: "ci-pipeline",
    run: () => run("semgrep", ["scan", "--config", "tests/sast/rules.yml", "--sarif", "--output", raw("sast", "semgrep.sarif"),
      "--metrics=off", "--disable-version-check", "--quiet", "product"]),
    evaluate: ({ ids }) => {
      const sarif = JSON.parse(readFileSync(raw("sast", "semgrep.sarif"), "utf8"));
      const v = execFileSync("semgrep", ["--version"], { encoding: "utf8" }).trim();
      return { tests: checksFromSarif(ids, sarif, (r, id) => r.ruleId === id || r.ruleId.endsWith(`.${id}`)),
        tool: { name: "semgrep", version: v }, reports: [raw("sast", "semgrep.sarif")] };
    },
  },

  secrets: {
    signer: "ci-pipeline",
    run: () => run("gitleaks", ["dir", "product", "--config", "tests/secrets/gitleaks.toml", "--report-format", "sarif",
      "--report-path", raw("secrets", "gitleaks.sarif"), "--exit-code", "0", "--no-banner"]),
    evaluate: ({ ids }) => {
      const sarif = JSON.parse(readFileSync(raw("secrets", "gitleaks.sarif"), "utf8"));
      const v = execFileSync("gitleaks", ["version"], { encoding: "utf8" }).trim();
      return { tests: checksFromSarif(ids, sarif, () => true), tool: { name: "gitleaks", version: v },
        reports: [raw("secrets", "gitleaks.sarif")] };
    },
  },

  sca: {
    signer: "ci-pipeline",
    // DEMO_AUDIT_FIXTURE replaces the live npm audit with a recorded report (used by the gate's VEX cases).
    run: () => {
      const fixture = process.env.DEMO_AUDIT_FIXTURE;
      const out = fixture ? readFileSync(fixture, "utf8") : spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" }).stdout;
      writeFileSync(raw("sca", "npm-audit.json"), out);
      return { status: 0 };
    },
    evaluate: ({ ids }) => {
      const policy = JSON.parse(readFileSync("tests/sca/policy.json", "utf8")).checks;
      const npmV = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
      const audit = JSON.parse(readFileSync(raw("sca", "npm-audit.json"), "utf8"));

      // OSV records, one file per advisory, kept as reports.
      mkdirSync(raw("sca", "osv"), { recursive: true });
      const osvFiles = npmAuditToOsv(audit).map((rec) => write(raw("sca", `osv/${rec.id}.json`), rec));

      // SARIF findings with purls, then OpenVEX suppressions.
      const sarif = npmAuditToSarif(audit, npmV);
      const vexPath = process.env.DEMO_VEX ?? "tests/sca/vex.openvex.json";
      const vexApplied = applyVex(sarif, JSON.parse(readFileSync(vexPath, "utf8")), loadCatalog().product.purl);
      const path = write(raw("sca", "npm-audit.sarif"), sarif);

      const sev = (r) => r.properties.severity;
      const tests = checksFromSarif(ids, sarif,
        (r, id) => (policy[id].fail_on ?? policy[id].warn_on).includes(sev(r)),
        (r, id) => (policy[id].warn_on ?? []).includes(sev(r)));
      return { tests, tool: { name: "npm audit", version: npmV }, reports: [path, raw("sca", "npm-audit.json"), ...osvFiles],
        vex: vexPath, extra: { vexApplied } };
    },
  },

  license: {
    signer: "ci-pipeline",
    run: () => run(bin("cyclonedx-npm"), ["--omit", "dev", "--output-format", "JSON", "--output-file", raw("license", "sbom.cdx.json")]),
    evaluate: () => {
      const allowed = JSON.parse(readFileSync("tests/license/allowlist.json", "utf8")).allowed;
      const tree = JSON.parse(execFileSync("npm", ["ls", "--omit=dev", "--all", "--json", "--long"], { encoding: "utf8" }));
      const pkgs = new Map();
      (function collect(deps = {}) {
        for (const [name, d] of Object.entries(deps)) {
          if (!d.version) continue;
          pkgs.set(`${name}@${d.version}`, { name, path: d.path });
          collect(d.dependencies);
        }
      })(tree.dependencies);
      const rules = [{ id: "LIC-001", shortDescription: { text: "License not on allowlist" } }];
      const results = [];
      for (const [key, { path }] of pkgs) {
        const lic = JSON.parse(readFileSync(`${path}/package.json`, "utf8")).license ?? "UNKNOWN";
        if (!allowed.includes(lic)) {
          results.push({ ruleId: "LIC-001", level: "error", message: { text: `${key} is licensed ${lic}` },
            locations: [{ physicalLocation: { artifactLocation: { uri: `${path.slice(process.cwd().length + 1)}/package.json` } } }] });
        }
      }
      const sarifPath = write(raw("license", "licenses.sarif"), sarifLog("license-allowlist (demo)", "1", rules, results));
      const sbom = JSON.parse(readFileSync(raw("license", "sbom.cdx.json"), "utf8"));
      const inSbom = new Set((sbom.components ?? []).map((c) => `${c.group ? c.group + "/" : ""}${c.name}@${c.version}`));
      const absent = [...pkgs.keys()].filter((k) => !inSbom.has(k));
      const productPurl = loadCatalog().product.purl;
      const sbomPurl = sbom.metadata?.component?.purl;
      const purlProblem = sbomPurl === productPurl ? null : `SBOM identifies the product as ${sbomPurl}, catalog says ${productPurl}`;
      return {
        tool: { name: "cyclonedx-npm + license-allowlist", version: version("@cyclonedx/cyclonedx-npm") },
        reports: [sarifPath, raw("license", "sbom.cdx.json")],
        tests: [
          { name: `LIC-001 ${results.length} disallowed license(s)`, status: results.length ? "failed" : "passed", duration: 0,
            ...(results.length ? { message: results.map((r) => r.message.text).join("; ") } : {}), extra: { id: "LIC-001" } },
          { name: `LIC-002 SBOM for ${sbomPurl} lists ${pkgs.size - absent.length}/${pkgs.size} runtime packages`,
            status: absent.length || purlProblem ? "failed" : "passed", duration: 0,
            ...(absent.length || purlProblem ? { message: [purlProblem, absent.length && `missing from SBOM: ${absent.join(", ")}`].filter(Boolean).join("; ") } : {}),
            extra: { id: "LIC-002", sbomPurl } },
        ],
      };
    },
  },

  "data-quality": {
    signer: "ci-pipeline",
    run: () => run(node, ["--test", "--test-reporter=spec", "--test-reporter-destination=stdout",
      "--test-reporter=junit", `--test-reporter-destination=${raw("data-quality", "junit.xml")}`, "tests/data/rates.rules.mjs"]),
    evaluate: () => ({ ...ctrfFromJunit("data-quality", { name: "node:test", version: process.version }),
      reports: [], extraConfig: ["product/data/rates.json"] }),
  },
};

export const AUTOMATED = Object.keys(CATEGORIES);
export const SIGNOFF_CATEGORIES = ["ux-signoff", "uat-signoff"];
export { idFromName, ctrfReport };
