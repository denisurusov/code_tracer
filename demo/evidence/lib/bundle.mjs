// Evidence bundle: every Sigstore bundle (each wrapping a DSSE in-toto envelope),
// one per line, in an `.intoto.jsonl` sidecar. This is the form that crosses the
// perimeter when the artifact store is not an OCI registry (no Referrers API to
// attach attestations to). `gh attestation download` writes the same shape.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const BUNDLE_NAME = "evidence.intoto.jsonl";

export function writeBundle(root = ".", evidence = "out") {
  const dir = join(root, evidence, "attestations");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sigstore.json")).sort() : [];
  const lines = files.map((f) => JSON.stringify(JSON.parse(readFileSync(join(dir, f), "utf8"))));
  const path = join(root, evidence, BUNDLE_NAME);
  writeFileSync(path, lines.join("\n") + (lines.length ? "\n" : ""));
  return path;
}

export function readBundle(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
