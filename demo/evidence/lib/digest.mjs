// Digests. The attestation subject is a source manifest digest: sha256 over the
// sorted list of "<sha256>  <path>" lines for the product source files. The gate
// recomputes it from its own clone, so the binding survives `git clone` without
// depending on how a given git version builds an archive.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const SOURCE_PATHS = ["product", "package.json", "package-lock.json"];

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
export const fileDigest = (path) => sha256(readFileSync(path));

function walk(root, dir = root, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
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
