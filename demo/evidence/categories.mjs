// One entry per test category: how to run it against the Java product, and how to
// turn its native output into CTRF tests (for the attestation) plus report files
// (kept and digested).
//
// evaluate() returns { tests, tool, reports, extraConfig?, environmentSpec?, vex?, snapshot?, extra? }.
//
// Run `npm run build` first: integration, contract, UAT, e2e, accessibility and
// load all run against the delivered jar in out/artifacts/.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCatalog } from "./lib/catalog.mjs";
import { ID_RE, junitToCtrfTests, ctrfReport, applyVex, axeToSarif, sarifResults, sarifLog } from "./lib/convert.mjs";
import { osvScan } from "./lib/osv.mjs";
import { ARTIFACT_PATH } from "./lib/statement.mjs";

const raw = (c, f = "") => `out/raw/${c}${f ? "/" + f : ""}`;
const npmVersion = (pkg) => JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, "utf8")).version;
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", ...opts });
const idFromName = (t) => t.extra?.id ?? t.name?.match(ID_RE)?.[1];
const write = (path, obj) => (writeFileSync(path, JSON.stringify(obj, null, 2)), path);
const ctrfFromJunit = (c, tool) => ({ tests: junitToCtrfTests(readFileSync(raw(c, "junit.xml"), "utf8")), tool });
const jar = () => resolve(ARTIFACT_PATH(loadCatalog()));
const pomVersion = (prop) => readFileSync("product/pom.xml", "utf8").match(new RegExp(`<${prop}>([^<]+)</${prop}>`))?.[1];
const bin = (name) => `node_modules/.bin/${name}`;
const node = process.execPath;

// Turn SARIF findings into one CTRF test per catalog ID. A result belongs to a
// catalog ID when `match(result, id)`; suppressed results (VEX) do not count.
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

// Cucumber-JVM suite against the delivered jar, writing JUnit XML + Cucumber Messages.
function cucumberSuite(category, suite) {
  const out = resolve(raw(category));
  return run("mvn", ["-B", "-q", "-f", "product/pom.xml", "test", `-Dtest=${suite}`, "-Dsurefire.failIfNoSpecifiedTests=false",
    `-Dfxquote.jar=${jar()}`, `-Dcucumber.plugin=junit:${out}/junit.xml,message:${out}/messages.ndjson`]);
}
const cucumberTool = () => ({ name: "cucumber-jvm", version: pomVersion("cucumber.version") });
const stepFiles = ["product/src/test/java/demo/fxquote/steps/Service.java"];

