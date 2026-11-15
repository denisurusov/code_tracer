// Converters into the two common result formats:
//   - CTRF (Common Test Report Format) for pass/fail test results
//   - SARIF 2.1.0 for scanner findings
import { readFileSync } from "node:fs";

export const ID_RE = /^([A-Z0-9]+-\d{3})\b/;

// ---------- JUnit XML -> CTRF tests ----------
const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : undefined;
};

/** Parse the JUnit XML produced by node:test, cucumber-js and Playwright. */
export function junitToCtrfTests(xml) {
  const tests = [];
  // Attribute values may contain a raw ">" (cucumber writes "&lt;case>"), so match quoted strings whole.
  const re = /<testcase\b((?:[^>"]|"[^"]*")*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const m of xml.matchAll(re)) {
    const head = m[1];
    const body = m[3] ?? "";
    const failure = /<(failure|error)\b((?:[^>"]|"[^"]*")*)/.exec(body) ?? (attr(head, "failure") ? [null, "failure", ` message="${attr(head, "failure")}"`] : null);
    const skipped = /<skipped\b/.test(body);
    tests.push({
      name: attr(head, "name"),
      status: failure ? "failed" : skipped ? "skipped" : "passed",
      duration: Math.round(Number(attr(head, "time") ?? 0) * 1000),
      suite: attr(head, "classname"),
      ...(failure ? { message: attr(failure[2], "message") ?? "failed" } : {}),
    });
  }
  return tests;
}

export function ctrfReport(toolName, toolVersion, tests, start, stop) {
  const count = (s) => tests.filter((t) => t.status === s).length;
  return {
    reportFormat: "CTRF",
    specVersion: "0.0.0",
    results: {
      tool: { name: toolName, ...(toolVersion ? { version: toolVersion } : {}) },
      summary: {
        tests: tests.length, passed: count("passed"), failed: count("failed"), skipped: count("skipped"),
        pending: count("pending"), other: count("other"), start, stop,
      },
      tests,
    },
  };
}

// ---------- SARIF ----------
export function sarifLog(toolName, toolVersion, rules, results) {
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{ tool: { driver: { name: toolName, version: toolVersion, rules } }, results }],
  };
}

const SEVERITY_LEVEL = { critical: "error", high: "error", moderate: "warning", low: "note", info: "note" };

/** npm audit --json (v2) -> SARIF. One result per vulnerable package. */
export function npmAuditToSarif(audit, npmVersion) {
  const rules = [];
  const results = [];
  for (const [name, v] of Object.entries(audit.vulnerabilities ?? {})) {
    const ruleId = `npm-audit/${name}`;
    const advisories = v.via.filter((x) => typeof x === "object");
    rules.push({
      id: ruleId,
      shortDescription: { text: `${name}: ${v.severity} severity` },
      helpUri: advisories[0]?.url,
      properties: { severity: v.severity, advisories: advisories.map((a) => a.url) },
    });
    results.push({
      ruleId,
      level: SEVERITY_LEVEL[v.severity] ?? "warning",
      message: { text: `${name} ${v.range}: ${advisories.map((a) => a.title).join("; ") || "via " + v.via.join(", ")}` },
      locations: [{ physicalLocation: { artifactLocation: { uri: "package-lock.json" } } }],
      properties: { severity: v.severity, isDirect: v.isDirect },
    });
  }
  return sarifLog("npm audit", npmVersion, rules, results);
}

/** axe-core results files -> SARIF. One result per violating node. */
export function axeToSarif(files, axeVersion) {
  const rules = new Map();
  const results = [];
  for (const f of files) {
    const r = JSON.parse(readFileSync(f, "utf8"));
    for (const v of r.violations) {
      rules.set(v.id, { id: v.id, shortDescription: { text: v.help }, helpUri: v.helpUrl, properties: { tags: v.tags, impact: v.impact } });
      for (const node of v.nodes) {
        results.push({
          ruleId: v.id,
          level: v.impact === "critical" || v.impact === "serious" ? "error" : "warning",
          message: { text: `${r.id}: ${v.help} (${node.target.join(" ")})` },
          locations: [{ physicalLocation: { artifactLocation: { uri: r.url } } }],
          properties: { catalogId: r.id },
        });
      }
    }
  }
  return sarifLog("axe-core", axeVersion, [...rules.values()], results);
}

/** All results across the runs of a SARIF log. */
export function sarifResults(sarif) {
  return sarif.runs.flatMap((run) => run.results ?? []);
}
