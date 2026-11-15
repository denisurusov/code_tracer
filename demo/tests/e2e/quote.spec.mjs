// End-to-end tests in a real browser. Each title starts with its catalog ID.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pair option")).toHaveCount(5);
});

test("E2E-001 page loads and lists all supported pairs", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FX Quote");
  await expect(page.locator("#pair option")).toHaveText(["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD"]);
});

test("E2E-002 submitting the form shows a quote", async ({ page }) => {
  await page.getByLabel("Currency pair").selectOption({ label: "EUR/USD" });
  await page.getByLabel("Amount").fill("1000");
  await page.getByLabel("Buy").check();
  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByRole("status")).toHaveText("Buy 1,000 EUR at 1.08485 = 1,084.85 USD");
});

test("E2E-003 an invalid amount shows an error and no price", async ({ page }) => {
  await page.getByLabel("Amount").fill("0");
  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByRole("alert")).toContainText("amount");
  await expect(page.getByRole("status")).toHaveText("No quote.");
});
