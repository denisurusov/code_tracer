// Maven build of the product, in the pinned build container when Docker is
// available. Used by the build step and by the gate's rebuild, so both run the
// same command in the same image.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** The build image, pinned by digest. gate/policy.yaml lists the images it accepts. */
export const BUILD_IMAGE = "docker.io/library/maven:3.9.16-eclipse-temurin-21@sha256:99e61abcff91a9b1333463bd8451fb18495d6eba9250ac66a338b518f8278320";

export const dockerAvailable = () => spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;

export const mavenGoals = (revision, offline = false) =>
  ["-B", "-q", ...(offline ? ["-o"] : []), `-Drevision=${revision}`, "clean", "package", "-DskipTests"];

/**
 * Build `<root>/product` and return { jar, builder, image, command }.
 * builder: "container" (in `image`) or "host" (only when the caller allows it).
 */
export function mavenBuild({ root = ".", revision, image = BUILD_IMAGE, offline = false, allowHost = false, artifactId }) {
  const product = resolve(root, "product");
  let r;
  let command;
  let builder;
  if (image && dockerAvailable()) {
    builder = "container";
    const m2 = process.env.DEMO_M2 ?? join(homedir(), ".m2");
    mkdirSync(m2, { recursive: true });
    const uid = process.getuid?.() ?? 0;
    const gid = process.getgid?.() ?? 0;
    const args = ["run", "--rm", "-u", `${uid}:${gid}`, "-v", `${product}:/work`, "-v", `${m2}:/var/maven/.m2`,
      "-e", "MAVEN_CONFIG=/var/maven/.m2", "-w", "/work", image,
      "mvn", "-Duser.home=/var/maven", ...mavenGoals(revision, offline)];
    command = `docker ${args.join(" ").replace(product, "<product>").replace(m2, "<m2>")}`;
    r = spawnSync("docker", args, { stdio: "inherit" });
  } else if (allowHost) {
    builder = "host";
    const args = ["-f", join(product, "pom.xml"), ...mavenGoals(revision, offline)];
    command = `mvn ${args.join(" ").replace(product, "<product>")}`;
    r = spawnSync("mvn", args, { stdio: "inherit" });
  } else {
    return { error: "Docker is not available to run the pinned build image (set DEMO_ALLOW_HOST_BUILD=1 to build on the host)" };
  }
  if (r.status !== 0) return { error: `build failed (exit ${r.status})`, builder, command };
  return { jar: join(product, "target", `${artifactId}-${revision}.jar`), builder, image: builder === "container" ? image : null, command };
}

/** Toolchain inside the build environment, for the provenance. */
export function toolchain(builder, image) {
  const exec = (cmd, args) => {
    const r = builder === "container"
      ? spawnSync("docker", ["run", "--rm", "--entrypoint", cmd, image, ...args], { encoding: "utf8" })
      : spawnSync(cmd, args, { encoding: "utf8" });
    return `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("Picked up")) ?? "unknown";
  };
  return { javac: exec("javac", ["-version"]), maven: exec("mvn", ["-v"]).split(" (")[0] };
}
