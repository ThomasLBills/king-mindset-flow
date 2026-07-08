import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression tests for the admin-impersonation guardrails.
 *
 * These protect two invariants that, if regressed, would let a signed-in
 * non-admin (or an admin acting-as another admin) escalate privileges or
 * perform destructive actions while impersonating:
 *
 *   1. The `admin-impersonate` edge function must:
 *      - Reject callers without a Bearer token (401)
 *      - Reject callers who lack the `admin` role (403)
 *      - Refuse to impersonate another admin (403)
 *      - Never trust `SUPABASE_ANON_KEY` alone for admin verification
 *
 *   2. Client-side destructive surfaces must remain gated behind
 *      `useIsImpersonating()` — currently: chat message send, chat file
 *      upload, and Stripe billing portal open.
 */

const ROOT = process.cwd();
const EDGE = join(ROOT, "supabase", "functions", "admin-impersonate", "index.ts");

const GUARDED_CLIENT_FILES = [
  "src/components/chat/MessageComposer.tsx",
  "src/pages/Billing.tsx",
];

describe("admin-impersonate edge function guards", () => {
  it("edge function source exists", () => {
    expect(existsSync(EDGE), `missing ${EDGE}`).toBe(true);
  });

  const src = existsSync(EDGE) ? readFileSync(EDGE, "utf8") : "";

  it("uses SERVICE_ROLE_KEY (not anon) for privileged admin ops", () => {
    expect(/SUPABASE_SERVICE_ROLE_KEY/.test(src)).toBe(true);
  });

  it("requires a Bearer Authorization header (401 on missing)", () => {
    expect(/authorization/i.test(src)).toBe(true);
    expect(/Bearer\s/.test(src)).toBe(true);
    expect(/401/.test(src)).toBe(true);
    expect(/Unauthorized/.test(src)).toBe(true);
  });

  it("verifies the caller's JWT server-side via auth.getUser", () => {
    expect(/auth\.getUser\s*\(/.test(src)).toBe(true);
  });

  it("checks caller has the admin role in user_roles before proceeding", () => {
    // Must query user_roles for role = 'admin' scoped to the caller.
    expect(/from\(["']user_roles["']\)/.test(src)).toBe(true);
    expect(/eq\(\s*["']role["']\s*,\s*["']admin["']\s*\)/.test(src)).toBe(true);
    // Forbidden path must be present.
    expect(/403/.test(src)).toBe(true);
    expect(/Forbidden/.test(src)).toBe(true);
  });

  it("blocks impersonating another admin (target role check)", () => {
    // The function looks up the TARGET user's role in user_roles and rejects
    // if it is 'admin'. Guard against removing that check.
    expect(
      /Cannot impersonate another admin/i.test(src),
      "target-admin rejection message missing from admin-impersonate",
    ).toBe(true);
  });

  it("blocks self-impersonation", () => {
    expect(/Cannot impersonate yourself/i.test(src)).toBe(true);
  });

  it("writes an audit-log row on impersonation start", () => {
    expect(/admin_audit_log/.test(src)).toBe(true);
    expect(/impersonation_start/.test(src)).toBe(true);
  });
});

describe("client-side impersonation blocks on destructive actions", () => {
  for (const rel of GUARDED_CLIENT_FILES) {
    describe(rel, () => {
      const full = join(ROOT, rel);

      it("file exists", () => {
        expect(existsSync(full), `missing ${full}`).toBe(true);
      });

      const src = existsSync(full) ? readFileSync(full, "utf8") : "";

      it("imports useIsImpersonating from ImpersonationContext", () => {
        expect(
          /useIsImpersonating[\s\S]{0,120}from\s+["']@\/contexts\/ImpersonationContext["']/.test(
            src,
          ),
        ).toBe(true);
      });

      it("invokes useIsImpersonating() in a component body", () => {
        expect(/useIsImpersonating\s*\(\s*\)/.test(src)).toBe(true);
      });

      it("early-returns or short-circuits when isImpersonating is true", () => {
        // Either a guard block `if (isImpersonating)` inside a handler,
        // or `disabled={... isImpersonating}` on the trigger control.
        const hasIfGuard = /if\s*\(\s*isImpersonating\b/.test(src);
        const hasDisabled = /disabled=\{[^}]*isImpersonating/.test(src);
        expect(
          hasIfGuard || hasDisabled,
          `${rel} no longer gates its destructive action on isImpersonating`,
        ).toBe(true);
      });
    });
  }
});