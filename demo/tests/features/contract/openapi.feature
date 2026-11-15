Feature: API responses conform to the published OpenAPI contract
  Every response body is validated against the schema that product/openapi.json
  declares for that operation and status code.

  Background:
    Given the FX Quote service is running

  @id:API-001
  Scenario: API-001 Health matches the Health schema
    When I GET "/api/health"
    Then the response conforms to the OpenAPI response for "/api/health"

  @id:API-002
  Scenario: API-002 Pairs matches the Pairs schema
    When I GET "/api/pairs"
    Then the response conforms to the OpenAPI response for "/api/pairs"

  @id:API-003
  Scenario Outline: API-003 Quote matches the Quote schema (<side>)
    When I request a quote for 2500 "GBPUSD" on the "<side>" side
    Then the response status is 200
    And the response conforms to the OpenAPI response for "/api/quote"

    Examples:
      | side |
      | buy  |
      | sell |

  @id:API-004
  Scenario Outline: API-004 Errors match the Error schema (<status>)
    When I GET "/api/quote?<query>"
    Then the response status is <status>
    And the response conforms to the OpenAPI response for "/api/quote"

    Examples:
      | status | query                          |
      | 400    | pair=EURUSD&amount=0&side=buy  |
      | 404    | pair=ZZZAAA&amount=1&side=buy  |
