#!/usr/bin/env node
// Build step: build the product into a reproducible jar inside the pinned build
// container, deliver it to out/artifacts/, and sign SLSA provenance v1 for it as
// the build-service identity.
//
//   DEMO_REVISION=0.1.0-ci.42 node evidence/build.mjs
//
// The version (Maven ${revision}) is set per build so every build can be
// published to a Maven repository. The test categories then run against
// out/artifacts/<jar> and name it as a subject.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import os from "node:os";
import { fileDigest, sourceDigest } from "./lib/digest.mjs";
import { signStatement } from "./lib/signing.mjs";
import { ensureKeys } from "./lib/keys.mjs";
import { runUrl, STATEMENT_TYPE, SOURCE_URI, gitCommit } from "./lib/statement.mjs";
import { writeBundle } from "./lib/bundle.mjs";
import { ARTIFACT_DIR, buildRevision, coordinates, delivered } from "./lib/product.mjs";
import { BUILD_IMAGE, mavenBuild, toolchain } from "./lib/maven-build.mjs";

export const PROVENANCE_TYPE = "https://slsa.dev/provenance/v1";
export const BUILD_TYPE = "https://example.com/code-tracer-demo/maven-container-build/v1";

ensureKeys();
const { artifactId } = coordinates();
const revision = buildRevision();
const started = new Date();
const b = mavenBuild({ revision, artifactId, allowHost: process.env.DEMO_ALLOW_HOST_BUILD === "1" });
if (b.error) {
  console.error(b.error);
  process.exit(1);
}
const finished = new Date();

mkdirSync(ARTIFACT_DIR, { recursive: true });
for (const f of readdirSync(ARTIFACT_DIR)) rmSync(join(ARTIFACT_DIR, f));
copyFileSync(b.jar, join(ARTIFACT_DIR, basename(b.jar)));
const jar = delivered();
const src = sourceDigest();
const commit = gitCommit();
const tools = toolchain(b.builder, b.image);
const [imageName, imageDigest] = (b.image ?? "").split("@sha256:");

const statement = {
  _type: STATEMENT_TYPE,
  subject: [{ name: jar.jarPurl, digest: { sha256: fileDigest(jar.path) } }],
  predicateType: PROVENANCE_TYPE,
  predicate: {
    buildDefinition: {
      buildType: BUILD_TYPE,
      externalParameters: { source: SOURCE_URI, pom: "product/pom.xml", revision, command: b.command },
      internalParameters: {
        builder: b.builder,
        ...(b.image ? { image: b.image } : { os: `${os.type()} ${os.release()} ${os.arch()}` }),
        javac: tools.javac,
        maven: tools.maven,
        reproducible: "project.build.outputTimestamp is fixed in product/pom.xml",
      },
      resolvedDependencies: [
        { uri: SOURCE_URI, digest: { sha256: src.digest, ...(commit ? { gitCommit: commit } : {}) } },
        ...(b.image ? [{ uri: `docker://${imageName}`, digest: { sha256: imageDigest } }] : []),
      ],
    },
    runDetails: {
      builder: { id: "https://example.com/code-tracer-demo/builders/build-service" },
      metadata: { invocationId: runUrl(), startedOn: started.toISOString(), finishedOn: finished.toISOString() },
    },
  },
};

mkdirSync("out/attestations", { recursive: true });
signStatement(statement, "build-service", "out/attestations/build.sigstore.json");
writeBundle();
console.log(`built ${jar.path} (${jar.jarPurl}) ${b.builder === "container" ? `in ${BUILD_IMAGE.split("@")[0]}` : "on the host"}
  sha256 ${statement.subject[0].digest.sha256}
  source ${src.digest}
provenance -> out/attestations/build.sigstore.json (signed by build-service)`);