export const CATEGORIES = {
  unit: {
    signer: "ci-pipeline",
    run: () => {
      const r = run("mvn", ["-B", "-q", "-f", "product/pom.xml", "test"]);
      const dir = "product/target/surefire-reports";
      const xml = readdirSync(dir).filter((f) => /^TEST-.*\.xml$/.test(f) && !f.includes("Suite"))
        .map((f) => readFileSync(`${dir}/${f}`, "utf8")).join("\n");
      writeFileSync(raw("unit", "junit.xml"), xml);
      return r;
    },
    evaluate: () => ({ ...ctrfFromJunit("unit", { name: "junit-jupiter (surefire)", version: pomVersion("junit.version") }), reports: [] }),
  },

  integration: {
    signer: "ci-pipeline",
    run: () => cucumberSuite("integration", "IntegrationSuite"),
    evaluate: () => ({ ...ctrfFromJunit("integration", cucumberTool()), reports: [raw("integration", "messages.ndjson")],
      extraConfig: [...stepFiles, "product/src/test/java/demo/fxquote/steps/ApiSteps.java"] }),
  },

  contract: {
    signer: "ci-pipeline",
    run: () => cucumberSuite("contract", "ContractSuite"),
    evaluate: () => ({ ...ctrfFromJunit("contract", cucumberTool()), reports: [raw("contract", "messages.ndjson")],
      extraConfig: [...stepFiles, "product/src/test/java/demo/fxquote/steps/ApiSteps.java", "product/src/main/resources/openapi.json"] }),
  },

  uat: {
    signer: "ci-pipeline",
    run: () => cucumberSuite("uat", "UatSuite"),
    evaluate: () => ({ ...ctrfFromJunit("uat", { name: "cucumber-jvm + playwright-java", version: pomVersion("cucumber.version") }),
      reports: [raw("uat", "messages.ndjson")], extraConfig: [...stepFiles, "product/src/test/java/demo/fxquote/steps/UiSteps.java"] }),
  },

  e2e: {
    signer: "ci-pipeline",
    run: () => run(bin("playwright"), ["test", "tests/e2e", "--reporter=list,junit"],
      { env: { ...process.env, FXQUOTE_JAR: jar(), PLAYWRIGHT_JUNIT_OUTPUT_FILE: raw("e2e", "junit.xml") } }),
    evaluate: () => ({ ...ctrfFromJunit("e2e", { name: "playwright", version: npmVersion("@playwright/test") }), reports: [] }),
  },

  accessibility: {
    signer: "ci-pipeline",
    run: () => run(bin("playwright"), ["test", "tests/a11y", "--reporter=list,junit"],
      { env: { ...process.env, FXQUOTE_JAR: jar(), PLAYWRIGHT_JUNIT_OUTPUT_FILE: raw("accessibility", "junit.xml") } }),
    evaluate: () => {
      const files = readdirSync(raw("accessibility")).filter((f) => f.startsWith("axe-")).map((f) => raw("accessibility", f));
      const sarif = write(raw("accessibility", "axe.sarif"), axeToSarif(files, npmVersion("axe-core")));
      return { ...ctrfFromJunit("accessibility", { name: "playwright + axe-core", version: npmVersion("axe-core") }), reports: [sarif] };
    },
  },

  load: {
    signer: "perf-env",
    run: () => run(node, ["tests/load/load.mjs"], { env: { ...process.env, FXQUOTE_JAR: jar() } }),
    evaluate: () => ({
      tests: JSON.parse(readFileSync(raw("load", "ctrf.json"), "utf8")).results.tests,
      tool: { name: "autocannon", version: npmVersion("autocannon") },
      reports: [raw("load", "autocannon.json")],
      environmentSpec: raw("load", "env-spec.json"),
      extraConfig: ["tests/load/profile.yaml", "tests/load/env-spec.base.yaml"],
    }),
  },

  sast: {
    signer: "ci-pipeline",
    run: () => run("semgrep", ["scan", "--config", "tests/sast/rules.yml", "--sarif", "--output", raw("sast", "semgrep.sarif"),
      "--metrics=off", "--disable-version-check", "--quiet", "product/src/main"]),
    evaluate: ({ ids }) => {
      const sarif = JSON.parse(readFileSync(raw("sast", "semgrep.sarif"), "utf8"));
      const v = execFileSync("semgrep", ["--version"], { encoding: "utf8" }).trim();
      // semgrep prefixes rule IDs with the config path; rule IDs are "<catalog ID>-<language>".
      const ruleOf = (r) => r.ruleId.split(".").pop();
      return { tests: checksFromSarif(ids, sarif, (r, id) => ruleOf(r) === id || ruleOf(r).startsWith(`${id}-`)),
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

  // Dependency vulnerabilities: SBOM components matched against a pinned OSV
  // snapshot of the Maven ecosystem, then OpenVEX applied.
  //   DEMO_OSV_SNAPSHOT  directory of OSV records to use in place of the download
  //   DEMO_VEX           OpenVEX document to use in place of tests/sca/vex.openvex.json
  sca: {
    signer: "ci-pipeline",
    run: () => run("mvn", ["-B", "-q", "-f", "product/pom.xml", "org.cyclonedx:cyclonedx-maven-plugin:makeBom"]),
    evaluate: ({ ids }) => {
      const policy = JSON.parse(readFileSync("tests/sca/policy.json", "utf8")).checks;
      const sbom = JSON.parse(readFileSync("product/target/sbom.cdx.json", "utf8"));
      const scan = osvScan(sbom, { snapshot: process.env.DEMO_OSV_SNAPSHOT, outDir: raw("sca") });
      const vexPath = process.env.DEMO_VEX ?? "tests/sca/vex.openvex.json";
      const vexApplied = scan.sarif ? applyVex(scan.sarif, JSON.parse(readFileSync(vexPath, "utf8")), loadCatalog().product.purl) : [];
      const sarifPath = scan.sarif ? write(raw("sca", "osv.sarif"), scan.sarif) : null;

      const sev = (r) => r.properties.severity;
      const tests = scan.error
        ? ids.map((id) => ({ name: `${id} advisory source unavailable`, status: "failed", duration: 0, message: scan.error, extra: { id } }))
        : checksFromSarif(ids, scan.sarif,
          (r, id) => (policy[id].fail_on ?? policy[id].warn_on).includes(sev(r)),
          (r, id) => (policy[id].warn_on ?? []).includes(sev(r)));
      return {
        tests, tool: { name: "osv snapshot match (demo)", version: "1" },
        reports: [...(sarifPath ? [sarifPath] : []), ...scan.records],
        vex: vexPath, snapshot: scan.snapshot, extra: { vexApplied, sbomComponents: scan.components },
      };
    },
  },

  license: {
    signer: "ci-pipeline",
    run: () => {
      const r = run("mvn", ["-B", "-q", "-f", "product/pom.xml", "org.cyclonedx:cyclonedx-maven-plugin:makeBom",
        "dependency:3.11.0:list", "-DincludeScope=runtime", `-DoutputFile=${resolve(raw("license", "dependency-list.txt"))}`]);
      writeFileSync(raw("license", "sbom.cdx.json"), readFileSync("product/target/sbom.cdx.json"));
      return r;
    },
    evaluate: () => {
      const allowed = JSON.parse(readFileSync("tests/license/allowlist.json", "utf8")).allowed;
      const sbom = JSON.parse(readFileSync(raw("license", "sbom.cdx.json"), "utf8"));
      const purlKey = (p) => (p ?? "").split("?")[0];
      const licenseIds = (c) => (c.licenses ?? []).flatMap((l) => l.license?.id ? [l.license.id] : l.expression ? [l.expression] : [l.license?.name ?? "UNKNOWN"]);

      const rules = [{ id: "LIC-001", shortDescription: { text: "License not on allowlist" } }];
      const results = [];
      for (const c of sbom.components ?? []) {
        const ids = licenseIds(c);
        if (ids.length === 0 || !ids.some((id) => allowed.includes(id))) {
          results.push({ ruleId: "LIC-001", level: "error", message: { text: `${purlKey(c.purl)} is licensed ${ids.join(" / ") || "UNKNOWN"}` },
            locations: [{ physicalLocation: { artifactLocation: { uri: "product/pom.xml" } } }], properties: { purl: purlKey(c.purl) } });
        }
      }
      const sarifPath = write(raw("license", "licenses.sarif"), sarifLog("license-allowlist (demo)", "1", rules, results));

      // Runtime dependencies according to Maven, as purls.
      const listed = readFileSync(raw("license", "dependency-list.txt"), "utf8").split("\n")
        .map((l) => l.trim().match(/^([\w.-]+):([\w.-]+):jar:([\w.-]+):(compile|runtime)/)).filter(Boolean)
        .map(([, g, a, v]) => `pkg:maven/${g}/${a}@${v}`);
      const inSbom = new Set((sbom.components ?? []).map((c) => purlKey(c.purl)));
      const absent = listed.filter((p) => !inSbom.has(p));
      const productPurl = loadCatalog().product.purl;
      const sbomPurl = purlKey(sbom.metadata?.component?.purl);
      const purlProblem = sbomPurl === productPurl ? null : `SBOM identifies the product as ${sbomPurl}, catalog says ${productPurl}`;
      const lic2Fail = absent.length > 0 || purlProblem || listed.length === 0;
      return {
        tool: { name: "cyclonedx-maven-plugin + license-allowlist", version: "2.9.3" },
        reports: [sarifPath, raw("license", "sbom.cdx.json"), raw("license", "dependency-list.txt")],
        tests: [
          { name: `LIC-001 ${results.length} disallowed license(s)`, status: results.length ? "failed" : "passed", duration: 0,
            ...(results.length ? { message: results.map((r) => r.message.text).join("; ") } : {}), extra: { id: "LIC-001" } },
          { name: `LIC-002 SBOM for ${sbomPurl} lists ${listed.length - absent.length}/${listed.length} runtime dependencies`,
            status: lic2Fail ? "failed" : "passed", duration: 0,
            ...(lic2Fail ? { message: [purlProblem, absent.length && `missing from SBOM: ${absent.join(", ")}`,
              listed.length === 0 && "no runtime dependencies listed"].filter(Boolean).join("; ") } : {}),
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
      reports: [], extraConfig: ["product/src/main/resources/data/rates.json"] }),
  },
};

export const AUTOMATED = Object.keys(CATEGORIES);
export const SIGNOFF_CATEGORIES = ["ux-signoff", "uat-signoff"];
export { idFromName, ctrfReport };
