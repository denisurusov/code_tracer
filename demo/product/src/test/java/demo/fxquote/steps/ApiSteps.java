package demo.fxquote.steps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/** HTTP and OpenAPI-contract steps for the integration and contract features. */
public class ApiSteps {
  private static final ObjectMapper JSON = new ObjectMapper();
  private static final HttpClient CLIENT = HttpClient.newHttpClient();
  private static final JsonNode OPENAPI = loadOpenApi();

  private String path;
  private int status;
  private JsonNode body;

  private static JsonNode loadOpenApi() {
    try (InputStream in = ApiSteps.class.getResourceAsStream("/openapi.json")) {
      return JSON.readTree(in);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @Given("the FX Quote service is running")
  public void serviceRunning() {
    assertNotNull(Service.baseUrl(), "service not started");
  }

  @When("I GET {string}")
  public void get(String pathAndQuery) throws Exception {
    path = pathAndQuery.split("\\?")[0];
    HttpResponse<String> r = CLIENT.send(HttpRequest.newBuilder(URI.create(Service.baseUrl() + pathAndQuery)).build(),
        HttpResponse.BodyHandlers.ofString());
    status = r.statusCode();
    body = JSON.readTree(r.body());
  }

  @When("I request a quote for {bigdecimal} {string} on the {string} side")
  public void requestQuote(BigDecimal amount, String pair, String side) throws Exception {
    get("/api/quote?pair=" + enc(pair) + "&amount=" + enc(amount.toPlainString()) + "&side=" + enc(side));
  }

  @Then("the response status is {int}")
  public void status(int expected) {
    assertEquals(expected, status, () -> body.toString());
  }

  @Then("the response field {string} is {string}")
  public void fieldString(String field, String value) {
    assertEquals(value, body.path(field).asText());
  }

  @Then("the response field {string} is {bigdecimal}")
  public void fieldNumber(String field, BigDecimal value) {
    assertTrue(body.path(field).isNumber(), field + " is not a number");
    assertEquals(0, value.compareTo(body.path(field).decimalValue()), () -> field + " = " + body.path(field));
  }

  @Then("the response has an error message")
  public void hasError() {
    assertTrue(body.path("error").isTextual() && !body.path("error").asText().isEmpty(), body.toString());
  }

  @Then("the response conforms to the OpenAPI response for {string}")
  public void conforms(String opPath) {
    JsonNode response = OPENAPI.path("paths").path(opPath).path("get").path("responses").path(String.valueOf(status));
    assertTrue(!response.isMissingNode(), "openapi.json declares no " + status + " response for " + opPath);
    JsonSchema schema = schemaFor(response.path("content").path("application/json").path("schema"));
    Set<ValidationMessage> errors = schema.validate(body);
    assertTrue(errors.isEmpty(), errors::toString);
  }

  /** Wrap an OpenAPI schema with the document's components as $defs, so $refs resolve. */
  private static JsonSchema schemaFor(JsonNode schema) {
    String defs = OPENAPI.path("components").path("schemas").toString().replace("#/components/schemas/", "#/$defs/");
    String own = schema.toString().replace("#/components/schemas/", "#/$defs/");
    try {
      ObjectNode node = (ObjectNode) JSON.readTree(own);
      node.put("$schema", "https://json-schema.org/draft/2020-12/schema");
      node.set("$defs", JSON.readTree(defs));
      return JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012).getSchema(node);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private static String enc(String s) {
    return URLEncoder.encode(s, StandardCharsets.UTF_8);
  }
}
