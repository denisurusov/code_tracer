Feature: Trader gets an indicative FX quote
  As a trader
  I want an indicative price before I commit
  So that I know what a trade will cost in the quote currency

  Background:
    Given I have the FX Quote page open

  @id:UAT-001
  Scenario: UAT-001 Price a EUR purchase in USD
    When I ask to "buy" 250000 of "EUR/USD"
    Then I see a quote
    And the quote shows the amount I will pay in "USD"

  @id:UAT-002
  Scenario: UAT-002 Selling is priced below buying
    When I ask to "buy" 1000000 of "USD/JPY"
    And I note the price
    And I ask to "sell" 1000000 of "USD/JPY"
    Then the price is lower than the one I noted

  @id:UAT-003
  Scenario: UAT-003 A mistyped amount is explained
    When I ask to "buy" -100 of "GBP/USD"
    Then I am told the amount is not valid
    And I do not see a price
