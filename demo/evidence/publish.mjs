#!/usr/bin/env node
// Publish the delivered jar to a Maven repository with the evidence as sidecars
// under classifiers of the same coordinates:
//
//   <artifactId>-<version>.jar                       the jar
//   <artifactId>-<version>-evidence.intoto.jsonl     every Sigstore bundle (provenance, tests, sign-offs)
//   <artifactId>-<version>-evidence-files.tar.gz     out/results/: the reports the attestations name by digest
//
// The bank's gate fetches these by coordinates (evidence/fetch.mjs). The text
// record is written by the bank side after the gate, so it is not published here.
//
//   DEMO_MAVEN_REPO_URL=https://maven.pkg.github.com/<owner>/<repo> node evidence/publish.mjs
//
// Credentials come from the Maven settings server with id "github" (setup-java
// writes it in CI). The generated POM has no dependencies: the jar is shaded.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { BUNDLE_NAME } from "./lib/bundle.mjs";
import { requireDelivered } from "./lib/product.mjs";

const url = process.env.DEMO_MAVEN_REPO_URL;
if (!url) throw new Error("DEMO_MAVEN_REPO_URL is not set");
const jar = requireDelivered();
// Reports, in a tarball with stable ordering and timestamps.
const tar = spawnSync("tar", ["--sort=name", "--mtime=2026-01-01 00:00:00Z", "--owner=0", "--group=0", "--numeric-owner",
  "-czf", "out/evidence-files.tar.gz", "-C", "out", "results"], { stdio: "inherit" });
if (tar.status !== 0) throw new Error("could not pack out/results");
const sidecars = [
  { file: `out/${BUNDLE_NAME}`, classifier: "evidence", type: "intoto.jsonl" },
  { file: "out/evidence-files.tar.gz", classifier: "evidence-files", type: "tar.gz" },
];
for (const s of sidecars) if (!existsSync(s.file)) throw new Error(`${s.file} missing; run the evidence steps first`);
if (!readdirSync("out/attestations").length) throw new Error("no attestations to publish");

const args = ["-B", "-q", "org.apache.maven.plugins:maven-deploy-plugin:3.1.4:deploy-file",
  `-Durl=${url}`, "-DrepositoryId=github",
  `-Dfile=${resolve(jar.path)}`, `-DgroupId=${jar.groupId}`, `-DartifactId=${jar.artifactId}`, `-Dversion=${jar.version}`,
  "-Dpackaging=jar", "-DgeneratePom=true",
  `-Dfiles=${sidecars.map((s) => resolve(s.file)).join(",")}`,
  `-Dclassifiers=${sidecars.map((s) => s.classifier).join(",")}`,
  `-Dtypes=${sidecars.map((s) => s.type).join(",")}`];
const r = spawnSync("mvn", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`published ${jar.groupId}:${jar.artifactId}:${jar.version} with ${sidecars.map((s) => s.classifier).join(", ")} sidecars to ${url}`);
