#!/usr/bin/env node
// Named human sign-off. The reviewer signs a test-result statement with their own
// cosign key (in production: cosign keyless with their corporate identity), so
// the record proves who accepted, not which workflow ran.
//
//   node evidence/signoff.mjs --category ux-signoff --reviewer alice.chen \
//     --result PASSED --evidence tests/ux/findings.md
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { CATALOG_PATH, idsFor, loadCatalog, scenariosFor } from "./lib/catalog.mjs";
import { descriptor } from "./lib/digest.mjs";
import { buildStatement } from "./lib/statement.mjs";
import { signStatement } from "./lib/cosign.mjs";
import { IDENTITIES, keyPath, signingConfig } from "./lib/keys.mjs";
import { writeBundle } from "./lib/bundle.mjs";

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

const out = values.out ?? `out/attestations/${category}.sigstore.json`;
mkdirSync("out/attestations", { recursive: true });
signStatement(statement, keyPath(reviewer), out, signingConfig());
writeBundle();
console.log(`${IDENTITIES[reviewer].name} signed ${category} (${ids.join(", ")}): ${result} -> ${out}`);
