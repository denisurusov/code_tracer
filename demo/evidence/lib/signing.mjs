// Signing for every evidence producer. Two modes, same Sigstore bundle format:
//
//   key      (default)  cosign key pair per identity in .keys/, offline signing
//                       config: no Fulcio certificate, no Rekor entry.
//   keyless  (CI)       DEMO_SIGNING=keyless: workflow identities sign with cosign
//                       keyless (GitHub Actions OIDC -> Fulcio certificate, Rekor
//                       entry, timestamp). The certificate names the workflow
//                       that ran, so build, tests and load run in separate
//                       reusable workflows to get separate identities.
//
// People (named sign-offs) and the bank's gate always sign with keys here: a
// workflow cannot sign as a person, and in production they would use cosign
// keyless interactively with their corporate identity.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { signStatement as signWithKey } from "./cosign.mjs";
import { IDENTITIES, keyPath, signingConfig } from "./keys.mjs";

export const signingMode = () => process.env.DEMO_SIGNING ?? "key";

export function signStatement(statement, identityId, out, { keyDir } = {}) {
  const identity = IDENTITIES[identityId];
  if (!identity) throw new Error(`unknown identity ${identityId}`);
  if (signingMode() === "keyless" && identity.kind === "workflow") return signKeyless(statement, out);
  return signWithKey(statement, keyDir ? join(keyDir, `${identityId}.key`) : keyPath(identityId), out,
    keyDir ? join(keyDir, "signing-config.offline.json") : signingConfig());
}

function signKeyless(statement, out) {
  const dir = mkdtempSync(join(tmpdir(), "cosign-keyless-"));
  try {
    const st = join(dir, "statement.json");
    writeFileSync(st, JSON.stringify(statement));
    const r = spawnSync("cosign", ["attest-blob", "--statement", st, "--bundle", out, "--yes"], { encoding: "utf8", env: { ...process.env, COSIGN_YES: "true" } });
    if (r.status !== 0) throw new Error(`cosign keyless attest-blob failed: ${r.stderr}`);
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
