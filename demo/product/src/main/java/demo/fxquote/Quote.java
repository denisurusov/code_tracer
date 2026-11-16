package demo.fxquote;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Pure quote logic. No I/O, so the unit tests can exercise it directly. */
public final class Quote {
  public static final List<String> SIDES = List.of("buy", "sell");
  public static final BigDecimal MAX_AMOUNT = new BigDecimal("10000000");

  private Quote() {}

  /** One row of the rates table. */
  public record Rate(String pair, BigDecimal mid, BigDecimal spreadBps, int dp, String asOf) {}

  /** A priced quote, as returned by the API. */
  public record Result(String pair, String side, BigDecimal amount, BigDecimal mid, BigDecimal spreadBps,
                       BigDecimal price, BigDecimal converted, String rateAsOf, String quotedAt) {}

  /**
   * Price after spread. A client buying the base currency pays above mid; a client
   * selling receives below mid. Half the spread is applied on each side.
   */
  public static BigDecimal applySpread(BigDecimal mid, BigDecimal spreadBps, String side) {
    if (mid == null || mid.signum() <= 0) throw new IllegalArgumentException("mid must be positive");
    if (spreadBps == null || spreadBps.signum() < 0) throw new IllegalArgumentException("spreadBps must be non-negative");
    if (!SIDES.contains(side)) throw new IllegalArgumentException("side must be one of buy, sell");
    BigDecimal half = spreadBps.divide(new BigDecimal("20000"));
    return "buy".equals(side) ? mid.multiply(BigDecimal.ONE.add(half)) : mid.multiply(BigDecimal.ONE.subtract(half));
  }

  /** Round half away from zero. */
  public static BigDecimal round(BigDecimal value, int dp) {
    return value.setScale(dp, RoundingMode.HALF_UP);
  }

  public static Optional<Rate> findRate(List<Rate> rates, String pair) {
    return rates.stream().filter(r -> r.pair().equals(pair)).findFirst();
  }

  /** Build a quote. `amount` is in the base currency; `converted` is in the quote currency. */
  public static Result quote(List<Rate> rates, String pair, BigDecimal amount, String side, Instant now) {
    Rate rate = findRate(rates, pair).orElseThrow(() -> new IllegalArgumentException("unknown pair " + pair));
    if (amount == null || amount.signum() <= 0 || amount.compareTo(MAX_AMOUNT) > 0) {
      throw new IllegalArgumentException("amount must be > 0 and <= " + MAX_AMOUNT.toPlainString());
    }
    BigDecimal price = round(applySpread(rate.mid(), rate.spreadBps(), side), rate.dp());
    return new Result(pair, side, amount, rate.mid(), rate.spreadBps(), price,
        round(amount.multiply(price), 2), rate.asOf(), now.toString());
  }
}
