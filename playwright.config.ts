import { defineConfig, devices } from "@playwright/test";

const PORT = 3110;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E suite runs against a production build served on port 3110 and the
 * isolated test database on port 5434 (bootstrapped by e2e/serve.sh).
 *
 * Every test talks to that one shared database, so the run is serialised:
 * one worker, no file-level parallelism, and each test creates its own
 * uniquely named fixtures instead of relying on leftovers.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bash e2e/serve.sh",
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 360_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
