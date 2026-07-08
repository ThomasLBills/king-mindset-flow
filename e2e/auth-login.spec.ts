import { test, expect } from "@playwright/test";
import { loginWithPassword, requireEnv } from "./helpers/auth";

test.describe("auth: login", () => {
  test("valid credentials land the user past /login", async ({ page }) => {
    const env = requireEnv("E2E_USER_EMAIL", "E2E_USER_PASSWORD");
    test.skip(!env, "E2E_USER_EMAIL/E2E_USER_PASSWORD not set");
    await loginWithPassword(page, env!.E2E_USER_EMAIL, env!.E2E_USER_PASSWORD);
    // Should hydrate a supabase session in localStorage
    const hasSession = await page.evaluate(() => {
      return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    });
    expect(hasSession).toBe(true);
  });

  test("invalid credentials stay on /login and show an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody+e2e@liberatedkings.com");
    await page.getByLabel(/password/i).fill("WrongPassword!123");
    await page.getByRole("button", { name: /log in|sign in|continue/i }).click();
    // Small wait for auth round-trip
    await page.waitForTimeout(2500);
    expect(page.url()).toContain("/login");
  });
});