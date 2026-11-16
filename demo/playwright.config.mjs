// Playwright runs the e2e and accessibility categories against the delivered jar
// (FXQUOTE_JAR, set by the evidence runner to the jar in out/artifacts/).
// It uses the installed Chrome (channel "chrome"); set PW_CHANNEL="" to use
// Playwright's bundled Chromium instead where it can be downloaded.
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.DEMO_PORT || 4310);
const channel = process.env.PW_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.mjs", "a11y/**/*.spec.mjs"],
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...(channel ? { channel } : {}),
    trace: "off",
  },
  webServer: {
    command: `java -jar ${process.env.FXQUOTE_JAR}`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
  },
});
