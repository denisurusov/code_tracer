// Dependency vulnerability scan against a pinned OSV snapshot (architecture §7:
// "OSV schema — vuln records keyed by purl"; the evidence carries the snapshot
// digest so the result can be re-derived).
//
// Snapshot: OSV's per-ecosystem export for Maven,
//   https://osv-vulnerabilities.storage.googleapis.com/Maven/all.zip
// downloaded once a day into out/cache/, or a directory of OSV records given as
// `snapshot` (used by the gate's VEX cases).
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { dirDigest, fileDigest } from "./digest.mjs";
import { sarifLog } from "./convert.mjs";

export const OSV_MAVEN_URL = "https://osv-vulnerabilities.storage.googleapis.com/Maven/all.zip";
const CACHE = "out/cache/osv-maven";
const SEVERITY_RANK = { low: 1, moderate: 2, high: 3, critical: 4 };
const LEVEL = { critical: "error", high: "error", moderate: "warning", low: "note" };

// ---------- Maven version ordering (simplified ComparableVersion) ----------
const QUALIFIERS = ["alpha", "beta", "milestone", "rc", "snapshot", "", "sp"];
const qualifierRank = (q) => {
  const n = { a: "alpha", b: "beta", m: "milestone", cr: "rc", ga: "", final: "", release: "" }[q] ?? q;
  const i = QUALIFIERS.indexOf(n);
  return i >= 0 ? i : QUALIFIERS.length; // unknown qualifiers sort after known ones
};
const tokens = (v) => v.toLowerCase().split(/[.-]|(?<=\d)(?=[a-z])|(?<=[a-z])(?=\d)/).filter((t) => t !== "");

