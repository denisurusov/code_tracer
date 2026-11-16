#!/usr/bin/env node
// Build step: `mvn package` the product into a reproducible jar, deliver it to
// out/artifacts/, and sign SLSA provenance v1 for it as the build-service identity.
//
// The test categories then run against out/artifacts/<jar> and name it as a
// subject, so the test results are bound to the artifact the bank receives.
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import os from "node:os";
import { fileDigest, sourceDigest } from "./lib/digest.mjs";
import { signEnvelope } from "./lib/dsse.mjs";
import { ensureKeys, privateKey } from "./lib/keys.mjs";
import { loadCatalog } from "./lib/catalog.mjs";
import { runUrl, STATEMENT_TYPE, SOURCE_URI, gitCommit } from "./lib/statement.mjs";
import { writeBundle } from "./lib/bundle.mjs";

export const PROVENANCE_TYPE = "https://slsa.dev/provenance/v1";
export const BUILD_TYPE = "https://example.com/code-tracer-demo/maven-package/v1";
export const BUILD_COMMAND = ["mvn", "-B", "-q", "-f", "product/pom.xml", "clean", "package", "-DskipTests"];
export const ARTIFACT_DIR = "out/artifacts";

const tool = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\n")[0].trim(); } catch { return "unknown"; }
};

export function mavenBuild(cwd = ".") {
  const r = spawnSync(BUILD_COMMAND[0], BUILD_COMMAND.slice(1), { cwd, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`build failed (exit ${r.status})`);
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  ensureKeys();
  const catalog = loadCatalog();
  const started = new Date();
  mavenBuild();
  const finished = new Date();

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const delivered = `${ARTIFACT_DIR}/${basename(catalog.product.artifact)}`;
  copyFileSync(catalog.product.artifact, delivered);
  const src = sourceDigest();
  const commit = gitCommit();

  const statement = {
    _type: STATEMENT_TYPE,
    subject: [{ name: `${catalog.product.purl}?type=jar`, digest: { sha256: fileDigest(delivered) } }],
    predicateType: PROVENANCE_TYPE,
    predicate: {
      buildDefinition: {
        buildType: BUILD_TYPE,
        externalParameters: { command: BUILD_COMMAND.join(" "), pom: "product/pom.xml" },
        internalParameters: {
          javac: tool("javac", ["-version"]),
          maven: tool("mvn", ["-v"]),
          os: `${os.type()} ${os.release()} ${os.arch()}`,
          reproducible: { outputTimestamp: "product/pom.xml project.build.outputTimestamp" },
        },
        resolvedDependencies: [
          { uri: SOURCE_URI, digest: { sha256: src.digest, ...(commit ? { gitCommit: commit } : {}) } },
        ],
      },
      runDetails: {
        builder: { id: "https://example.com/code-tracer-demo/builders/build-service" },
        metadata: { invocationId: runUrl(), startedOn: started.toISOString(), finishedOn: finished.toISOString() },
      },
    },
  };

  mkdirSync("out/attestations", { recursive: true });
  writeFileSync("out/attestations/build.dsse.json", JSON.stringify(signEnvelope(statement, privateKey("build-service")), null, 2));
  writeBundle();
  console.log(`built ${delivered}\n  sha256 ${statement.subject[0].digest.sha256}\n  source ${src.digest}\nprovenance -> out/attestations/build.dsse.json (signed by build-service)`);
}
