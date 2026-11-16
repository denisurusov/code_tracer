// Demo identities and their cosign key pairs. Keys live in demo/.keys/
// (gitignored). The trust store maps each key's hint (as cosign writes it into a
// bundle) to an identity, the way a bank's gate would map a Sigstore certificate
// identity (workflow path or corporate email) under keyless signing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateKeyPair, keyHint, offlineSigningConfig } from "./cosign.mjs";

export const KEY_DIR = ".keys";
export const TRUST_PATH = `${KEY_DIR}/trust.json`;

// Workflow identities carry the certificate identity that keyless signing
// produces: the GitHub Actions OIDC issuer and the reusable workflow's URL
// (Fulcio puts job_workflow_ref, "<workflow URL>@<git ref>", in the certificate's
// SAN). Which git refs are trusted is gate policy (trusted_refs). Under key
// signing the same identities sign with demo keys.
const OIDC_GITHUB = "https://token.actions.githubusercontent.com";
const wf = (file) => `https://github.com/denisurusov/code_tracer/.github/workflows/${file}`;

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Certificate identity regexp for a workflow identity and a list of trusted ref regexps. */
export const identityRegexp = (keyless, refRegexps) => `^${escape(keyless.workflow)}@(${refRegexps.join("|")})$`;

export const IDENTITIES = {
  "build-service": {
    kind: "workflow",
    name: "denisurusov/code_tracer/.github/workflows/demo-build.yml",
    note: "Isolated build workflow; signs SLSA provenance only.",
    keyless: { issuer: OIDC_GITHUB, workflow: wf("demo-build.yml") },
  },
  "ci-pipeline": {
    kind: "workflow",
    name: "denisurusov/code_tracer/.github/workflows/demo-tests.yml",
    note: "Test workflow; signs every automated test category except load.",
    keyless: { issuer: OIDC_GITHUB, workflow: wf("demo-tests.yml") },
  },
  "perf-env": {
    kind: "workflow",
    name: "denisurusov/code_tracer/.github/workflows/demo-load.yml",
    note: "Load-test workflow (stands for a separate performance environment).",
    keyless: { issuer: OIDC_GITHUB, workflow: wf("demo-load.yml") },
  },
  "alice.chen": { kind: "person", name: "Alice Chen", role: "UX lead", email: "alice.chen@example.com" },
  "raj.patel": { kind: "person", name: "Raj Patel", role: "Business owner, FX e-trading", email: "raj.patel@example.com" },
  "bank-gate": { kind: "service", name: "bank ingestion gate (demo)", note: "Signs the verification summary (VSA)." },
};

export function ensureKeys(dir = KEY_DIR, ids = Object.keys(IDENTITIES)) {
  mkdirSync(dir, { recursive: true });
  const trustPath = `${dir}/trust.json`;
  const trust = existsSync(trustPath) ? JSON.parse(readFileSync(trustPath, "utf8")) : {};
  let changed = !existsSync(trustPath);
  for (const [id, identity] of Object.entries(IDENTITIES).filter(([id]) => ids.includes(id))) {
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
