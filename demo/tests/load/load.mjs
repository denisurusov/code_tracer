// Load test: runs autocannon against the service in a separate process, evaluates
// the thresholds in profile.yaml, and writes:
//   out/raw/load/autocannon.json   native tool report
//   out/raw/load/ctrf.json         one CTRF test per threshold (LOAD-001..003)
//   out/raw/load/env-spec.json     declared + measured environment spec
import autocannon from "autocannon";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { parse } from "yaml";
import { fileDigest, sourceDigest } from "../../evidence/lib/digest.mjs";

const OUT = "out/raw/load";
const PORT = Number(process.env.DEMO_LOAD_PORT || 4320);
const cfg = parse(readFileSync("tests/load/profile.yaml", "utf8"));
const base = parse(readFileSync("tests/load/env-spec.base.yaml", "utf8"));
mkdirSync(OUT, { recursive: true });

const JAR = process.env.FXQUOTE_JAR ?? "out/artifacts/fx-quote-demo-0.1.0.jar";
const server = spawn("java", ["-jar", JAR], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
const url = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${url}/api/health`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 100));
}

const started = Date.now();
const result = await autocannon({
  url: url + cfg.target.path,
  method: cfg.target.method,
  connections: cfg.profile.connections,
  duration: cfg.profile.duration_seconds,
  pipelining: cfg.profile.pipelining,
});
const stopped = Date.now();
server.kill();
writeFileSync(`${OUT}/autocannon.json`, JSON.stringify(result, null, 2));

const total = result.requests.total || 1;
const metrics = {
  latency_p99_ms: result.latency.p99,
  error_rate: (result.non2xx + result.errors + result.timeouts) / total,
  requests_per_second_mean: result.requests.average,
};

const tests = cfg.thresholds.map((t) => {
  const value = metrics[t.metric];
  const ok = (t.max === undefined || value <= t.max) && (t.min === undefined || value >= t.min);
  const bound = t.max !== undefined ? `<= ${t.max}` : `>= ${t.min}`;
  return {
    name: `${t.id} ${t.metric} ${bound}`,
    status: ok ? "passed" : "failed",
    duration: stopped - started,
    message: `${t.metric} = ${value} (threshold ${bound})`,
    extra: { id: t.id, metric: t.metric, value, threshold: t },
  };
});

const summary = {
  tests: tests.length,
  passed: tests.filter((t) => t.status === "passed").length,
  failed: tests.filter((t) => t.status === "failed").length,
  skipped: 0, pending: 0, other: 0, start: started, stop: stopped,
};
writeFileSync(`${OUT}/ctrf.json`, JSON.stringify({
  reportFormat: "CTRF", specVersion: "0.0.0",
  results: { tool: { name: "autocannon", version: "9" }, summary, tests },
}, null, 2));

function javaVersion() {
  const r = spawnSync("java", ["-version"], { encoding: "utf8" });
  return (r.stderr || r.stdout).split("\n").find((l) => l.includes("version"))?.trim() ?? "java (unknown)";
}

const cpus = os.cpus();
const envSpec = {
  env_spec_version: 1,
  captured_at: new Date(started).toISOString(),
  ...base,
  system_under_test: {
    artifact: JAR.split("/").pop(),
    artifact_digest: `sha256:${fileDigest(JAR)}`,
    source_digest: `sha256:${sourceDigest().digest}`,
    runtime: javaVersion(),
  },
  compute: {
    cpu_model: cpus[0]?.model ?? "unknown",
    vcpu: cpus.length,
    memory_gb: Math.round(os.totalmem() / 2 ** 30),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    instances: 1,
  },
  profile: { ...cfg.profile, target: cfg.target },
  thresholds: cfg.thresholds,
};
writeFileSync(`${OUT}/env-spec.json`, JSON.stringify(envSpec, null, 2));

for (const t of tests) console.log(`${t.status === "passed" ? "✓" : "✗"} ${t.name}: ${t.message}`);
process.exitCode = summary.failed ? 1 : 0;
