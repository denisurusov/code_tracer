// Builds the in-toto Statement with the test-result predicate
// (https://in-toto.io/attestation/test-result/v0.1).
//
// Demo conventions, all within the predicate's own fields or ignorable extensions:
//   - `configuration` lists ResourceDescriptors for everything the result depends
//     on, each annotated with a role: catalog, scenario, environment-spec, report.
//   - `x-code-tracer` is an extension field (consumers ignore unknown fields)
//     carrying the category, time window, runner and coverage detail.
import { execFileSync } from "node:child_process";
import os from "node:os";
import { sourceDigest } from "./digest.mjs";
import { loadCatalog } from "./catalog.mjs";

export const TEST_RESULT_TYPE = "https://in-toto.io/attestation/test-result/v0.1";
export const STATEMENT_TYPE = "https://in-toto.io/Statement/v1";

function gitCommit() {
  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--", "."], { encoding: "utf8" }).trim();
    return dirty ? undefined : sha; // only bind the commit when the tree matches it
  } catch {
    return undefined;
  }
}

export function runUrl() {
  const { GITHUB_SERVER_URL: s, GITHUB_REPOSITORY: r, GITHUB_RUN_ID: id } = process.env;
  return s && r && id ? `${s}/${r}/actions/runs/${id}` : `local://${os.hostname()}/runs/${Date.now()}`;
}

export function subject() {
  const src = sourceDigest();
  const commit = gitCommit();
  // Subject name is the product's purl (architecture §7: subjects are purl + digest).
  return [{ name: loadCatalog().product.purl, digest: { sha256: src.digest, ...(commit ? { gitCommit: commit } : {}) } }];
}

/**
 * Aggregate CTRF tests by catalog ID. An ID fails if any of its test cases fail
 * (e.g. one Scenario Outline example), warns if any warn, else passes.
 */
export function classify(tests, catalogIds, idOf) {
  const byId = new Map();
  const unknown = [];
  for (const t of tests) {
    const id = idOf(t);
    if (!id || !catalogIds.includes(id)) { unknown.push(t.name); continue; }
    const outcome = t.status === "failed" ? "failed" : t.extra?.outcome === "warned" ? "warned" : t.status === "passed" ? "passed" : "failed";
    const prev = byId.get(id);
    const rank = { passed: 0, warned: 1, failed: 2 };
    if (!prev || rank[outcome] > rank[prev]) byId.set(id, outcome);
  }
  const missing = catalogIds.filter((id) => !byId.has(id));
  const pick = (o) => catalogIds.filter((id) => byId.get(id) === o);
  return { passed: pick("passed"), warned: pick("warned"), failed: pick("failed"), missing, unknown };
}

export function buildStatement({ category, classified, configuration, started, finished, tool, extra = {} }) {
  const { passed, warned, failed, missing, unknown } = classified;
  const result = failed.length || missing.length || unknown.length ? "FAILED" : warned.length ? "WARNED" : "PASSED";
  return {
    _type: STATEMENT_TYPE,
    subject: subject(),
    predicateType: TEST_RESULT_TYPE,
    predicate: {
      result,
      configuration,
      url: runUrl(),
      passedTests: passed,
      warnedTests: warned,
      failedTests: failed,
      "x-code-tracer": {
        category,
        startedOn: new Date(started).toISOString(),
        finishedOn: new Date(finished).toISOString(),
        tool,
        missingTests: missing,
        unknownTests: unknown,
        ...extra,
      },
    },
  };
}
