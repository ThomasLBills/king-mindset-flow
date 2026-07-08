import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for Liberated Kings.
 *
 * Set E2E_BASE_URL to the deploy you want to test (defaults to the local
 * Vite dev server). Provide the following credentials via environment
 * variables — specs will skip cleanly when a required one is absent so
 * CI never fails on missing fixtures:
 *
 *   E2E_USER_EMAIL              — a normal user with an active entitlement
 *   E2E_USER_PASSWORD
 *   E2E_UNPAID_EMAIL            — a normal user with NO entitlement (paywall)
 *   E2E_UNPAID_PASSWORD
 *   E2E_ADMIN_EMAIL             — admin who can impersonate
 *   E2E_ADMIN_PASSWORD
 *   E2E_IMPERSONATE_TARGET_ID   — user_id of a non-admin to impersonate
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});