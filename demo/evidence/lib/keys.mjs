// Demo identities and their cosign key pairs. Keys live in demo/.keys/
// (gitignored). The trust store maps each key's hint (as cosign writes it into a
// bundle) to an identity, the way a bank's gate would map a Sigstore certificate
// identity (workflow path or corporate email) under keyless signing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateKeyPair, keyHint, offlineSigningConfig } from "./cosign.mjs";

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

export function ensureKeys(dir = KEY_DIR) {
  mkdirSync(dir, { recursive: true });
  const trustPath = `${dir}/trust.json`;
  const trust = existsSync(trustPath) ? JSON.parse(readFileSync(trustPath, "utf8")) : {};
  let changed = !existsSync(trustPath);
  for (const [id, identity] of Object.entries(IDENTITIES)) {
    if (!existsSync(`${dir}/${id}.key`)) { generateKeyPair(`${dir}/${id}`); changed = true; }
    const publicKeyPem = readFileSync(`${dir}/${id}.pub`, "utf8");
    const hint = keyHint(publicKeyPem);
    if (!trust[hint]) { trust[hint] = { identity: { id, ...identity }, publicKeyPem }; changed = true; }
  }
  if (changed) writeFileSync(trustPath, JSON.stringify(trust, null, 2));
  offlineSigningConfig(dir);
  return trust;
}

export const keyPath = (id, dir = KEY_DIR) => (ensureKeys(dir), `${dir}/${id}.key`);
export const signingConfig = (dir = KEY_DIR) => offlineSigningConfig(dir);

export function loadTrust(path = TRUST_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}
