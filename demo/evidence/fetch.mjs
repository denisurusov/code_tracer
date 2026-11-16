#!/usr/bin/env node
// The bank's intake: download a published build and its evidence from the Maven
// repository by coordinates, into this clone's out/ directory, then run the gate.
//
//   DEMO_MAVEN_REPO_URL=https://maven.pkg.github.com/<owner>/<repo> \
//   GITHUB_ACTOR=... GITHUB_TOKEN=... node evidence/fetch.mjs --version 0.1.1
//
// Downloads, under the coordinates from tests/catalog.yaml:
//   <artifactId>-<version>.jar                       -> out/artifacts/
//   <artifactId>-<version>-evidence.intoto.jsonl     -> out/evidence.intoto.jsonl (+ out/attestations/)
//   <artifactId>-<version>-evidence-files.tar.gz     -> out/results/ (reports the attestations name by digest)
// and writes out/fetched.json with each URL and sha256, for the record.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { coordinates } from "./lib/product.mjs";
import { fileDigest } from "./lib/digest.mjs";
import { readBundle } from "./lib/bundle.mjs";
import { statementOf } from "./lib/cosign.mjs";

const { values } = parseArgs({ options: { version: { type: "string" } } });
const repo = process.env.DEMO_MAVEN_REPO_URL;
const version = values.version ?? process.env.DEMO_VERSION;
if (!repo || !version) throw new Error("DEMO_MAVEN_REPO_URL and --version are required");
const { groupId, artifactId } = coordinates();
const base = `${repo}/${groupId.replaceAll(".", "/")}/${artifactId}/${version}/${artifactId}-${version}`;
const auth = process.env.GITHUB_TOKEN ? `Basic ${Buffer.from(`${process.env.GITHUB_ACTOR ?? "x-access-token"}:${process.env.GITHUB_TOKEN}`).toString("base64")}` : null;

async function download(url, dest) {
  const res = await fetch(url, { headers: auth ? { authorization: auth } : {} });
  if (!res.ok) throw new Error(`GET ${url}: ${res.status} ${res.statusText}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return { url, path: dest, sha256: fileDigest(dest) };
}

mkdirSync("out/artifacts", { recursive: true });
mkdirSync("out/attestations", { recursive: true });
const files = [
  await download(`${base}.jar`, `out/artifacts/${artifactId}-${version}.jar`),
  await download(`${base}-evidence.intoto.jsonl`, "out/evidence.intoto.jsonl"),
  await download(`${base}-evidence-files.tar.gz`, "out/evidence-files.tar.gz"),
];
const t = spawnSync("tar", ["-xzf", "out/evidence-files.tar.gz", "-C", "out"], { stdio: "inherit" });
if (t.status !== 0) throw new Error("could not unpack evidence-files");

// Also write each bundle to out/attestations/<category>.sigstore.json, for the record and the negative cases.
for (const b of readBundle("out/evidence.intoto.jsonl")) {
  const st = statementOf(b);
  const cat = st.predicateType === "https://slsa.dev/provenance/v1" ? "build" : st.predicate["x-code-tracer"].category;
  writeFileSync(`out/attestations/${cat}.sigstore.json`, JSON.stringify(b));
}
writeFileSync("out/fetched.json", JSON.stringify({ repository: repo, coordinates: `${groupId}:${artifactId}:${version}`, files }, null, 2));
for (const f of files) console.log(`fetched ${f.url}\n  -> ${f.path} sha256:${f.sha256}`);
