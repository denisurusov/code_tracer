#!/usr/bin/env node
// Named human sign-off. The reviewer signs a test-result statement with their own
// key (in production: Sigstore keyless with their corporate identity), so the
// record proves who accepted, not which workflow ran.
//
//   node evidence/signoff.mjs --category ux-signoff --reviewer alice.chen \
//     --result PASSED --evidence tests/ux/findings.md
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { CATALOG_PATH, idsFor, loadCatalog, scenariosFor } from "./lib/catalog.mjs";
import { descriptor } from "./lib/digest.mjs";
import { buildStatement } from "./lib/statement.mjs";
import { signEnvelope } from "./lib/dsse.mjs";
import { IDENTITIES, privateKey } from "./lib/keys.mjs";

const { values } = parseArgs({
  options: {
    category: { type: "string" },
    reviewer: { type: "string" },
    result: { type: "string", default: "PASSED" },
    evidence: { type: "string", multiple: true, default: [] },
    out: { type: "string" },
  },
});
const { category, reviewer, result } = values;
if (!["ux-signoff", "uat-signoff"].includes(category)) throw new Error("--category must be ux-signoff or uat-signoff");
if (!IDENTITIES[reviewer] || IDENTITIES[reviewer].kind !== "person") throw new Error(`--reviewer must be a person: ${Object.keys(IDENTITIES).join(", ")}`);
if (!["PASSED", "FAILED"].includes(result)) throw new Error("--result must be PASSED or FAILED");

const catalog = loadCatalog();
const ids = idsFor(catalog, category);
const now = Date.now();
const statement = buildStatement({
  category,
  classified: { passed: result === "PASSED" ? ids : [], warned: [], failed: result === "PASSED" ? [] : ids, missing: [], unknown: [] },
  configuration: [
    descriptor(CATALOG_PATH, { role: "catalog" }),
    ...scenariosFor(catalog, category).map((p) => descriptor(p, { role: "scenario" })),
    ...values.evidence.map((p) => descriptor(p, { role: "report", format: "document" })),
  ],
  started: now,
  finished: now,
  tool: { name: "human sign-off" },
  extra: { reviewer: { id: reviewer, name: IDENTITIES[reviewer].name, role: IDENTITIES[reviewer].role } },
});
statement.predicate.url = `signoff://${reviewer}/${new Date(now).toISOString()}`;

const envelope = signEnvelope(statement, privateKey(reviewer));
const out = values.out ?? `out/attestations/${category}.dsse.json`;
mkdirSync("out/attestations", { recursive: true });
writeFileSync(out, JSON.stringify(envelope, null, 2));
console.log(`${IDENTITIES[reviewer].name} signed ${category} (${ids.join(", ")}): ${result} -> ${out}`);
