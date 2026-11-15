// Unit tests. Each test name starts with its catalog ID.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applySpread, quote, round } from "../../product/lib/quote.mjs";
import { loadRates } from "../../product/server.mjs";

const rates = loadRates();
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test("UNIT-001 buy price is mid plus half the spread", () => {
  close(applySpread(1.0, 20, "buy"), 1.001);
});

test("UNIT-002 sell price is mid minus half the spread", () => {
  close(applySpread(1.0, 20, "sell"), 0.999);
});

test("UNIT-003 zero spread returns mid on both sides", () => {
  close(applySpread(1.25, 0, "buy"), 1.25);
  close(applySpread(1.25, 0, "sell"), 1.25);
});

test("UNIT-004 invalid mid, spread or side is rejected", () => {
  assert.throws(() => applySpread(0, 10, "buy"), RangeError);
  assert.throws(() => applySpread(1, -1, "buy"), RangeError);
  assert.throws(() => applySpread(1, 10, "hold"), RangeError);
});

test("UNIT-005 quote rounds price to pair dp and converted to 2 dp", () => {
  const q = quote(rates, { pair: "EURUSD", amount: 1000, side: "buy" }, new Date("2026-11-15T00:00:00Z"));
  assert.equal(q.price, 1.08485);
  assert.equal(q.converted, 1084.85);
  assert.equal(round(-1.005, 2), -1.01);
});

test("UNIT-006 out-of-range amount and unknown pair are rejected", () => {
  assert.throws(() => quote(rates, { pair: "EURUSD", amount: 0, side: "buy" }), RangeError);
  assert.throws(() => quote(rates, { pair: "EURUSD", amount: 10_000_001, side: "buy" }), RangeError);
  assert.throws(() => quote(rates, { pair: "XXXYYY", amount: 1, side: "buy" }), RangeError);
});

// Proof test cited by OpenVEX (tests/sca/fixtures/vex-ajv-not-affected.openvex.json):
// user input never reaches ajv as a schema, so a schema-injection flaw in ajv
// cannot be triggered through this product.
test("UNIT-007 request handling compiles no schemas; the only ajv schema is static", async () => {
  const { default: Ajv } = await import("ajv");
  const original = Ajv.prototype.compile;
  let compiles = 0;
  Ajv.prototype.compile = function (...args) { compiles++; return original.apply(this, args); };
  try {
    const { start } = await import(`../../product/server.mjs?unit007=${Date.now()}`);
    assert.equal(compiles, 1, "expected exactly one schema compiled at module load");
    const { server, url } = await start(0);
    for (const q of ["pair=EURUSD&amount=1&side=buy", "pair=%5E(a%2B)%2B%24&amount=1&side=buy", "pattern=.*&amount=1", "$schema=x"]) {
      await fetch(`${url}/api/quote?${q}`);
    }
    await new Promise((r) => server.close(r));
    assert.equal(compiles, 1, "a request caused a schema compilation");
  } finally {
    Ajv.prototype.compile = original;
  }
});
