// The product's identity. The catalog names it by versionless purl; the version
// is set per build (Maven ${revision}, from DEMO_REVISION) and read back from the
// delivered jar's own META-INF/maven/.../pom.properties, so everything downstream
// follows the artifact rather than a version written in two places.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadCatalog } from "./catalog.mjs";

export const ARTIFACT_DIR = "out/artifacts";

/** Version for a new build: DEMO_REVISION (CI sets 0.1.0-ci.<run number>), else 0.1.0. */
export const buildRevision = () => process.env.DEMO_REVISION ?? "0.1.0";

export function coordinates(catalogPath) {
  const purl = loadCatalog(catalogPath).product.purl;
  const m = purl.match(/^pkg:maven\/([^/]+)\/([^@?]+)$/);
  if (!m) throw new Error(`catalog purl must be a versionless Maven purl, got ${purl}`);
  return { purl, groupId: m[1], artifactId: m[2] };
}

/** Version recorded inside a built jar. */
export function jarVersion(jarPath, { groupId, artifactId }) {
  const props = execFileSync("unzip", ["-p", jarPath, `META-INF/maven/${groupId}/${artifactId}/pom.properties`], { encoding: "utf8" });
  return props.match(/^version=(.+)$/m)?.[1]?.trim();
}

/** The delivered jar under <root>/out/artifacts, with its version and purls. Returns null if absent. */
export function delivered(root = ".", catalogPath = join(root, "tests/catalog.yaml")) {
  const c = coordinates(catalogPath);
  const dir = join(root, ARTIFACT_DIR);
  if (!existsSync(dir)) return null;
  const jars = readdirSync(dir).filter((f) => f.startsWith(`${c.artifactId}-`) && f.endsWith(".jar"));
  if (jars.length !== 1) return null;
  const path = join(dir, jars[0]);
  const version = jarVersion(path, c);
  const purl = `${c.purl}@${version}`;
  return { ...c, path, name: jars[0], version, purl, jarPurl: `${purl}?type=jar` };
}

export function requireDelivered(root = ".") {
  const d = delivered(root);
  if (!d) throw new Error(`no delivered jar in ${join(root, ARTIFACT_DIR)}; run \`npm run build\` first`);
  return d;
}

/** -Drevision for every Maven invocation, so SBOM, tests and rebuild see the delivered version. */
export const mavenRevisionArgs = (version) => [`-Drevision=${version}`];

/** A versionless purl in a VEX statement covers every version of that package. */
export function purlMatches(statementPurl, actualPurl) {
  const base = (p) => p.split("?")[0];
  const s = base(statementPurl);
  const a = base(actualPurl);
  return s === a || (!s.includes("@") && a.startsWith(`${s}@`));
}
