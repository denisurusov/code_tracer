// Automated accessibility checks with axe-core, WCAG 2.1 A and AA rules.
// Each check writes its raw axe results so the pipeline can convert them to SARIF.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "out/raw/accessibility";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page, id) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/axe-${id}.json`, JSON.stringify({ id, url: page.url(), ...results }, null, 2));
  return results;
}

test("A11Y-001 initial page has no WCAG 2.1 A/AA violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pair option")).toHaveCount(5);
  const { violations } = await scan(page, "A11Y-001");
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("A11Y-002 page with a quote and with an error has no violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pair option")).toHaveCount(5);
  await page.getByLabel("Amount").fill("500");
  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByRole("status")).toContainText(" at ");
  await page.getByLabel("Amount").fill("-1");
  await page.getByRole("button", { name: "Get quote" }).click();
  await expect(page.getByRole("alert")).not.toBeEmpty();
  const { violations } = await scan(page, "A11Y-002");
  expect(violations.map((v) => v.id)).toEqual([]);
});
