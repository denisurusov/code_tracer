package demo.fxquote;

/** Entry point: `java -jar fx-quote-demo-0.1.0.jar`, port from PORT (default 3000). */
public final class Main {
  private Main() {}

  public static void main(String[] args) throws Exception {
    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3000"));
    Server server = Server.start(port);
    System.out.println("fx-quote listening on http://127.0.0.1:" + server.port());
  }
}
