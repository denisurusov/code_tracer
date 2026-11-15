// Data quality rules over product/data/rates.json, run with node:test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync(new URL("../../product/data/rates.json", import.meta.url), "utf8"));

test("DATA-001 pairs are unique 6-letter codes", () => {
  const pairs = rows.map((r) => r.pair);
  assert.deepEqual(pairs.filter((p) => !/^[A-Z]{6}$/.test(p)), []);
  assert.equal(new Set(pairs).size, pairs.length, "duplicate pairs");
});

test("DATA-002 mid is positive and spread is 0-50 bps", () => {
  assert.deepEqual(rows.filter((r) => !(r.mid > 0) || !(r.spreadBps >= 0 && r.spreadBps <= 50)).map((r) => r.pair), []);
});

test("DATA-003 decimal places match market convention", () => {
  const wrong = rows.filter((r) => r.dp !== (r.pair.endsWith("JPY") ? 3 : 5));
  assert.deepEqual(wrong.map((r) => r.pair), []);
});

test("DATA-004 all rows share one valid snapshot timestamp", () => {
  const stamps = new Set(rows.map((r) => r.asOf));
  assert.equal(stamps.size, 1, `multiple snapshots: ${[...stamps].join(", ")}`);
  assert.ok(!Number.isNaN(Date.parse([...stamps][0])));
});
