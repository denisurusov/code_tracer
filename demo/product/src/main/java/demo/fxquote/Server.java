package demo.fxquote;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/** FX Quote demo service: a JSON API and one static page, on the JDK's HTTP server. */
public final class Server {
  /**
   * The only ObjectMapper. Default typing is never enabled and request data is
   * never deserialized: the API is GET-only and reads query parameters, so
   * Jackson only ever serializes responses and reads the bundled rates file.
   */
  static final ObjectMapper MAPPER = JsonMapper.builder().build();

  private static final Pattern PAIR = Pattern.compile("^[A-Z]{6}$");
  private static final Set<String> QUERY_KEYS = Set.of("pair", "amount", "side");
  private static final Map<String, String[]> STATIC = Map.of(
      "/", new String[] {"index.html", "text/html; charset=utf-8"},
      "/index.html", new String[] {"index.html", "text/html; charset=utf-8"},
      "/app.js", new String[] {"app.js", "text/javascript; charset=utf-8"},
      "/app.css", new String[] {"app.css", "text/css; charset=utf-8"});

  private final List<Quote.Rate> rates;
  private final HttpServer http;

  private Server(List<Quote.Rate> rates, HttpServer http) {
    this.rates = rates;
    this.http = http;
  }

  public static List<Quote.Rate> loadRates() {
    try (InputStream in = Server.class.getResourceAsStream("/data/rates.json")) {
      return MAPPER.readValue(in, new TypeReference<List<Quote.Rate>>() {});
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  /** Start on `port` (0 = any free port) on the loopback interface. */
  public static Server start(int port) throws IOException {
    // Headers and body go out as separate writes; without TCP_NODELAY, Nagle's
    // algorithm plus delayed ACKs adds ~40 ms to every keep-alive response.
    // (Found by LOAD-003.) Read once, when the JDK server's config class loads.
    System.setProperty("sun.net.httpserver.nodelay", "true");
    HttpServer http = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
    Server server = new Server(loadRates(), http);
    http.createContext("/", server::handle);
    http.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    http.start();
    return server;
  }

  public int port() {
    return http.getAddress().getPort();
  }

  public void stop() {
    http.stop(0);
  }

  private void handle(HttpExchange ex) throws IOException {
    try (ex) {
      if (!"GET".equals(ex.getRequestMethod())) {
        sendJson(ex, 405, Map.of("error", "method not allowed"));
        return;
      }
      String path = ex.getRequestURI().getPath();
      String[] file = STATIC.get(path);
      if (file != null) {
        try (InputStream in = Server.class.getResourceAsStream("/public/" + file[0])) {
          send(ex, 200, file[1], in.readAllBytes());
        }
        return;
      }
      switch (path) {
        case "/api/health" -> sendJson(ex, 200, Map.of("status", "ok", "pairs", rates.size()));
        case "/api/pairs" -> sendJson(ex, 200, rates.stream().map(Quote.Rate::pair).toList());
        case "/api/quote" -> quote(ex);
        default -> sendJson(ex, 404, Map.of("error", "not found"));
      }
    }
  }

  private void quote(HttpExchange ex) throws IOException {
    Map<String, String> q = parseQuery(ex.getRequestURI().getRawQuery());
    String error = validate(q);
    if (error != null) {
      sendJson(ex, 400, Map.of("error", error));
      return;
    }
    if (Quote.findRate(rates, q.get("pair")).isEmpty()) {
      sendJson(ex, 404, Map.of("error", "unknown pair " + q.get("pair")));
      return;
    }
    sendJson(ex, 200, Quote.quote(rates, q.get("pair"), new BigDecimal(q.get("amount")), q.get("side"), Instant.now()));
  }

  /** Returns an error message, or null when the query is valid. */
  static String validate(Map<String, String> q) {
    for (String k : q.keySet()) if (!QUERY_KEYS.contains(k)) return "query must NOT have additional properties";
    for (String k : List.of("pair", "amount", "side")) if (!q.containsKey(k)) return "query must have required property '" + k + "'";
    if (!PAIR.matcher(q.get("pair")).matches()) return "pair must match pattern \"^[A-Z]{6}$\"";
    BigDecimal amount;
    try {
      amount = new BigDecimal(q.get("amount"));
    } catch (NumberFormatException e) {
      return "amount must be number";
    }
    if (amount.signum() <= 0) return "amount must be > 0";
    if (amount.compareTo(Quote.MAX_AMOUNT) > 0) return "amount must be <= 10000000";
    if (!Quote.SIDES.contains(q.get("side"))) return "side must be equal to one of the allowed values";
    return null;
  }

  static Map<String, String> parseQuery(String raw) {
    Map<String, String> out = new LinkedHashMap<>();
    if (raw == null || raw.isEmpty()) return out;
    for (String part : raw.split("&")) {
      int eq = part.indexOf('=');
      String k = URLDecoder.decode(eq < 0 ? part : part.substring(0, eq), StandardCharsets.UTF_8);
      String v = eq < 0 ? "" : URLDecoder.decode(part.substring(eq + 1), StandardCharsets.UTF_8);
      out.put(k, v);
    }
    return out;
  }

  private static void sendJson(HttpExchange ex, int status, Object body) throws IOException {
    send(ex, status, "application/json", MAPPER.writeValueAsBytes(body));
  }

  private static void send(HttpExchange ex, int status, String type, byte[] body) throws IOException {
    var h = ex.getResponseHeaders();
    h.set("content-type", type);
    h.set("cache-control", "no-store");
    h.set("x-content-type-options", "nosniff");
    h.set("content-security-policy", "default-src 'self'");
    ex.sendResponseHeaders(status, body.length);
    ex.getResponseBody().write(body);
  }
}
