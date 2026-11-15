// Step definitions shared by the integration, contract and UAT features.
import { Given, When, Then, BeforeAll, AfterAll, After, setDefaultTimeout } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "./formats.mjs";
import { chromium } from "@playwright/test";
import { start } from "../../../product/server.mjs";

setDefaultTimeout(30_000);

let service;
let browser;

BeforeAll(async () => {
  service = await start(0);
});
AfterAll(async () => {
  await browser?.close();
  await new Promise((r) => service.server.close(r));
});

// ---------- HTTP ----------
Given("the FX Quote service is running", function () {
  this.baseUrl = service.url;
});

When("I GET {string}", async function (path) {
  this.path = path.split("?")[0];
  const res = await fetch(service.url + path);
  this.status = res.status;
  this.body = await res.json();
});

When("I request a quote for {float} {string} on the {string} side", async function (amount, pair, side) {
  this.path = "/api/quote";
  const res = await fetch(`${service.url}/api/quote?${new URLSearchParams({ pair, amount, side })}`);
  this.status = res.status;
  this.body = await res.json();
});

Then("the response status is {int}", function (status) {
  assert.equal(this.status, status, JSON.stringify(this.body));
});

Then("the response field {string} is {string}", function (field, value) {
  assert.equal(this.body[field], value);
});

Then("the response field {string} is {float}", function (field, value) {
  assert.equal(this.body[field], value);
});

Then("the response has an error message", function () {
  assert.equal(typeof this.body.error, "string");
  assert.ok(this.body.error.length > 0);
});

// ---------- OpenAPI contract ----------
const openapi = JSON.parse(readFileSync(new URL("../../../product/openapi.json", import.meta.url), "utf8"));
const ajv = addFormats(new Ajv({ strict: false, allErrors: true }));
ajv.addSchema({ $id: "openapi", components: openapi.components });

function responseSchema(path, status) {
  const op = openapi.paths[path]?.get;
  assert.ok(op, `no GET operation for ${path} in openapi.json`);
  const resp = op.responses[String(status)];
  assert.ok(resp, `openapi.json declares no ${status} response for ${path}`);
  const schema = resp.content["application/json"].schema;
  return JSON.parse(JSON.stringify(schema).replaceAll('"#/components', '"openapi#/components'));
}

Then("the response conforms to the OpenAPI response for {string}", function (path) {
  const validate = ajv.compile(responseSchema(path, this.status));
  assert.ok(validate(this.body), ajv.errorsText(validate.errors));
});

// ---------- UI (UAT) ----------
After(async function () {
  await this.page?.close();
});

Given("I have the FX Quote page open", async function () {
  browser ??= await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
  this.page = await browser.newPage();
  await this.page.goto(service.url);
  await this.page.locator("#pair option").first().waitFor({ state: "attached" });
});

When("I ask to {string} {float} of {string}", async function (side, amount, label) {
  const p = this.page;
  await p.getByLabel("Currency pair").selectOption({ label });
  await p.getByLabel("Amount").fill(String(amount));
  await p.getByLabel(side === "buy" ? "Buy" : "Sell").check();
  const response = p.waitForResponse((r) => r.url().includes("/api/quote"));
  await p.getByRole("button", { name: "Get quote" }).click();
  await response;
});

When("I note the price", async function () {
  this.noted = await currentPrice(this.page);
});

Then("I see a quote", async function () {
  assert.match(await this.page.locator("#result").textContent(), / at \d/);
});

Then("the quote shows the amount I will pay in {string}", async function (ccy) {
  assert.match(await this.page.locator("#result").textContent(), new RegExp(`= [\\d,.]+ ${ccy}$`));
});

Then("the price is lower than the one I noted", async function () {
  assert.ok((await currentPrice(this.page)) < this.noted);
});

Then("I am told the amount is not valid", async function () {
  assert.match(await this.page.getByRole("alert").textContent(), /amount/i);
});

Then("I do not see a price", async function () {
  assert.equal(await this.page.locator("#result").textContent(), "No quote.");
});

async function currentPrice(page) {
  const text = await page.locator("#result").textContent();
  return Number(text.match(/ at ([\d.]+) /)[1]);
}
