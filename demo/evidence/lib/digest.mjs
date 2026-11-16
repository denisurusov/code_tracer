// Digests. Attestations name two subjects: the built jar (sha256 of the file) and
// the product source, as a source manifest digest: sha256 over the sorted
// "<sha256>  <path>" lines for every file under product/ except target/. The gate
// recomputes the source digest from its own clone, so the binding survives
// `git clone` without depending on how a given git version builds an archive.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const SOURCE_PATHS = ["product"];
const EXCLUDE = new Set(["target"]); // build output is not source

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
export const fileDigest = (path) => sha256(readFileSync(path));

function walk(root, dir = root, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (EXCLUDE.has(name) && statSync(p).isDirectory()) continue;
    if (statSync(p).isDirectory()) walk(root, p, out);
    else out.push(p);
  }
  return out;
}

/** Source manifest digest for the product rooted at `root` (default: cwd). */
export function sourceDigest(root = process.cwd()) {
  const files = [];
  for (const entry of SOURCE_PATHS) {
    const p = join(root, entry);
    if (!existsSync(p)) continue;
    if (statSync(p).isDirectory()) files.push(...walk(root, p));
    else files.push(p);
  }
  const lines = files
    .map((f) => `${fileDigest(f)}  ${relative(root, f).split(sep).join("/")}`)
    .sort((a, b) => (a.slice(66) < b.slice(66) ? -1 : 1));
  const manifest = lines.join("\n") + "\n";
  return { digest: sha256(manifest), manifest, files: lines.length };
}

/** in-toto ResourceDescriptor for a local file. */
export function descriptor(path, annotations = {}) {
  return { name: path.split(sep).join("/"), digest: { sha256: fileDigest(path) }, annotations };
}

/** Digest of a directory's files (same manifest scheme), e.g. a pinned advisory snapshot. */
export function dirDigest(dir) {
  const lines = walk(dir, dir).map((f) => `${fileDigest(f)}  ${relative(dir, f).split(sep).join("/")}`).sort();
  return sha256(lines.join("\n") + "\n");
}
