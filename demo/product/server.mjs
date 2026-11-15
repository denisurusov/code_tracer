// FX Quote demo service: a JSON API and one static page, on node:http.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv from "ajv";
import { quote, findRate } from "./lib/quote.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const querySchema = {
  type: "object",
  additionalProperties: false,
  required: ["pair", "amount", "side"],
  properties: {
    pair: { type: "string", pattern: "^[A-Z]{6}$" },
    amount: { type: "number", exclusiveMinimum: 0, maximum: 10_000_000 },
    side: { type: "string", enum: ["buy", "sell"] },
  },
};
const validateQuery = new Ajv({ coerceTypes: true, allErrors: false }).compile(querySchema);

const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/app.css": ["app.css", "text/css; charset=utf-8"],
};

export function loadRates(file = join(here, "data", "rates.json")) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function send(res, status, body, type = "application/json") {
  const payload = type === "application/json" ? JSON.stringify(body) : body;
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'self'",
  });
  res.end(payload);
}

export function createApp({ rates = loadRates() } = {}) {
  return createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });

    if (STATIC[url.pathname]) {
      const [file, type] = STATIC[url.pathname];
      return send(res, 200, readFileSync(join(here, "public", file)), type);
    }
    if (url.pathname === "/api/health") return send(res, 200, { status: "ok", pairs: rates.length });
    if (url.pathname === "/api/pairs") return send(res, 200, rates.map((r) => r.pair));
    if (url.pathname === "/api/quote") {
      const q = Object.fromEntries(url.searchParams);
      if (!validateQuery(q)) {
        const e = validateQuery.errors[0];
        return send(res, 400, { error: `${e.instancePath.slice(1) || "query"} ${e.message}` });
      }
      if (!findRate(rates, q.pair)) return send(res, 404, { error: `unknown pair ${q.pair}` });
      return send(res, 200, quote(rates, q));
    }
    return send(res, 404, { error: "not found" });
  });
}

/** Start on `port` (0 = any free port). Resolves to { server, url }. */
export function start(port = 0, opts) {
  const server = createApp(opts);
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await start(Number(process.env.PORT || 3000));
  console.log(`fx-quote listening on ${url}`);
}
