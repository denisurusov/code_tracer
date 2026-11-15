// DSSE envelopes (https://github.com/secure-systems-lab/dsse) with Ed25519 keys.
// In CI this step would be Sigstore keyless signing; the demo uses local keys so
// it runs offline. The envelope format is the same either way.
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { sha256 } from "./digest.mjs";

export const IN_TOTO_PAYLOAD_TYPE = "application/vnd.in-toto+json";

/** DSSE pre-authentication encoding. */
export function pae(payloadType, payload) {
  const t = Buffer.from(payloadType);
  return Buffer.concat([Buffer.from(`DSSEv1 ${t.length} `), t, Buffer.from(` ${payload.length} `), payload]);
}

export function keyId(publicKeyPem) {
  const der = createPublicKey(publicKeyPem).export({ type: "spki", format: "der" });
  return `sha256:${sha256(der)}`;
}

export function generateKey() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  const publicPem = publicKey.export({ type: "spki", format: "pem" });
  return { privatePem, publicPem, keyid: keyId(publicPem) };
}

export function signEnvelope(statement, privatePem) {
  const payload = Buffer.from(JSON.stringify(statement));
  const key = createPrivateKey(privatePem);
  const publicPem = createPublicKey(key).export({ type: "spki", format: "pem" });
  const sig = sign(null, pae(IN_TOTO_PAYLOAD_TYPE, payload), key);
  return {
    payloadType: IN_TOTO_PAYLOAD_TYPE,
    payload: payload.toString("base64"),
    signatures: [{ keyid: keyId(publicPem), sig: sig.toString("base64") }],
  };
}

/** Returns { ok, keyid, statement, reason }. `trust` maps keyid -> { publicKeyPem, identity }. */
export function verifyEnvelope(env, trust) {
  const payload = Buffer.from(env.payload, "base64");
  let statement;
  try { statement = JSON.parse(payload.toString("utf8")); } catch { return { ok: false, reason: "payload is not JSON" }; }
  for (const s of env.signatures ?? []) {
    const t = trust[s.keyid];
    if (!t) return { ok: false, trusted: false, keyid: s.keyid, statement, reason: `unknown key ${s.keyid}` };
    const good = verify(null, pae(env.payloadType, payload), createPublicKey(t.publicKeyPem), Buffer.from(s.sig, "base64"));
    return good
      ? { ok: true, trusted: true, keyid: s.keyid, identity: t.identity, statement }
      : { ok: false, trusted: true, keyid: s.keyid, identity: t.identity, statement, reason: "signature does not verify" };
  }
  return { ok: false, reason: "no signatures" };
}
