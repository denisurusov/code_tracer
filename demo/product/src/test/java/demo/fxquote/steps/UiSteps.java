package demo.fxquote.steps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.SelectOption;
import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UAT steps: drive the page in a real browser with Playwright for Java. Uses the
 * installed Chrome (channel "chrome", override with PW_CHANNEL; empty = bundled Chromium).
 */
public class UiSteps {
  private static Playwright playwright;
  private static Browser browser;

  private Page page;
  private BigDecimal noted;

  private static Browser browser() {
    if (browser == null) {
      playwright = Playwright.create();
      String channel = System.getenv().getOrDefault("PW_CHANNEL", "chrome");
      BrowserType.LaunchOptions opts = new BrowserType.LaunchOptions();
      if (!channel.isEmpty()) opts.setChannel(channel);
      browser = playwright.chromium().launch(opts);
    }
    return browser;
  }

  @AfterAll
  public static void closeBrowser() {
    if (playwright != null) playwright.close();
  }

  @After
  public void closePage() {
    if (page != null) page.close();
  }

  @Given("I have the FX Quote page open")
  public void pageOpen() {
    page = browser().newPage();
    page.navigate(Service.baseUrl());
    page.locator("#pair option").first().waitFor(new com.microsoft.playwright.Locator.WaitForOptions()
        .setState(com.microsoft.playwright.options.WaitForSelectorState.ATTACHED));
  }

  @When("I ask to {string} {bigdecimal} of {string}")
  public void ask(String side, BigDecimal amount, String label) {
    page.getByLabel("Currency pair").selectOption(new SelectOption().setLabel(label));
    page.getByLabel("Amount").fill(amount.toPlainString());
    page.getByLabel("buy".equals(side) ? "Buy" : "Sell").check();
    page.waitForResponse(r -> r.url().contains("/api/quote"),
        () -> page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Get quote")).click());
  }

  @When("I note the price")
  public void notePrice() {
    noted = currentPrice();
  }

  @Then("I see a quote")
  public void seeQuote() {
    assertTrue(page.locator("#result").textContent().matches(".* at \\d.*"), page.locator("#result").textContent());
  }

  @Then("the quote shows the amount I will pay in {string}")
  public void showsAmountIn(String ccy) {
    String text = page.locator("#result").textContent();
    assertTrue(text.matches(".*= [\\d,.]+ " + ccy), text);
  }

  @Then("the price is lower than the one I noted")
  public void lowerPrice() {
    assertTrue(currentPrice().compareTo(noted) < 0, currentPrice() + " is not below " + noted);
  }

  @Then("I am told the amount is not valid")
  public void toldInvalid() {
    String alert = page.getByRole(AriaRole.ALERT).textContent();
    assertTrue(alert.toLowerCase().contains("amount"), alert);
  }

  @Then("I do not see a price")
  public void noPrice() {
    assertEquals("No quote.", page.locator("#result").textContent());
  }

  private BigDecimal currentPrice() {
    Matcher m = Pattern.compile(" at ([\\d.]+) ").matcher(page.locator("#result").textContent());
    assertTrue(m.find(), "no price shown");
    return new BigDecimal(m.group(1));
  }
}
