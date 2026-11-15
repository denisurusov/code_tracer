// Pure quote logic. No I/O, so the unit tests can exercise it directly.

export const SIDES = Object.freeze(["buy", "sell"]);
export const MAX_AMOUNT = 10_000_000;

/** Round half away from zero to `dp` decimal places. */
export function round(value, dp) {
  // Shift via the decimal exponent so 1.005 rounds to 1.01 (1.005 * 100 is 100.4999… in binary).
  const shifted = Math.round(Number(`${Math.abs(value)}e${dp}`));
  return Math.sign(value) * Number(`${shifted}e-${dp}`);
}

/**
 * Price after spread. A client buying the base currency pays above mid;
 * a client selling receives below mid. Half the spread is applied each side.
 */
export function applySpread(mid, spreadBps, side) {
  if (!(mid > 0)) throw new RangeError("mid must be positive");
  if (!(spreadBps >= 0)) throw new RangeError("spreadBps must be non-negative");
  if (!SIDES.includes(side)) throw new RangeError(`side must be one of ${SIDES.join(", ")}`);
  const half = spreadBps / 2 / 10_000;
  return side === "buy" ? mid * (1 + half) : mid * (1 - half);
}

/** Look up a pair in the rates table. Returns undefined when unknown. */
export function findRate(rates, pair) {
  return rates.find((r) => r.pair === pair);
}

/**
 * Build a quote. `amount` is in the base currency; `converted` is in the quote
 * currency. Throws RangeError on any invalid input.
 */
export function quote(rates, { pair, amount, side }, now = new Date()) {
  const rate = findRate(rates, pair);
  if (!rate) throw new RangeError(`unknown pair ${pair}`);
  if (!(amount > 0) || amount > MAX_AMOUNT) {
    throw new RangeError(`amount must be > 0 and <= ${MAX_AMOUNT}`);
  }
  const price = round(applySpread(rate.mid, rate.spreadBps, side), rate.dp);
  return {
    pair,
    side,
    amount,
    mid: rate.mid,
    spreadBps: rate.spreadBps,
    price,
    converted: round(amount * price, 2),
    rateAsOf: rate.asOf,
    quotedAt: now.toISOString(),
  };
}
