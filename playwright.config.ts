import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(__dirname, ".env.local") });

const baseURL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false, // shared DB state (posters/orders) — keep sequential per file
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Reuses a server you already have running with `npm run dev`; starts one
  // itself otherwise. Set PLAYWRIGHT_SKIP_WEBSERVER=1 if you're pointing
  // NEXT_PUBLIC_SITE_URL at a deployed/staging environment instead.
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
