import { test, expect } from "@playwright/test";
import { loginWithPassword, requireEnv } from "./helpers/auth";

test.describe("entitlements: paywall gate", () => {
  test("unpaid user hitting /app is redirected to /upgrade", async ({ page }) => {
    const env = requireEnv("E2E_UNPAID_EMAIL", "E2E_UNPAID_PASSWORD");
    test.skip(!env, "E2E_UNPAID_EMAIL/E2E_UNPAID_PASSWORD not set");

    await loginWithPassword(page, env!.E2E_UNPAID_EMAIL, env!.E2E_UNPAID_PASSWORD);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // EntitlementGuard should push to /upgrade (or /onboarding first).
    await page.waitForURL(
      (url) => url.pathname.startsWith("/upgrade") || url.pathname.startsWith("/onboarding"),
      { timeout: 15_000 },
    );
    expect(page.url()).toMatch(/\/upgrade|\/onboarding/);
  });

  test("unpaid user cannot open a locked lesson", async ({ page }) => {
    const env = requireEnv("E2E_UNPAID_EMAIL", "E2E_UNPAID_PASSWORD");
    test.skip(!env, "E2E_UNPAID_EMAIL/E2E_UNPAID_PASSWORD not set");

    await loginWithPassword(page, env!.E2E_UNPAID_EMAIL, env!.E2E_UNPAID_PASSWORD);
    await page.goto("/library");
    await page.waitForURL(
      (url) => url.pathname.startsWith("/upgrade") || url.pathname.startsWith("/onboarding"),
      { timeout: 15_000 },
    );
  });
});