package demo.fxquote;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Unit tests. Each display name starts with its catalog ID. */
class QuoteTest {
  private static final List<Quote.Rate> RATES = Server.loadRates();

  private static BigDecimal d(String s) {
    return new BigDecimal(s);
  }

  private static void assertNumEquals(String expected, BigDecimal actual) {
    assertEquals(0, d(expected).compareTo(actual), () -> expected + " != " + actual);
  }

  @Test
  @DisplayName("UNIT-001 buy price is mid plus half the spread")
  void buy() {
    assertNumEquals("1.001", Quote.applySpread(d("1.0"), d("20"), "buy"));
  }

  @Test
  @DisplayName("UNIT-002 sell price is mid minus half the spread")
  void sell() {
    assertNumEquals("0.999", Quote.applySpread(d("1.0"), d("20"), "sell"));
  }

  @Test
  @DisplayName("UNIT-003 zero spread returns mid on both sides")
  void zeroSpread() {
    assertNumEquals("1.25", Quote.applySpread(d("1.25"), d("0"), "buy"));
    assertNumEquals("1.25", Quote.applySpread(d("1.25"), d("0"), "sell"));
  }

  @Test
  @DisplayName("UNIT-004 invalid mid, spread or side is rejected")
  void invalidInputs() {
    assertThrows(IllegalArgumentException.class, () -> Quote.applySpread(d("0"), d("10"), "buy"));
    assertThrows(IllegalArgumentException.class, () -> Quote.applySpread(d("1"), d("-1"), "buy"));
    assertThrows(IllegalArgumentException.class, () -> Quote.applySpread(d("1"), d("10"), "hold"));
  }

  @Test
  @DisplayName("UNIT-005 quote rounds price to pair dp and converted to 2 dp")
  void rounding() {
    Quote.Result q = Quote.quote(RATES, "EURUSD", d("1000"), "buy", Instant.parse("2026-11-15T00:00:00Z"));
    assertNumEquals("1.08485", q.price());
    assertNumEquals("1084.85", q.converted());
    assertNumEquals("-1.01", Quote.round(d("-1.005"), 2));
  }

  @Test
  @DisplayName("UNIT-006 out-of-range amount and unknown pair are rejected")
  void outOfRange() {
    Instant now = Instant.now();
    assertThrows(IllegalArgumentException.class, () -> Quote.quote(RATES, "EURUSD", d("0"), "buy", now));
    assertThrows(IllegalArgumentException.class, () -> Quote.quote(RATES, "EURUSD", d("10000001"), "buy", now));
    assertThrows(IllegalArgumentException.class, () -> Quote.quote(RATES, "XXXYYY", d("1"), "buy", now));
  }

  /**
   * Proof test cited by OpenVEX (tests/sca/fixtures/vex-jackson-not-affected.openvex.json):
   * the mapper has no default typing, and request data never reaches Jackson for
   * deserialization, so a polymorphic-deserialization flaw cannot be triggered.
   */
  @Test
  @DisplayName("UNIT-007 no default typing and request bodies are never deserialized")
  void noUntrustedDeserialization() throws Exception {
    assertNull(Server.MAPPER.getDeserializationConfig().getDefaultTyper(null), "default typing is enabled");
    Server server = Server.start(0);
    try {
      HttpClient client = HttpClient.newHttpClient();
      String gadget = "[\"com.example.Gadget\",{\"cmd\":\"x\"}]";
      for (String path : List.of("/api/quote", "/api/pairs", "/")) {
        HttpResponse<String> r = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.port() + path))
            .header("content-type", "application/json").POST(HttpRequest.BodyPublishers.ofString(gadget)).build(),
            HttpResponse.BodyHandlers.ofString());
        assertEquals(405, r.statusCode(), "non-GET request to " + path + " was not refused");
      }
    } finally {
      server.stop();
    }
  }
}
