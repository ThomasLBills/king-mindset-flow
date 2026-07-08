import { expect, Page } from "@playwright/test";

export function requireEnv(...keys: string[]): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = process.env[k];
    if (!v) return null;
    out[k] = v;
  }
  return out;
}

/** Log in through the real /login form. Waits for redirect off /login. */
export async function loginWithPassword(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /log in|sign in|continue/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
  expect(page.url()).not.toContain("/login");
}