export function compareMaven(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    const x = ta[i] ?? (/^\d/.test(tb[i]) ? "0" : "");
    const y = tb[i] ?? (/^\d/.test(ta[i]) ? "0" : "");
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = BigInt(x) - BigInt(y);
      if (d !== 0n) return d < 0n ? -1 : 1;
    } else if (nx !== ny) {
      // number > qualifier, except a missing token ("") which equals release
      if (nx) return y === "" ? (Number(x) === 0 ? 0 : 1) : 1;
      return x === "" ? (Number(y) === 0 ? 0 : -1) : -1;
    } else if (x !== y) {
      const d = qualifierRank(x) - qualifierRank(y);
      if (d !== 0) return d < 0 ? -1 : 1;
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** Is `version` inside an OSV ECOSYSTEM/SEMVER range? Events are evaluated in version order. */
function inRange(range, version) {
  const events = range.events
    .map((e) => {
      const [kind, v] = Object.entries(e)[0];
      return { kind, v };
    })
    .sort((x, y) => (x.v === "0" ? -1 : y.v === "0" ? 1 : compareMaven(x.v, y.v)));
  let affected = false;
  for (const e of events) {
    const c = e.v === "0" ? 1 : compareMaven(version, e.v);
    if (e.kind === "introduced" && c >= 0) affected = true;
    else if (e.kind === "fixed" && c >= 0) affected = false;
    else if (e.kind === "last_affected" && c > 0) affected = false;
  }
  return affected;
}

export function affects(record, group, artifact, version) {
  return (record.affected ?? []).some((a) =>
    a.package?.ecosystem === "Maven" && a.package?.name === `${group}:${artifact}` &&
    ((a.versions ?? []).includes(version) || (a.ranges ?? []).some((r) => r.type !== "GIT" && inRange(r, version))));
}

function severityOf(record) {
  const s = record.database_specific?.severity?.toLowerCase();
  if (SEVERITY_RANK[s]) return s;
  return "high"; // no usable severity: fail closed
}

// ---------- snapshot ----------
function loadSnapshot(snapshot) {
  if (snapshot) {
    return { dir: snapshot, descriptor: { name: snapshot, digest: { sha256: dirDigest(snapshot) },
      annotations: { role: "advisory-snapshot", format: "OSV", source: "local directory" } } };
  }
  const zip = join(CACHE, "all.zip");
  const fresh = existsSync(zip) && Date.now() - statSync(zip).mtimeMs < 24 * 3600 * 1000;
  if (!fresh) {
    mkdirSync(CACHE, { recursive: true });
    const r = spawnSync("curl", ["-sSfL", "--max-time", "300", "-o", zip, OSV_MAVEN_URL], { encoding: "utf8" });
    if (r.status !== 0) return { error: `could not download ${OSV_MAVEN_URL}: ${(r.stderr || "").trim() || `exit ${r.status}`}` };
    const recordsDir = join(CACHE, "records");
    mkdirSync(recordsDir, { recursive: true });
    const u = spawnSync("unzip", ["-o", "-q", zip, "-d", recordsDir], { encoding: "utf8" });
    if (u.status !== 0) return { error: `could not unzip OSV snapshot: ${u.stderr}` };
  }
  // Recorded by hash and URL only: the snapshot is not retained with the evidence,
  // and OSV republishes the export as advisories change.
  return { dir: join(CACHE, "records"), descriptor: { name: OSV_MAVEN_URL, digest: { sha256: fileDigest(zip) },
    annotations: { role: "advisory-snapshot", format: "OSV", uri: OSV_MAVEN_URL, retained: "false", retrievedOn: new Date(statSync(zip).mtimeMs).toISOString() } } };
}

/**
 * Match SBOM components against the snapshot. Returns
 * { sarif, records: [paths of matched OSV records], snapshot: descriptor, components, error }.
 */
export function osvScan(sbom, { snapshot, outDir }) {
  const components = (sbom.components ?? [])
    .map((c) => c.purl?.split("?")[0].match(/^pkg:maven\/([^/]+)\/([^@]+)@(.+)$/))
    .filter(Boolean)
    .map(([purl, group, artifact, version]) => ({ purl, group, artifact, version }));

  const snap = loadSnapshot(snapshot);
  if (snap.error) return { error: snap.error, records: [], snapshot: null, components: components.length };

  // Index records by Maven package name.
  const byName = new Map();
  for (const f of readdirSync(snap.dir).filter((n) => n.endsWith(".json"))) {
    const rec = JSON.parse(readFileSync(join(snap.dir, f), "utf8"));
    for (const a of rec.affected ?? []) {
      if (a.package?.ecosystem !== "Maven") continue;
      const list = byName.get(a.package.name) ?? [];
      list.push({ rec, file: join(snap.dir, f) });
      byName.set(a.package.name, list);
    }
  }

  const rules = new Map();
  const results = [];
  const recordPaths = new Set();
  mkdirSync(join(outDir, "osv"), { recursive: true });
  for (const c of components) {
    const hits = (byName.get(`${c.group}:${c.artifact}`) ?? []).filter(({ rec }) => affects(rec, c.group, c.artifact, c.version));
    const unique = [...new Map(hits.map((h) => [h.rec.id, h])).values()];
    if (unique.length === 0) continue;
    for (const { rec, file } of unique) {
      rules.set(rec.id, { id: rec.id, shortDescription: { text: rec.summary ?? rec.id },
        helpUri: rec.references?.[0]?.url, properties: { severity: severityOf(rec), aliases: rec.aliases ?? [] } });
      const dest = join(outDir, "osv", `${rec.id}.json`);
      copyFileSync(file, dest);
      recordPaths.add(dest);
    }
    const severity = unique.map(({ rec }) => severityOf(rec)).sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a])[0];
    results.push({
      ruleId: unique[0].rec.id,
      level: LEVEL[severity],
      message: { text: `${c.purl}: ${unique.map(({ rec }) => `${rec.id} (${severityOf(rec)}) ${rec.summary ?? ""}`.trim()).join("; ")}` },
      locations: [{ physicalLocation: { artifactLocation: { uri: "product/pom.xml" } } }],
      properties: { purl: c.purl, severity, vulnerabilities: unique.map(({ rec }) => rec.id) },
    });
  }
  return {
    sarif: sarifLog("osv snapshot match (demo)", "1", [...rules.values()], results),
    records: [...recordPaths],
    snapshot: snap.descriptor,
    components: components.length,
  };
}
