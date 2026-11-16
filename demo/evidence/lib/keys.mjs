// Demo identities and their keys. Private keys live in demo/.keys/ (gitignored);
// the trust store maps each key ID to an identity, the way a bank's gate would
// map a Sigstore certificate identity (workflow path or corporate email).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateKey, keyId } from "./dsse.mjs";

export const KEY_DIR = ".keys";
export const TRUST_PATH = `${KEY_DIR}/trust.json`;

export const IDENTITIES = {
  "build-service": {
    kind: "workflow",
    name: "org/test-evidence/.github/workflows/build.yml@refs/tags/v1",
    note: "Stands for an isolated build workflow's Sigstore identity; signs SLSA provenance only.",
  },
  "ci-pipeline": {
    kind: "workflow",
    name: "org/test-evidence/.github/workflows/evidence.yml@refs/tags/v1",
    note: "Stands for the central reusable workflow's Sigstore identity.",
  },
  "perf-env": {
    kind: "workflow",
    name: "org/test-evidence/.github/workflows/load.yml@refs/tags/v1 (self-hosted perf runner)",
    note: "Load tests run in a separate performance environment with its own identity.",
  },
  "alice.chen": { kind: "person", name: "Alice Chen", role: "UX lead", email: "alice.chen@example.com" },
  "raj.patel": { kind: "person", name: "Raj Patel", role: "Business owner, FX e-trading", email: "raj.patel@example.com" },
  "bank-gate": { kind: "service", name: "bank ingestion gate (demo)", note: "Signs the verification summary (VSA)." },
};

export function ensureKeys() {
  mkdirSync(KEY_DIR, { recursive: true });
  const trust = existsSync(TRUST_PATH) ? JSON.parse(readFileSync(TRUST_PATH, "utf8")) : {};
  for (const [id, identity] of Object.entries(IDENTITIES)) {
    const path = `${KEY_DIR}/${id}.key`;
    if (!existsSync(path)) {
      const k = generateKey();
      writeFileSync(path, k.privatePem, { mode: 0o600 });
      writeFileSync(`${KEY_DIR}/${id}.pub`, k.publicPem);
    }
    const publicKeyPem = readFileSync(`${KEY_DIR}/${id}.pub`, "utf8");
    trust[keyId(publicKeyPem)] = { identity: { id, ...identity }, publicKeyPem };
  }
  writeFileSync(TRUST_PATH, JSON.stringify(trust, null, 2));
  return trust;
}

export function privateKey(id) {
  ensureKeys();
  return readFileSync(`${KEY_DIR}/${id}.key`, "utf8");
}

export function loadTrust(path = TRUST_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}
