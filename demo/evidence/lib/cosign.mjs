// Signing and verification with cosign (Sigstore). Every attestation is a
// Sigstore bundle (application/vnd.dev.sigstore.bundle.v0.3+json) wrapping a DSSE
// envelope whose payload is the in-toto statement.
//
// The demo signs with cosign key pairs and an empty signing config (no Fulcio,
// no Rekor, no timestamp authority), so it runs offline and leaves nothing in a
// public log. Switching to keyless signing is a signing-config and verification
// flag change; the bundle format stays the same.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, createPublicKey } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const BUNDLE_MEDIA_TYPE = "application/vnd.dev.sigstore.bundle.v0.3+json";
const ENV = { ...process.env, COSIGN_PASSWORD: process.env.COSIGN_PASSWORD ?? "", COSIGN_YES: "true" };

export function cosignVersion() {
  try {
    return execFileSync("cosign", ["version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
      .split("\n").find((l) => l.startsWith("GitVersion"))?.split(/\s+/)[1] ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** The key hint cosign writes into a bundle: base64(sha256(SPKI DER of the public key)). */
export function keyHint(publicKeyPem) {
  const der = createPublicKey(publicKeyPem).export({ type: "spki", format: "der" });
  return createHash("sha256").update(der).digest("base64");
}

/** An empty signing config: key-based signing with no transparency log or TSA. */
export function offlineSigningConfig(dir) {
  const path = join(dir, "signing-config.offline.json");
  if (!existsSync(path)) {
    const r = spawnSync("cosign", ["signing-config", "create", "--out", path], { encoding: "utf8", env: ENV });
    if (r.status !== 0) throw new Error(`cosign signing-config create failed: ${r.stderr}`);
  }
  return path;
}

export function generateKeyPair(prefix) {
  const r = spawnSync("cosign", ["generate-key-pair", "--output-key-prefix", prefix], { encoding: "utf8", env: ENV });
  if (r.status !== 0) throw new Error(`cosign generate-key-pair failed: ${r.stderr}`);
  return { key: `${prefix}.key`, pub: `${prefix}.pub` };
}

/** Sign an in-toto statement with `cosign attest-blob --statement`, writing a Sigstore bundle to `out`. */
export function signStatement(statement, keyPath, out, signingConfig) {
  const dir = mkdtempSync(join(tmpdir(), "cosign-"));
  try {
    const st = join(dir, "statement.json");
    writeFileSync(st, JSON.stringify(statement));
    const r = spawnSync("cosign", ["attest-blob", "--key", keyPath, "--statement", st, "--bundle", out,
      "--signing-config", signingConfig, "--yes"], { encoding: "utf8", env: ENV });
    if (r.status !== 0) throw new Error(`cosign attest-blob failed: ${r.stderr}`);
    return out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Decode the statement carried in a Sigstore bundle (no verification). */
export function statementOf(bundle) {
  try {
    return JSON.parse(Buffer.from(bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Verify a bundle with `cosign verify-blob-attestation`: the signature is valid
 * for `publicKeyPem`, the predicate type is `type`, and `sha256` is one of the
 * statement's subjects. Returns { ok, reason }.
 */
export function verifyBundle(bundlePath, publicKeyPem, type, sha256) {
  const dir = mkdtempSync(join(tmpdir(), "cosign-verify-"));
  try {
    const pub = join(dir, "key.pub");
    writeFileSync(pub, publicKeyPem);
    const r = spawnSync("cosign", ["verify-blob-attestation", "--key", pub, "--bundle", bundlePath, "--type", type,
      "--insecure-ignore-tlog", "--digest", sha256, "--digestAlg", "sha256"], { encoding: "utf8", env: ENV });
    if (r.status === 0) return { ok: true };
    const reason = (r.stderr || r.stdout).split("\n").filter((l) => l.startsWith("Error:") || l.includes("error during"))[0] ?? `exit ${r.status}`;
    return { ok: false, reason: reason.replace(/^Error:\s*/, "").trim() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
