Feature: FX Quote service over HTTP
  The running service loads the rates table and prices quotes from it.

  Background:
    Given the FX Quote service is running

  @id:INT-001
  Scenario: INT-001 Health reports the loaded pairs
    When I GET "/api/health"
    Then the response status is 200
    And the response field "status" is "ok"
    And the response field "pairs" is 5

  @id:INT-002
  Scenario: INT-002 Quote is priced from the loaded rates
    When I request a quote for 1000 "EURUSD" on the "buy" side
    Then the response status is 200
    And the response field "price" is 1.08485
    And the response field "converted" is 1084.85

  @id:INT-003
  Scenario Outline: INT-003 Invalid query is refused (<case>)
    When I GET "/api/quote?<query>"
    Then the response status is 400
    And the response has an error message

    Examples:
      | case             | query                              |
      | negative amount  | pair=EURUSD&amount=-5&side=buy     |
      | missing side     | pair=EURUSD&amount=10              |
      | bad side         | pair=EURUSD&amount=10&side=hold    |
      | lowercase pair   | pair=eurusd&amount=10&side=buy     |
      | amount too large | pair=EURUSD&amount=20000000&side=buy |

  @id:INT-004
  Scenario: INT-004 Unknown pair is refused
    When I request a quote for 10 "XXXYYY" on the "buy" side
    Then the response status is 404
    And the response has an error message
