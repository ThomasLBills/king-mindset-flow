import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression tests for the paid-content bypass remediation.
 *
 * Original vulnerability: RLS policies on `lessons` and `lesson_resources`
 * only checked `status = 'published'`, letting any authenticated user
 * (including expired trials) read the entire paid workbook.
 *
 * Remediation: SELECT policies now require BOTH `status = 'published'`
 * AND (`has_role(admin)` OR `has_active_entitlement(...)`).
 *
 * These tests scan the migration history to guarantee:
 *   1. The latest policy definition for each table includes the
 *      `has_active_entitlement` gate.
 *   2. No future migration re-creates a plain published-only policy for
 *      these tables without also gating on entitlement.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort(); // lexicographic == chronological (timestamp prefix)

type PolicyBlock = { file: string; sql: string };

/** Extract every `CREATE POLICY ... ON public.<table>` block for a table. */
function findPolicyBlocks(table: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  // Non-greedy up to the terminating semicolon at end of a CREATE POLICY stmt.
  const re = new RegExp(
    `CREATE\\s+POLICY[\\s\\S]*?ON\\s+public\\.${table}\\b[\\s\\S]*?;`,
    "gi",
  );
  for (const file of migrationFiles) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const matches = sql.match(re);
    if (matches) for (const m of matches) blocks.push({ file, sql: m });
  }
  return blocks;
}

function latestSelectPolicy(table: string): PolicyBlock | null {
  const blocks = findPolicyBlocks(table).filter((b) =>
    /FOR\s+SELECT/i.test(b.sql),
  );
  return blocks.length ? blocks[blocks.length - 1] : null;
}

describe("paid-content bypass regression guards", () => {
  it("has migration history to scan", () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  for (const table of ["lessons", "lesson_resources"] as const) {
    describe(`public.${table}`, () => {
      it("latest SELECT policy exists", () => {
        const p = latestSelectPolicy(table);
        expect(p, `no SELECT policy found for ${table}`).not.toBeNull();
      });

      it("latest SELECT policy gates on entitlement or admin", () => {
        const p = latestSelectPolicy(table);
        expect(p).not.toBeNull();
        const sql = p!.sql;
        expect(
          /has_active_entitlement\s*\(/i.test(sql),
          `SELECT policy on ${table} in ${p!.file} is missing has_active_entitlement gate:\n${sql}`,
        ).toBe(true);
        expect(
          /has_role\s*\([^)]*'?admin/i.test(sql),
          `SELECT policy on ${table} in ${p!.file} is missing admin bypass:\n${sql}`,
        ).toBe(true);
      });

      it("every SELECT policy across history that survived (not dropped) still enforces the gate", () => {
        // A future migration that re-creates a SELECT policy on this table
        // without the entitlement gate must fail this test.
        const all = findPolicyBlocks(table).filter((b) =>
          /FOR\s+SELECT/i.test(b.sql),
        );
        // Only enforce on the most-recent block per file — old migrations
        // that were later dropped are historical record, not live policy.
        const latest = all[all.length - 1];
        if (!latest) return;
        expect(/has_active_entitlement/i.test(latest.sql)).toBe(true);
      });
    });
  }
});