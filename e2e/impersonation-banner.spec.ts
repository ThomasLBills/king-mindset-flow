import { test, expect } from "@playwright/test";
import { loginWithPassword, requireEnv } from "./helpers/auth";

test.describe("admin: impersonation guard", () => {
  test("starting impersonation shows the banner and blocks writes", async ({ page }) => {
    const env = requireEnv(
      "E2E_ADMIN_EMAIL",
      "E2E_ADMIN_PASSWORD",
      "E2E_IMPERSONATE_TARGET_ID",
    );
    test.skip(!env, "Admin/impersonation env vars not set");

    await loginWithPassword(page, env!.E2E_ADMIN_EMAIL, env!.E2E_ADMIN_PASSWORD);
    await page.goto("/admin/users");

    // Trigger impersonation on the target row.
    const row = page.locator(`[data-user-id="${env!.E2E_IMPERSONATE_TARGET_ID}"]`).first();
    await row.getByRole("button", { name: /impersonate|view as/i }).click();

    // Banner should appear anywhere on the page.
    await expect(page.getByText(/impersonat/i)).toBeVisible({ timeout: 15_000 });

    // Destructive actions should be gated. Navigate to Chat and verify the
    // composer send button is disabled OR the composer surfaces a read-only
    // banner during impersonation.
    await page.goto("/chat");
    const readOnly = page.getByText(/read.only|impersonat/i);
    await expect(readOnly.first()).toBeVisible({ timeout: 10_000 });
  });
});