package demo.fxquote.steps;

import io.cucumber.java.AfterAll;
import io.cucumber.java.BeforeAll;
import java.io.File;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Runs the built jar (system property fxquote.jar) as a separate process, so the
 * integration, contract and UAT suites test the delivered artifact, not the
 * classes on the test classpath.
 */
public final class Service {
  private static Process process;
  private static String baseUrl;

  private Service() {}

  public static String baseUrl() {
    return baseUrl;
  }

  @BeforeAll
  public static void startJar() throws Exception {
    String jar = System.getProperty("fxquote.jar");
    if (jar == null || !new File(jar).isFile()) {
      throw new IllegalStateException("built jar not found (fxquote.jar=" + jar + "); run `mvn package` first");
    }
    int port;
    try (ServerSocket s = new ServerSocket(0)) {
      port = s.getLocalPort();
    }
    ProcessBuilder pb = new ProcessBuilder(ProcessHandle.current().info().command().orElse("java"), "-jar", jar);
    pb.environment().put("PORT", String.valueOf(port));
    pb.redirectErrorStream(true).redirectOutput(ProcessBuilder.Redirect.DISCARD);
    process = pb.start();
    baseUrl = "http://127.0.0.1:" + port;

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(200)).build();
    for (int i = 0; i < 100; i++) {
      try {
        if (client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/api/health")).build(),
            HttpResponse.BodyHandlers.discarding()).statusCode() == 200) return;
      } catch (Exception ignored) {
        // not up yet
      }
      Thread.sleep(100);
    }
    throw new IllegalStateException("service did not start from " + jar);
  }

  @AfterAll
  public static void stopJar() {
    if (process != null) process.destroy();
  }
}
