#!/usr/bin/env node
// Publish the delivered jar to a Maven repository with the evidence as sidecars
// under classifiers of the same coordinates:
//
//   <artifactId>-<version>.jar                       the jar
//   <artifactId>-<version>-evidence.intoto.jsonl     every Sigstore bundle (provenance, tests, sign-offs)
//   <artifactId>-<version>-evidence-record.md        the text evidence record (EVIDENCE.md)
//
//   DEMO_MAVEN_REPO_URL=https://maven.pkg.github.com/<owner>/<repo> node evidence/publish.mjs
//
// Credentials come from the Maven settings server with id "github" (setup-java
// writes it in CI). The generated POM has no dependencies: the jar is shaded.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { BUNDLE_NAME } from "./lib/bundle.mjs";
import { requireDelivered } from "./lib/product.mjs";

const url = process.env.DEMO_MAVEN_REPO_URL;
if (!url) throw new Error("DEMO_MAVEN_REPO_URL is not set");
const jar = requireDelivered();
const sidecars = [
  { file: `out/${BUNDLE_NAME}`, classifier: "evidence", type: "intoto.jsonl" },
  { file: "EVIDENCE.md", classifier: "evidence-record", type: "md" },
];
for (const s of sidecars) if (!existsSync(s.file)) throw new Error(`${s.file} missing; run the evidence steps and npm run manifest first`);

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
